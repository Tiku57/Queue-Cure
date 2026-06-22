'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Clock, Activity } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AnalyticsDashboard() {
  const [data, setData] = useState<{
    totalServed: number;
    longestWaitTime: number;
    doctorUtilization: number;
    chartData: Array<{ name: string; waitTime: number }>;
  } | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/analytics`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) return <div className="flex justify-center items-center h-screen">Loading Analytics...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4">
          <TrendingUp className="h-10 w-10 text-emerald-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Clinic Analytics</h1>
            <p className="text-slate-500">Monitor operational efficiency and wait times</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 text-slate-500 mb-2">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Total Served</span>
              </div>
              <div className="text-4xl font-bold">{String(data.totalServed)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 text-slate-500 mb-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Longest Wait</span>
              </div>
              <div className="text-4xl font-bold">{String(data.longestWaitTime)}m</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 text-slate-500 mb-2">
                <Activity className="h-4 w-4" />
                <span className="text-sm font-medium">Doctor Utilization</span>
              </div>
              <div className="text-4xl font-bold text-emerald-600">{String(data.doctorUtilization)}%</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Average Wait Time by Hour</CardTitle>
              <CardDescription>Identify peak hours to manage staffing</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}m`} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px' }} />
                  <Bar dataKey="waitTime" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Patient Influx Trend</CardTitle>
              <CardDescription>Volume of patients joining the queue</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.chartData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="waitTime" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
