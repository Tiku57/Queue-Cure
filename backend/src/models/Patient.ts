import mongoose, { Schema, Document } from 'mongoose';

export enum PriorityLevel {
  NORMAL = 'NORMAL',
  PRIORITY = 'PRIORITY',
  EMERGENCY = 'EMERGENCY'
}

export enum PatientStatus {
  WAITING = 'WAITING',
  IN_CONSULTATION = 'IN_CONSULTATION',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface IPatient extends Document {
  clinicId: mongoose.Types.ObjectId;
  name: string;
  tokenNumber: number;
  queueId: string; // Used for public QR tracking URL
  priorityLevel: PriorityLevel;
  status: PatientStatus;
  joinedAt: Date;
  calledAt?: Date;
  completedAt?: Date;
}

const PatientSchema: Schema = new Schema({
  clinicId: { type: Schema.Types.ObjectId, ref: 'Clinic', required: true },
  name: { type: String, required: true },
  tokenNumber: { type: Number, required: true },
  queueId: { type: String, required: true, unique: true },
  priorityLevel: { type: String, enum: Object.values(PriorityLevel), default: PriorityLevel.NORMAL },
  status: { type: String, enum: Object.values(PatientStatus), default: PatientStatus.WAITING },
  joinedAt: { type: Date, default: Date.now },
  calledAt: { type: Date },
  completedAt: { type: Date },
});

export const Patient = mongoose.model<IPatient>('Patient', PatientSchema);
