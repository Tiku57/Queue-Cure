import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { connectDB } from './config/db';
import { QueueService } from './services/queue';
import { Clinic } from './models/Clinic';
import { Patient, PatientStatus, PriorityLevel } from './models/Patient';
import { ConsultationLog } from './models/ConsultationLog';
import { z } from 'zod';
import dotenv from 'dotenv';
import crypto from 'crypto';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

let DEFAULT_CLINIC_ID = '';

// Connect DB and Ensure Default Clinic
connectDB().then(async () => {
  let clinic = await Clinic.findOne();
  if (!clinic) {
    clinic = await Clinic.create({ clinicName: 'QueueCure General Hospital', defaultConsultationTime: 10 });
  }
  DEFAULT_CLINIC_ID = clinic._id.toString();
  console.log('Default Clinic ID:', DEFAULT_CLINIC_ID);
});

// Middleware to extract clinicId
const getClinicId = (req: express.Request) => {
  return (req.query.clinicId as string) || req.headers['x-clinic-id'] as string || DEFAULT_CLINIC_ID;
};

// Broadcast state to specific clinic room
const broadcastQueueState = async (clinicId: string) => {
  const state = await QueueService.getQueueState(clinicId);
  io.to(clinicId).emit('QUEUE_UPDATED', state);
};

// --- API Routes ---

app.get('/api/queue', async (req, res) => {
  try {
    const clinicId = getClinicId(req);
    const state = await QueueService.getQueueState(clinicId);
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

app.post('/api/patients', async (req, res) => {
  try {
    const clinicId = getClinicId(req);
    const schema = z.object({ 
      name: z.string().min(1),
      priorityLevel: z.nativeEnum(PriorityLevel).optional()
    });
    const { name, priorityLevel } = schema.parse(req.body);

    const patient = await QueueService.addPatient(clinicId, name, priorityLevel);
    io.to(clinicId).emit('PATIENT_ADDED', patient);
    await broadcastQueueState(clinicId);
    
    res.status(201).json(patient);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Invalid input' });
  }
});

app.post('/api/queue/call-next', async (req, res) => {
  try {
    const clinicId = getClinicId(req);
    const nextPatient = await QueueService.callNextPatient(clinicId);
    io.to(clinicId).emit('NEXT_PATIENT_CALLED', nextPatient);
    await broadcastQueueState(clinicId);
    
    res.json({ message: 'Next patient called', nextPatient });
  } catch (err) {
    res.status(500).json({ error: 'Failed to call next patient' });
  }
});

app.post('/api/queue/pause', async (req, res) => {
  try {
    const clinicId = getClinicId(req);
    io.to(clinicId).emit('QUEUE_PAUSED', { message: 'The doctor has paused the queue briefly.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to pause' });
  }
});

// Analytics Endpoint
app.get('/api/analytics', async (req, res) => {
  try {
    const clinicId = getClinicId(req);
    const logs = await ConsultationLog.find({ clinicId });
    const totalServed = logs.length;
    
    // Simulate chart data based on logs
    const chartData = [
      { name: '9 AM', waitTime: 12 },
      { name: '10 AM', waitTime: 18 },
      { name: '11 AM', waitTime: 25 },
      { name: '12 PM', waitTime: 30 },
      { name: '1 PM', waitTime: 15 },
    ]; // In a real app, this would aggregate logs by hour.

    res.json({
      totalServed,
      chartData,
      doctorUtilization: 85, // %
      longestWaitTime: 45 // min
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Demo Seeder
app.post('/api/demo/seed', async (req, res) => {
  try {
    const clinicId = getClinicId(req);
    
    // Clear existing
    await Patient.deleteMany({ clinicId });
    await ConsultationLog.deleteMany({ clinicId });

    // Create 20 historical logs (to feed the intelligence engine)
    const logs = Array.from({ length: 20 }).map((_, i) => ({
      clinicId,
      patientId: new mongoose.Types.ObjectId(),
      startTime: new Date(Date.now() - (i * 20 * 60000)),
      endTime: new Date(Date.now() - (i * 20 * 60000) + (Math.random() * 5 + 5) * 60000), // 5-10 min duration
      durationMinutes: Math.floor(Math.random() * 5 + 5)
    }));
    await ConsultationLog.insertMany(logs);

    // Create 1 Active Patient
    await Patient.create({
      clinicId,
      name: 'Eleanor Shellstrop',
      tokenNumber: 21,
      queueId: crypto.randomBytes(8).toString('hex'),
      status: PatientStatus.IN_CONSULTATION,
      calledAt: new Date(Date.now() - 4 * 60000), // 4 mins ago
    });

    // Create 10 Waiting Patients
    const priorities = [PriorityLevel.NORMAL, PriorityLevel.PRIORITY, PriorityLevel.EMERGENCY];
    const waitingPatients = Array.from({ length: 10 }).map((_, i) => ({
      clinicId,
      name: `Patient ${i + 22}`,
      tokenNumber: i + 22,
      queueId: crypto.randomBytes(8).toString('hex'),
      priorityLevel: priorities[Math.floor(Math.random() * priorities.length)],
      status: PatientStatus.WAITING
    }));
    await Patient.insertMany(waitingPatients);

    await broadcastQueueState(clinicId);
    res.json({ success: true, message: 'Demo data injected' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Socket Connections ---
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Client explicitly joins a clinic room
  socket.on('join_clinic', (clinicId: string) => {
    const targetRoom = clinicId || DEFAULT_CLINIC_ID;
    socket.join(targetRoom);
    console.log(`Socket ${socket.id} joined clinic ${targetRoom}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
