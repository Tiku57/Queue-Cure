import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, MonitorPlay, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">QueueCure</h1>
          <p className="text-xl text-slate-600">Know your turn before it&apos;s your turn.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Users className="text-blue-600" />
                Receptionist Dashboard
              </CardTitle>
              <CardDescription>Manage patients and control the queue</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/reception">
                <Button className="w-full group-hover:bg-blue-700 transition-colors" size="lg">
                  Open Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <MonitorPlay className="text-emerald-600" />
                Patient TV Screen
              </CardTitle>
              <CardDescription>
                Elevate your clinic&apos;s experience with intelligent, real-time wait tracking.
                Say goodbye to crowded waiting rooms and frustrated patients.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/tv" target="_blank">
                <Button variant="outline" className="w-full group-hover:bg-slate-100 transition-colors" size="lg">
                  Launch TV Screen <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
