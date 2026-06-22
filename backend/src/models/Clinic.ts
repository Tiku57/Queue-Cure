import mongoose, { Schema, Document } from 'mongoose';

export interface IClinic extends Document {
  clinicName: string;
  defaultConsultationTime: number; // in minutes
  operatingHours: string;
  createdAt: Date;
}

const ClinicSchema: Schema = new Schema({
  clinicName: { type: String, required: true, default: 'QueueCure Clinic' },
  defaultConsultationTime: { type: Number, required: true, default: 10 },
  operatingHours: { type: String, default: '09:00 - 17:00' },
  createdAt: { type: Date, default: Date.now },
});

export const Clinic = mongoose.model<IClinic>('Clinic', ClinicSchema);
