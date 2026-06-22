'use client';

import { useParams } from 'next/navigation';
import { useQueueStore } from '@/store/useQueueStore';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, Clock, CheckCircle2 } from 'lucide-react';

export default function TrackPatient() {
  const params = useParams();
  const queueId = params.id as string;
  const { waiting, current } = useQueueStore();

  const isCurrent = current?.queueId === queueId;
  const waitingPatient = waiting.find(p => p.queueId === queueId);
  const patient = isCurrent ? current : waitingPatient;

  if (!patient && waiting.length > 0) {
    // Basic check. In a real app, we'd fetch this specific patient's status if they aren't in the active queue (e.g., they finished).
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800">Consultation Complete</h1>
        <p className="text-slate-500 mt-2">Your token is no longer in the active queue.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md space-y-6">
        
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">QueueCure Live Track</h1>
          <p className="text-slate-500">Hello, {patient?.name || 'Loading...'}</p>
        </div>

        <Card className="shadow-lg border-0 overflow-hidden relative">
          <div className={`h-2 w-full ${isCurrent ? 'bg-emerald-500' : 'bg-blue-500'}`} />
          <CardContent className="pt-8 pb-10 px-6 text-center">
            <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">Your Token</div>
            <div className="text-7xl font-black text-slate-900 mb-8">{patient?.tokenNumber || '--'}</div>

            {isCurrent ? (
              <div className="animate-pulse bg-emerald-50 text-emerald-700 p-4 rounded-xl flex items-center justify-center gap-2">
                <Activity className="h-5 w-5" />
                <span className="font-bold text-lg">It&apos;s your turn! Please proceed.</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-slate-500 text-sm mb-1">Ahead of You</div>
                  <div className="text-3xl font-bold text-slate-800">{patient?.tokensAhead ?? '--'}</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <div className="flex items-center justify-center gap-1 text-orange-600 text-sm mb-1">
                    <Clock className="h-4 w-4" /> Est. Wait
                  </div>
                  <div className="text-3xl font-bold text-orange-600">{patient?.estimatedWaitTime ?? '--'} <span className="text-sm">m</span></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-400">
          This page updates automatically. No need to refresh.
        </p>
      </div>
    </div>
  );
}
