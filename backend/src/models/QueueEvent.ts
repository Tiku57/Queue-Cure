import mongoose, { Schema, Document } from 'mongoose';

export enum EventType {
  PATIENT_ADDED = 'PATIENT_ADDED',
  PATIENT_CALLED = 'PATIENT_CALLED',
  PATIENT_COMPLETED = 'PATIENT_COMPLETED',
  QUEUE_PAUSED = 'QUEUE_PAUSED',
  QUEUE_RESUMED = 'QUEUE_RESUMED',
  PRIORITY_CHANGED = 'PRIORITY_CHANGED'
}

export interface IQueueEvent extends Document {
  clinicId: mongoose.Types.ObjectId;
  eventType: EventType;
  patientId?: mongoose.Types.ObjectId;
  details?: Record<string, any>;
  createdAt: Date;
}

const QueueEventSchema: Schema = new Schema({
  clinicId: { type: Schema.Types.ObjectId, ref: 'Clinic', required: true },
  eventType: { type: String, enum: Object.values(EventType), required: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient' },
  details: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

export const QueueEvent = mongoose.model<IQueueEvent>('QueueEvent', QueueEventSchema);
