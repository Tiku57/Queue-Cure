'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueueStore } from '../store/useQueueStore';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const CLINIC_ID = process.env.NEXT_PUBLIC_CLINIC_ID || '';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const { setQueueState, setConnectionStatus, isConnected } = useQueueStore();
  const isConnectedRef = useRef(isConnected);

  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        const url = new URL(`${API_URL}/api/queue`);
        if (CLINIC_ID) url.searchParams.append('clinicId', CLINIC_ID);
        const res = await fetch(url.toString());
        const data = await res.json();
        setQueueState(data);
      } catch (err) {
        console.error('Failed to fetch queue state', err);
      }
    };

    fetchInitialState();

    // Socket Setup
    socketRef.current = io(API_URL);

    socketRef.current.on('connect', () => {
      setConnectionStatus(true);
      socketRef.current?.emit('join_clinic', CLINIC_ID);
      // Ensure we haven't missed events while connecting/reconnecting
      fetchInitialState();
    });

    socketRef.current.on('disconnect', () => {
      setConnectionStatus(false);
    });

    socketRef.current.on('QUEUE_UPDATED', (state) => {
      setQueueState(state);
    });

    socketRef.current.on('PATIENT_ADDED', (patient) => {
      toast.success(`Token ${patient.tokenNumber} generated for ${patient.name}`);
    });

    socketRef.current.on('NEXT_PATIENT_CALLED', (patient) => {
      if (patient) {
        toast.info(`Token ${patient.tokenNumber} is now being served.`);
      }
    });

    // Offline Recovery Fallback: Poll every 10 seconds if disconnected
    const fallbackTimer = setInterval(() => {
      if (!isConnectedRef.current) {
        console.log('Socket disconnected. Firing fallback REST sync...');
        fetchInitialState();
      }
    }, 10000);

    return () => {
      socketRef.current?.disconnect();
      clearInterval(fallbackTimer);
    };
  }, [setQueueState, setConnectionStatus]);

  return <>{children}</>;
}
