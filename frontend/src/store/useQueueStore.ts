import { create } from 'zustand';

export type PriorityLevel = 'NORMAL' | 'PRIORITY' | 'EMERGENCY';
export type PatientStatus = 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';

export interface Patient {
  _id: string;
  name: string;
  tokenNumber: number;
  queueId: string;
  priorityLevel: PriorityLevel;
  status: PatientStatus;
  joinedAt: string;
  calledAt?: string;
  completedAt?: string;
  tokensAhead?: number;
  estimatedWaitTime?: number;
}

interface QueueState {
  waiting: Patient[];
  current: Patient | null;
  avgConsultationTime: number;
  intelligenceMessage: string;
  isConnected: boolean;
  setQueueState: (state: { waiting: Patient[], current: Patient | null, avgConsultationTime: number, intelligenceMessage?: string }) => void;
  setConnectionStatus: (status: boolean) => void;
}

export const useQueueStore = create<QueueState>((set) => ({
  waiting: [],
  current: null,
  avgConsultationTime: 10,
  intelligenceMessage: 'Analyzing queue data...',
  isConnected: false,
  setQueueState: (state) => set({ ...state, intelligenceMessage: state.intelligenceMessage || 'Analyzing queue data...' }),
  setConnectionStatus: (status) => set({ isConnected: status })
}));
