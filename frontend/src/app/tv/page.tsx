'use client';

import { useEffect, useState, useRef } from 'react';
import { useQueueStore } from '@/store/useQueueStore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TVScreen() {
  const { waiting, current, isConnected } = useQueueStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Play sound when current token changes
  useEffect(() => {
    if (current && audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio autoplay blocked by browser', e));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.tokenNumber]);

  return (
    <div className="h-[100dvh] bg-[#0A0A0A] text-white flex flex-col p-4 md:p-8 overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 mb-6 lg:mb-12 border-b border-white/10 pb-4 lg:pb-6">
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="bg-blue-500/20 p-2 lg:p-3 rounded-2xl border border-blue-500/30">
            <Activity className="h-6 w-6 lg:h-8 lg:w-8 text-blue-400" />
          </div>
          <h1 className="text-2xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent text-center sm:text-left">
            QueueCure Clinic
          </h1>
        </div>
        <div className="flex items-center gap-3 lg:gap-6">
          <Badge variant="outline" className={`text-sm lg:text-lg py-1 px-3 lg:px-4 border ${isConnected ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' : 'text-red-400 border-red-400/30 bg-red-400/10'}`}>
            {isConnected ? 'LIVE SYNC' : 'OFFLINE'}
          </Badge>
          <div className="text-xl lg:text-3xl font-medium text-slate-300 tracking-tight">
            {mounted ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-10 min-h-0">
        {/* Left Column - Current Token */}
        <div className="flex-none h-[45%] lg:h-auto lg:col-span-7 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current?.tokenNumber || 'empty'}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="h-full"
            >
              <Card className="bg-gradient-to-br from-slate-900 to-[#111] border-slate-800 h-full flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12 text-center shadow-2xl relative overflow-hidden group rounded-2xl lg:rounded-3xl">
                {/* Ambient Background Glow */}
                <div className="absolute inset-0 bg-blue-500/10 transition-opacity duration-1000" />
                <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15),transparent_50%)] animate-pulse" />
                
                <div className="relative z-10 space-y-4 lg:space-y-8">
                  <div className="flex items-center justify-center gap-2 lg:gap-3 text-blue-400 mb-2 lg:mb-4">
                    <Bell className="h-6 w-6 lg:h-8 lg:w-8 animate-bounce" />
                    <span className="text-xl lg:text-2xl font-semibold uppercase tracking-widest letter-spacing-2">Now Serving</span>
                  </div>
                  
                  {current ? (
                    <>
                      <div className="text-[6rem] sm:text-[8rem] md:text-[10rem] lg:text-[14rem] xl:text-[16rem] font-black leading-none text-white drop-shadow-[0_0_30px_rgba(59,130,246,0.4)] tracking-tighter">
                        {current.tokenNumber}
                      </div>
                      <div className="text-3xl lg:text-5xl text-slate-300 font-medium tracking-tight mt-4 lg:mt-8">
                        {current.name}
                      </div>
                      {current.priorityLevel !== 'NORMAL' && (
                        <div className="mt-4 lg:mt-6 inline-block bg-red-500/20 text-red-400 border border-red-500/30 px-4 lg:px-6 py-1 lg:py-2 rounded-full text-sm lg:text-xl font-bold uppercase tracking-widest">
                          {current.priorityLevel}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-3xl lg:text-6xl font-bold text-slate-600 uppercase tracking-widest">
                      Queue Empty
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Column - Upcoming Queue */}
        <div className="flex-1 min-h-0 lg:col-span-5 flex flex-col gap-4 lg:gap-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl lg:text-2xl font-semibold text-slate-300 tracking-tight">Upcoming Tokens</h2>
            <div className="text-slate-500 font-medium tracking-wider text-xs lg:text-sm uppercase">Wait Time</div>
          </div>
          
          <div className="flex-1 flex flex-col gap-3 lg:gap-4 overflow-y-auto lg:pr-2 pb-4 scrollbar-hide">
            {waiting.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-600 text-lg lg:text-xl border border-dashed border-slate-800 rounded-3xl min-h-[150px]">
                No patients waiting
              </div>
            ) : (
              <AnimatePresence>
                {waiting.slice(0, 6).map((patient) => (
                  <motion.div 
                    key={patient._id}
                    layout
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, type: 'spring', bounce: 0.2 }}
                    className="bg-[#111] border border-white/5 rounded-xl lg:rounded-2xl p-4 lg:p-5 flex items-center justify-between shadow-lg"
                  >
                    <div className="flex items-center gap-3 lg:gap-5">
                      <div className={`h-12 w-12 lg:h-14 lg:w-14 rounded-xl lg:rounded-2xl flex items-center justify-center text-xl lg:text-2xl font-bold shadow-inner ${
                        patient.priorityLevel === 'EMERGENCY' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        patient.priorityLevel === 'PRIORITY' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-slate-800 text-white border border-slate-700'
                      }`}>
                        {patient.tokenNumber}
                      </div>
                      <div>
                        <div className="text-lg lg:text-xl font-medium text-slate-200 tracking-tight">{patient.name}</div>
                        <div className="text-xs lg:text-sm text-slate-500 mt-0.5 lg:mt-1">{patient.tokensAhead} patients ahead</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">
                        ~{patient.estimatedWaitTime}
                      </div>
                      <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-1">
                        Mins
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            
            {waiting.length > 6 && (
              <div className="text-center py-4 text-slate-600 font-medium tracking-widest text-sm uppercase">
                + {waiting.length - 6} more waiting
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
