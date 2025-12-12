import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { MetricPoint, SimulationMetrics } from '../types';

interface MetricsDashboardProps {
  history: MetricPoint[];
  current: SimulationMetrics;
}

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ history, current }) => {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Congestion Index" value={current.congestionIndex.toFixed(1)} unit="%" color="text-orange-400" />
        <KpiCard title="Avg Travel Time" value={current.avgTravelTime.toFixed(1)} unit="min" color="text-blue-400" />
        <KpiCard title="Emergency Response" value={current.emergencyResponseTime.toFixed(1)} unit="min" color="text-red-400" />
        <KpiCard title="Est. Emissions" value={current.emissions.toFixed(0)} unit="tons" color="text-green-400" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-400 mb-4">Traffic Congestion Trend</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorCongestion" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tick={{fill: '#94a3b8'}} />
                <YAxis stroke="#94a3b8" fontSize={10} tick={{fill: '#94a3b8'}} />
                <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', color: '#fff'}} />
                <Area type="monotone" dataKey="congestion" stroke="#f97316" fillOpacity={1} fill="url(#colorCongestion)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-400 mb-4">Environmental Impact</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', color: '#fff'}} />
                <Bar dataKey="emissions" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, unit, color }: { title: string, value: string, unit: string, color: string }) => (
  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{title}</p>
    <div className="mt-2 flex items-baseline gap-1">
      <span className={`text-2xl font-mono font-bold ${color}`}>{value}</span>
      <span className="text-sm text-slate-400">{unit}</span>
    </div>
  </div>
);

export default MetricsDashboard;
