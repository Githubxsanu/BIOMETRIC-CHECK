
import React from 'react';
import { BiometricProfile } from '../types';
import { PieChart, BarChart3, Users, ShieldAlert } from 'lucide-react';

interface AnalyticsProps {
  profiles: BiometricProfile[];
}

export const Analytics: React.FC<AnalyticsProps> = ({ profiles }) => {
  const departments = profiles.reduce((acc, p) => {
    acc[p.department] = (acc[p.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const accessLevels = profiles.reduce((acc, p) => {
    acc[p.accessLevel] = (acc[p.accessLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = profiles.length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-cyan-500/20 p-4 rounded-xl">
          <div className="flex items-center text-cyan-500 mb-2">
            <Users size={16} className="mr-2" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Total Population</span>
          </div>
          <div className="text-3xl font-bold text-white">{total}</div>
          <div className="text-[10px] text-cyan-500/40 mt-1">REGISTERED ENTITIES</div>
        </div>
        <div className="bg-slate-900/80 border border-cyan-500/20 p-4 rounded-xl">
          <div className="flex items-center text-red-500 mb-2">
            <ShieldAlert size={16} className="mr-2" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Elevated Access</span>
          </div>
          <div className="text-3xl font-bold text-white">{accessLevels['Administrator'] || 0}</div>
          <div className="text-[10px] text-red-500/40 mt-1">ADMIN-LEVEL PRIVILEGES</div>
        </div>
        <div className="bg-slate-900/80 border border-cyan-500/20 p-4 rounded-xl">
          <div className="flex items-center text-green-500 mb-2">
            <BarChart3 size={16} className="mr-2" />
            <span className="text-[10px] font-bold uppercase tracking-widest">System Health</span>
          </div>
          <div className="text-3xl font-bold text-white">98.2%</div>
          <div className="text-[10px] text-green-500/40 mt-1">NEURAL SYNC STABILITY</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="bg-slate-900/50 border border-cyan-500/10 p-6 rounded-2xl">
          <h3 className="text-xs font-bold text-cyan-500 uppercase tracking-widest mb-6 flex items-center">
            <PieChart size={14} className="mr-2" /> Department Demographics
          </h3>
          <div className="flex items-center justify-around h-48">
             <div className="relative w-32 h-32">
                <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90">
                  {Object.entries(departments).map(([dept, count], i, arr) => {
                    const totalCount = Object.values(departments).reduce((a, b) => a + b, 0);
                    const prevCount = arr.slice(0, i).reduce((a, b) => a + b[1], 0);
                    const start = (prevCount / totalCount) * 100;
                    const percent = (count / totalCount) * 100;
                    return (
                      <circle
                        key={dept}
                        cx="16" cy="16" r="14"
                        fill="transparent"
                        stroke={['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'][i % 4]}
                        strokeWidth="4"
                        strokeDasharray={`${percent} ${100 - percent}`}
                        strokeDashoffset={-start}
                        className="transition-all duration-1000"
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-[10px] font-bold text-cyan-500/40">GEO-FIX</div>
                </div>
             </div>
             <div className="space-y-2">
                {Object.entries(departments).map(([dept, count], i) => (
                  <div key={dept} className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'][i % 4] }} />
                    <span className="text-[10px] text-slate-400 uppercase w-24 truncate">{dept}</span>
                    <span className="text-[10px] font-bold text-cyan-500">{count}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Access Level Bar Chart */}
        <div className="bg-slate-900/50 border border-cyan-500/10 p-6 rounded-2xl">
          <h3 className="text-xs font-bold text-cyan-500 uppercase tracking-widest mb-6 flex items-center">
            <BarChart3 size={14} className="mr-2" /> Clearance Hierarchy
          </h3>
          <div className="space-y-4 h-48 flex flex-col justify-center">
            {Object.entries(accessLevels).map(([level, count]) => {
              const max = Math.max(...Object.values(accessLevels));
              const width = (count / max) * 100;
              return (
                <div key={level} className="space-y-1">
                  <div className="flex justify-between text-[9px] uppercase font-bold text-slate-500">
                    <span>{level}</span>
                    <span>{count} Units</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-cyan-500 h-full transition-all duration-1000" 
                      style={{ width: `${width}%`, boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)' }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
