'use client';

import { useEffect, useState } from 'react';
import { useQueueStore } from '@/store/useQueueStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Stethoscope, CheckCircle2, Timer } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function DoctorDashboard() {
  const { current, waiting, avgConsultationTime } = useQueueStore();
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [isCalling, setIsCalling] = useState(false);

  useEffect(() => {
    if (!current?.calledAt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setElapsedMinutes(0);
      return;
    }

    const interval = setInterval(() => {
      const ms = Date.now() - new Date(current.calledAt!).getTime();
      setElapsedMinutes(Math.floor(ms / 60000));
    }, 1000);

    return () => clearInterval(interval);
  }, [current]);

  const handleCompleteAndNext = async () => {
    setIsCalling(true);
    try {
      const res = await fetch(`${API_URL}/api/queue/call-next`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
    } catch {
      toast.error('Failed to complete consultation');
    } finally {
      setIsCalling(false);
    }
  };

  const getTimerColor = () => {
    if (!current) return 'text-slate-400';
    if (elapsedMinutes <= avgConsultationTime * 0.8) return 'text-emerald-500';
    if (elapsedMinutes <= avgConsultationTime * 1.2) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center gap-4 mb-8">
          <Stethoscope className="h-10 w-10 text-indigo-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Doctor Workspace</h1>
            <p className="text-slate-500">Manage consultations and track efficiency</p>
          </div>
        </div>

        <Card className="shadow-xl border-indigo-100 overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-indigo-500 to-purple-500" />
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-500 uppercase tracking-widest text-sm">Currently Consulting</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10 space-y-8">
            {current ? (
              <>
                <div className="text-center">
                  <div className="text-8xl font-black text-slate-900 mb-4">{current.tokenNumber}</div>
                  <div className="text-3xl text-slate-600 font-medium">{current.name}</div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-full border">
                  <Timer className={`h-6 w-6 ${getTimerColor()}`} />
                  <span className={`text-2xl font-bold tabular-nums ${getTimerColor()}`}>
                    {elapsedMinutes} min
                  </span>
                  <span className="text-slate-400 text-sm ml-2">/ Avg {avgConsultationTime}m</span>
                </div>

                <div className="flex gap-4 w-full max-w-md pt-4">
                  <Button 
                    className="flex-1 h-14 text-lg bg-indigo-600 hover:bg-indigo-700 transition-transform active:scale-95" 
                    onClick={handleCompleteAndNext}
                    disabled={isCalling}
                  >
                    <CheckCircle2 className="mr-2 h-5 w-5" /> Finish & Call Next
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-slate-400 mb-4">No active consultation</div>
                <Button 
                  size="lg" 
                  onClick={handleCompleteAndNext} 
                  disabled={isCalling || waiting.length === 0}
                >
                  Start Next Patient
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="text-4xl font-bold text-slate-800">{waiting.length}</div>
              <div className="text-slate-500">Patients Waiting</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="text-4xl font-bold text-slate-800">
                {waiting[0]?.tokenNumber || '--'}
              </div>
              <div className="text-slate-500">Up Next</div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
