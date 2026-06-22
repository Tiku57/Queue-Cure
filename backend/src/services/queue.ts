import mongoose from 'mongoose';
import crypto from 'crypto';
import { Patient, PatientStatus, PriorityLevel } from '../models/Patient';
import { ConsultationLog } from '../models/ConsultationLog';
import { Clinic } from '../models/Clinic';
import { QueueEvent, EventType } from '../models/QueueEvent';

export class QueueService {
  private static PRIORITY_WEIGHTS = {
    [PriorityLevel.EMERGENCY]: 3,
    [PriorityLevel.PRIORITY]: 2,
    [PriorityLevel.NORMAL]: 1,
  };

  /**
   * Logs an event for Event Sourcing
   */
  private static async logEvent(clinicId: mongoose.Types.ObjectId, eventType: EventType, patientId?: mongoose.Types.ObjectId, details?: any) {
    await QueueEvent.create({ clinicId, eventType, patientId, details });
  }

  /**
   * Calculates dynamic wait time metrics and doctor intelligence stats
   */
  static async getWaitTimeIntelligence(clinicId: mongoose.Types.ObjectId) {
    const clinic = await Clinic.findById(clinicId);
    const defaultTime = clinic?.defaultConsultationTime || 10;

    // Last 10 consultations (Rolling Average)
    const recentLogs = await ConsultationLog.find({ clinicId }).sort({ endTime: -1 }).limit(10);
    const rollingAvg = recentLogs.length < 3 
      ? defaultTime 
      : recentLogs.reduce((sum, log) => sum + log.durationMinutes, 0) / recentLogs.length;

    // Today's average vs Historical
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todaysLogs = await ConsultationLog.find({ clinicId, endTime: { $gte: startOfDay } });
    
    const todaysAvg = todaysLogs.length > 0 
      ? todaysLogs.reduce((sum, log) => sum + log.durationMinutes, 0) / todaysLogs.length
      : rollingAvg;

    let intelligenceMessage = "Queue moving at normal pace";
    if (todaysLogs.length >= 3) {
      if (todaysAvg < rollingAvg * 0.9) {
        const percent = Math.round((1 - (todaysAvg / rollingAvg)) * 100);
        intelligenceMessage = `Doctor is running ${percent}% faster than average today`;
      } else if (todaysAvg > rollingAvg * 1.1) {
         const percent = Math.round(((todaysAvg / rollingAvg) - 1) * 100);
         intelligenceMessage = `Queue is moving ${percent}% slower than average today`;
      }
    }

    return {
      rollingAvg,
      intelligenceMessage,
      todaysAvg
    };
  }

  /**
   * Gets the full state of the queue and calculated wait time metrics.
   */
  static async getQueueState(clinicId: string) {
    const cId = new mongoose.Types.ObjectId(clinicId);
    
    let waitingPatients = await Patient.find({ clinicId: cId, status: PatientStatus.WAITING });
    const currentPatient = await Patient.findOne({ clinicId: cId, status: PatientStatus.IN_CONSULTATION });
    
    // Sort logic: Priority Descending, then Token Number Ascending
    waitingPatients.sort((a, b) => {
      const weightA = this.PRIORITY_WEIGHTS[a.priorityLevel];
      const weightB = this.PRIORITY_WEIGHTS[b.priorityLevel];
      if (weightA !== weightB) return weightB - weightA;
      return a.tokenNumber - b.tokenNumber;
    });

    const { rollingAvg, intelligenceMessage } = await this.getWaitTimeIntelligence(cId);

    // Calculate remaining time for current patient
    let remainingCurrent = 0;
    if (currentPatient && currentPatient.calledAt) {
      const elapsedMinutes = (Date.now() - currentPatient.calledAt.getTime()) / 60000;
      remainingCurrent = Math.max(0, rollingAvg - elapsedMinutes);
    }

    const waitingWithEstimates = waitingPatients.map((patient, index) => {
      let estimatedWaitTime = 0;
      if (index === 0 && currentPatient) {
        estimatedWaitTime = remainingCurrent;
      } else {
        const ahead = currentPatient ? index : index;
        estimatedWaitTime = remainingCurrent + (ahead * rollingAvg);
      }
      
      return {
        ...patient.toJSON(),
        tokensAhead: index,
        estimatedWaitTime: Math.max(1, Math.round(estimatedWaitTime)) // Never show 0 if waiting
      };
    });

    return {
      waiting: waitingWithEstimates,
      current: currentPatient,
      avgConsultationTime: Math.round(rollingAvg * 10) / 10,
      intelligenceMessage
    };
  }

  /**
   * Adds a new patient atomically
   */
  static async addPatient(clinicId: string, name: string, priorityLevel: PriorityLevel = PriorityLevel.NORMAL) {
    const cId = new mongoose.Types.ObjectId(clinicId);
    const lastPatient = await Patient.findOne({ clinicId: cId }).sort({ tokenNumber: -1 });
    const nextToken = lastPatient ? lastPatient.tokenNumber + 1 : 1;
    const queueId = crypto.randomBytes(8).toString('hex');

    const patient = new Patient({
      clinicId: cId,
      name,
      tokenNumber: nextToken,
      queueId,
      priorityLevel,
      status: PatientStatus.WAITING
    });

    await patient.save();
    await this.logEvent(cId, EventType.PATIENT_ADDED, patient._id, { tokenNumber: nextToken, priorityLevel });
    return patient;
  }

  /**
   * Transitions to the next patient in the queue using atomic updates
   */
  static async callNextPatient(clinicId: string) {
    const cId = new mongoose.Types.ObjectId(clinicId);

    // Complete current patient if exists
    const currentPatient = await Patient.findOneAndUpdate(
      { clinicId: cId, status: PatientStatus.IN_CONSULTATION },
      { status: PatientStatus.COMPLETED, completedAt: new Date() },
      { new: true }
    );

    if (currentPatient && currentPatient.calledAt) {
      const durationMs = currentPatient.completedAt!.getTime() - currentPatient.calledAt.getTime();
      const durationMinutes = durationMs / 60000;
      
      if (durationMinutes > 0) {
        await ConsultationLog.create({
          clinicId: cId,
          patientId: currentPatient._id,
          startTime: currentPatient.calledAt,
          endTime: currentPatient.completedAt,
          durationMinutes
        });
        await this.logEvent(cId, EventType.PATIENT_COMPLETED, currentPatient._id, { durationMinutes });
      }
    }

    // Call next: Find all waiting, sort, then pick the top one
    // Since findOneAndUpdate doesn't support complex custom sorting without aggregation,
    // we fetch the top one manually and then atomically lock it.
    let waitingPatients = await Patient.find({ clinicId: cId, status: PatientStatus.WAITING });
    if (waitingPatients.length === 0) return null;

    waitingPatients.sort((a, b) => {
      const weightA = this.PRIORITY_WEIGHTS[a.priorityLevel];
      const weightB = this.PRIORITY_WEIGHTS[b.priorityLevel];
      if (weightA !== weightB) return weightB - weightA;
      return a.tokenNumber - b.tokenNumber;
    });

    const nextPatientId = waitingPatients[0]._id;

    const nextPatient = await Patient.findOneAndUpdate(
      { _id: nextPatientId, status: PatientStatus.WAITING },
      { status: PatientStatus.IN_CONSULTATION, calledAt: new Date() },
      { new: true }
    );

    if (nextPatient) {
      await this.logEvent(cId, EventType.PATIENT_CALLED, nextPatient._id);
    }

    return nextPatient;
  }
}
