import mongoose, { Schema, Document } from 'mongoose';

export interface IConsultationLog extends Document {
  clinicId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
}

const ConsultationLogSchema: Schema = new Schema({
  clinicId: { type: Schema.Types.ObjectId, ref: 'Clinic', required: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  durationMinutes: { type: Number, required: true },
});

export const ConsultationLog = mongoose.model<IConsultationLog>('ConsultationLog', ConsultationLogSchema);
