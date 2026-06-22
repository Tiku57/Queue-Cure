'use client';

import { useState } from 'react';
import { useQueueStore, PriorityLevel } from '@/store/useQueueStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, Users, PlayCircle, PlusCircle, Activity, Search, QrCode, Zap, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const APP_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

export default function ReceptionDashboard() {
  const { waiting, current, avgConsultationTime, intelligenceMessage, isConnected } = useQueueStore();
  const [newPatientName, setNewPatientName] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('NORMAL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isCalling, setIsCalling] = useState(false);

  const filteredWaiting = waiting.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.tokenNumber.toString().includes(searchQuery)
  );

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;

    setIsAdding(true);
    try {
      const res = await fetch(`${API_URL}/api/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPatientName.trim(), priorityLevel: priority }),
      });

      if (!res.ok) throw new Error('Failed to add patient');
      
      setNewPatientName('');
      setPriority('NORMAL');
    } catch {
      toast.error('Failed to add patient');
    } finally {
      setIsAdding(false);
    }
  };

  const handleCallNext = async () => {
    if (waiting.length === 0 && !current) {
      toast.info('Queue is empty');
      return;
    }
    
    setIsCalling(true);
    try {
      const res = await fetch(`${API_URL}/api/queue/call-next`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to call next patient');
    } catch {
      toast.error('Failed to call next patient');
    } finally {
      setIsCalling(false);
    }
  };

  const handleSeedDemo = async () => {
    try {
      toast.loading('Generating 50 patients and history...', { id: 'seed' });
      await fetch(`${API_URL}/api/demo/seed`, { method: 'POST' });
      toast.success('Demo data loaded successfully!', { id: 'seed' });
    } catch {
      toast.error('Failed to load demo data', { id: 'seed' });
    }
  };

  const getPriorityColor = (level: PriorityLevel) => {
    switch(level) {
      case 'EMERGENCY': return 'bg-red-100 text-red-800 border-red-300';
      case 'PRIORITY': return 'bg-amber-100 text-amber-800 border-amber-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reception Dashboard</h1>
            <p className="text-slate-500">QueueCure Clinic Management</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleSeedDemo} className="hidden md:flex">
              <Zap className="mr-2 h-4 w-4 text-purple-500" /> Demo Seeder
            </Button>
            <Badge variant={isConnected ? "default" : "destructive"} className="px-3 py-1 shadow-sm">
              {isConnected ? '🟢 Live Sync Active' : '🔴 Fallback Polling Active'}
            </Badge>
          </div>
        </div>

        {/* Smart Intelligence Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4 flex items-center gap-3 shadow-sm">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <span className="font-medium text-blue-900">Smart Intelligence:</span>
          <span className="text-blue-700">{intelligenceMessage}</span>
        </div>

        {/* Stats Row */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Waiting Patients</CardTitle>
              <Users className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{waiting.length}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Token</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{current?.tokenNumber || '--'}</div>
              <p className="text-sm font-medium text-slate-500 truncate mt-1">
                {current?.name || 'Waiting for next...'}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Consultation</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgConsultationTime} <span className="text-lg text-slate-500">min</span></div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Add Patient */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Add New Patient</CardTitle>
              <CardDescription>Generates token and QR code instantly.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddPatient} className="flex flex-col space-y-3">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter patient name..." 
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    disabled={isAdding}
                    autoFocus
                    className="flex-1"
                  />
                  <select 
                    value={priority} 
                    onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    className="flex h-9 w-[130px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="PRIORITY">Priority</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>
                <Button type="submit" disabled={isAdding || !newPatientName.trim()} className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Patient
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Call Next */}
          <Card className="border-blue-200 shadow-sm bg-blue-50/50">
            <CardHeader>
              <CardTitle>Queue Control</CardTitle>
              <CardDescription>Advance the queue based on priority logic.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 h-16 text-xl shadow-lg transition-transform active:scale-[0.98]" 
                onClick={handleCallNext}
                disabled={isCalling || (waiting.length === 0 && !current)}
              >
                <PlayCircle className="mr-2 h-6 w-6" />
                Call Next Patient
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Queue Table */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Live Queue List</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="search"
                placeholder="Search token or name..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredWaiting.length === 0 ? (
              <div className="text-center py-12 text-slate-500 border border-dashed rounded-lg">
                {searchQuery ? 'No matching patients found.' : 'Queue is empty.'}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Token</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Tracking</TableHead>
                      <TableHead className="text-right">Est. Wait</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWaiting.map((patient) => (
                      <TableRow key={patient._id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-bold text-lg">{patient.tokenNumber}</TableCell>
                        <TableCell className="font-medium">{patient.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getPriorityColor(patient.priorityLevel)}>
                            {patient.priorityLevel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger className="inline-flex items-center justify-center rounded-md transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 h-8 w-8 p-0">
                              <QrCode className="h-4 w-4 text-slate-500" />
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md text-center flex flex-col items-center">
                              <DialogHeader>
                                <DialogTitle>Patient Tracking Link</DialogTitle>
                              </DialogHeader>
                              <div className="p-6 bg-white rounded-xl shadow-inner border my-4">
                                <QRCodeSVG value={`${APP_URL}/track/${patient.queueId}`} size={200} />
                              </div>
                              <p className="text-sm text-slate-500">
                                Patient can scan this to track their wait time on their phone.
                              </p>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                        <TableCell className="text-right font-bold text-orange-600">
                          ~{patient.estimatedWaitTime} min
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
