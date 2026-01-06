
import React, { useMemo } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  User, 
  Briefcase, 
  Activity, 
  Target, 
  Award,
  Zap,
  LayoutDashboard,
  ShieldCheck,
  ClipboardCheck,
  Trophy,
  ArrowUpRight,
  UserCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  Flame,
  Star,
  Layers,
  Fingerprint
} from 'lucide-react';
import { User as AppUser, Task, Report, AppSettings } from '../../types';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface StaffReportsDashboardProps {
  teamMembers: AppUser[];
  tasks: Task[];
  savedReports: Report[];
  settings: AppSettings;
  selectedZoneId: string;
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function StaffReportsDashboard({ teamMembers, tasks, savedReports, settings, selectedZoneId }: StaffReportsDashboardProps) {
  // Filter technicians by zone
  const techs = useMemo(() => {
    let filtered = teamMembers.filter(m => m.role === 'TECHNICIAN' || m.role === 'MANAGER');
    if (selectedZoneId !== 'all') {
      filtered = filtered.filter(m => m.zoneId === selectedZoneId);
    }
    return filtered;
  }, [teamMembers, selectedZoneId]);

  // --- STATS ENGINE ---
  const stats = useMemo(() => {
    return techs.map(tech => {
      const techTasks = tasks.filter(t => t.assignedToId === tech.id);
      const completedTasks = techTasks.filter(t => t.status === 'completed').length;
      
      const techReports = savedReports.filter(r => 
        r.deviceInfo.technicianName?.trim().toLowerCase() === tech.name.trim().toLowerCase()
      );
      const fixedUnits = techReports.filter(r => r.progress >= 50).length;

      return {
        id: tech.id,
        name: tech.name,
        photo: tech.photo,
        tasks: completedTasks,
        units: fixedUnits,
        totalActivity: completedTasks + fixedUnits,
        efficiency: Math.round(((completedTasks + fixedUnits) / 50) * 100)
      };
    }).sort((a, b) => b.totalActivity - a.totalActivity);
  }, [techs, tasks, savedReports]);

  const teamTotals = useMemo(() => {
    const totalCompletedTasks = tasks.filter(t => {
        const assignee = teamMembers.find(m => m.id === t.assignedToId);
        const matchesZone = selectedZoneId === 'all' || assignee?.zoneId === selectedZoneId;
        return t.status === 'completed' && matchesZone;
    }).length;

    const totalFixedUnits = savedReports.filter(r => {
        const tech = teamMembers.find(m => m.name.trim().toLowerCase() === r.deviceInfo.technicianName?.trim().toLowerCase());
        const matchesZone = selectedZoneId === 'all' || tech?.zoneId === selectedZoneId;
        return r.progress >= 50 && matchesZone;
    }).length;
    
    return {
        tasks: totalCompletedTasks,
        units: totalFixedUnits,
        active: techs.length,
        topPerformer: stats[0]?.name || 'Standby'
    };
  }, [tasks, savedReports, techs, stats, teamMembers, selectedZoneId]);

  const teamMetrics = useMemo(() => [
    { name: 'Resolution', value: teamTotals.tasks },
    { name: 'Quality QC', value: teamTotals.units }
  ], [teamTotals]);

  const zoneName = useMemo(() => {
    if (selectedZoneId === 'all') return 'Global Network';
    return settings.zones.find(z => z.id === selectedZoneId)?.name || 'Local Sector';
  }, [selectedZoneId, settings.zones]);

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      
      {/* 1. MASTER HEADER - FINTECH STYLE */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden group">
         <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-1000"></div>
         
         <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-indigo-100">
               <Activity size={32} />
            </div>
            <div>
               <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Personnel Index</h1>
               <div className="flex items-center gap-3 mt-2">
                  <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full">{zoneName}</span>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Real-time Performance Governance</p>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-4 relative z-10">
            <div className="flex -space-x-3">
               {techs.slice(0, 4).map((t, i) => (
                  <div key={i} className="w-10 h-10 rounded-xl border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 overflow-hidden shadow-sm">
                     {t.photo ? <img src={t.photo} className="w-full h-full object-cover" /> : t.name.charAt(0)}
                  </div>
               ))}
               {techs.length > 4 && (
                  <div className="w-10 h-10 rounded-xl border-2 border-white bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow-sm">
                     +{techs.length - 4}
                  </div>
               )}
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex flex-col items-end">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Roster</p>
               <p className="text-lg font-black text-slate-800 leading-none">{techs.length} Units</p>
            </div>
         </div>
      </div>

      {/* 2. KPI PULSE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
            { label: 'Workforce Capacity', val: teamTotals.active, sub: 'Assigned Personnel', icon: Users, color: 'indigo' },
            { label: 'System Resolutions', val: teamTotals.tasks, sub: 'Target Velocity', icon: CheckCircle2, color: 'emerald' },
            { label: 'Quality Assurance', val: teamTotals.units, sub: 'QC Verified Assets', icon: ShieldCheck, color: 'blue' },
            { label: 'Peak Performer', val: teamTotals.topPerformer, sub: 'Alpha Performance', icon: Trophy, color: 'amber' }
         ].map((kpi, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 group hover:border-indigo-400 transition-all shadow-sm relative overflow-hidden">
                <div className={`absolute -right-6 -top-6 p-6 opacity-[0.03] group-hover:scale-125 transition-transform duration-700 text-${kpi.color}-600`}>
                    <kpi.icon size={100} />
                </div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className={`p-3 rounded-2xl bg-${kpi.color}-50 text-${kpi.color}-600 shadow-sm`}>
                        <kpi.icon size={24} />
                    </div>
                    <div className="text-right">
                       <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-${kpi.color}-50 text-${kpi.color}-600`}>Verified</span>
                    </div>
                </div>
                <h3 className="text-2xl font-black text-slate-800 truncate mb-1 relative z-10" title={String(kpi.val)}>{kpi.val}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">{kpi.label}</p>
                <div className="mt-4 flex items-center gap-2 relative z-10">
                   <div className={`w-1.5 h-1.5 rounded-full bg-${kpi.color}-500 animate-pulse`}></div>
                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{kpi.sub}</span>
                </div>
            </div>
         ))}
      </div>

      {/* 3. PERFORMANCE MATRIX GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         
         {/* LEFT: ACTIVITY MATRIX (7 cols) */}
         <div className="lg:col-span-8 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none text-slate-900 group-hover:rotate-12 transition-transform duration-1000">
               <Fingerprint size={200} />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 relative z-10">
               <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                     <Activity size={24} className="text-indigo-600" /> Output Volumetrics
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-widest">Aggregate Technician Activity</p>
               </div>
               <div className="flex bg-slate-50 p-2 rounded-2xl border border-slate-100 gap-4">
                  <div className="flex items-center gap-2">
                     <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm"></div>
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Work Tasks</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></div>
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">QC Passports</span>
                  </div>
               </div>
            </div>
            
            <div className="h-80 w-full relative z-10">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dy={15} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                     <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)', padding: '12px' }}
                     />
                     <Bar dataKey="tasks" name="Tasks" stackId="a" fill="#4f46e5" radius={[0, 0, 0, 0]} barSize={48} />
                     <Bar dataKey="units" name="Units" stackId="a" fill="#10b981" radius={[12, 12, 0, 0]} barSize={48} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* RIGHT: COMPOSITION (4 cols) */}
         <div className="lg:col-span-4 bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl flex flex-col relative overflow-hidden group">
            <div className="absolute -left-10 -bottom-10 p-10 opacity-5 group-hover:scale-125 transition-transform duration-1000">
               <Target size={240} />
            </div>

            <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3 relative z-10">
               <Layers size={24} className="text-indigo-400" /> Utility Mix
            </h3>
            
            <div className="flex-1 h-64 relative z-10">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={teamMetrics}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={10}
                        dataKey="value"
                        stroke="none"
                     >
                        {teamMetrics.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Pie>
                     <Tooltip />
                  </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-black text-white leading-none">{teamTotals.tasks + teamTotals.units}</span>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Combined</span>
               </div>
            </div>
            
            <div className="space-y-3 mt-10 relative z-10">
               {teamMetrics.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group/row hover:bg-white/10 transition-colors">
                     <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover/row:text-white transition-colors">{item.name}</span>
                     </div>
                     <span className="text-lg font-black text-white tabular-nums">{item.value}</span>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* 4. ELITE LEADERBOARD TABLE */}
      <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
         <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-5">
               <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm border border-slate-100">
                  <Award size={32} />
               </div>
               <div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Elite Registry</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Historical Efficiency Ranking</p>
               </div>
            </div>
            <div className="flex gap-2">
               <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">Updated Synchronously</div>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100">
                     <th className="px-10 py-6">Operational Specialist</th>
                     <th className="px-10 py-6 text-center">Protocol Sync</th>
                     <th className="px-10 py-6 text-center">QC Threshold</th>
                     <th className="px-10 py-6 text-center">Asset Density</th>
                     <th className="px-10 py-6 text-right">Yield Index</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {stats.map((row, idx) => (
                     <tr key={idx} className="hover:bg-slate-50/80 transition-all group duration-500">
                        <td className="px-10 py-8">
                           <div className="flex items-center gap-5">
                              <div className="relative">
                                 <div className={`w-14 h-14 rounded-[1.5rem] bg-white overflow-hidden border-2 transition-all group-hover:scale-110 duration-500 flex items-center justify-center font-black text-lg ${idx === 0 ? 'border-amber-400 shadow-lg shadow-amber-100' : 'border-slate-100'}`}>
                                    {row.photo ? <img src={row.photo} className="w-full h-full object-cover" /> : row.name.charAt(0)}
                                 </div>
                                 {idx < 3 && (
                                    <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white text-xs font-black text-white shadow-xl ${idx === 0 ? 'bg-amber-400 scale-110' : idx === 1 ? 'bg-slate-300' : 'bg-orange-500'}`}>
                                       {idx === 0 ? <Trophy size={14}/> : idx + 1}
                                    </div>
                                 )}
                              </div>
                              <div>
                                 <p className="text-base font-black text-slate-800 leading-none mb-1.5 group-hover:text-indigo-600 transition-colors">{row.name}</p>
                                 <div className="flex items-center gap-2">
                                    <ShieldCheck size={12} className="text-emerald-500" />
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Certified Specialist</p>
                                 </div>
                              </div>
                           </div>
                        </td>
                        <td className="px-10 py-8 text-center">
                           <div className="inline-flex flex-col items-center">
                              <span className="text-xl font-black text-slate-700 leading-none mb-1.5">{row.tasks}</span>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tasks Commit</span>
                           </div>
                        </td>
                        <td className="px-10 py-8 text-center">
                           <div className="inline-flex flex-col items-center">
                              <span className="text-xl font-black text-slate-700 leading-none mb-1.5">{row.units}</span>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">QC Passports</span>
                           </div>
                        </td>
                        <td className="px-10 py-8">
                           <div className="flex flex-col items-center gap-3">
                              <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                                 <div 
                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${row.efficiency >= 80 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]'}`} 
                                    style={{ width: `${Math.min(row.efficiency, 100)}%` }}
                                 ></div>
                              </div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.efficiency}% Load Capacity</span>
                           </div>
                        </td>
                        <td className="px-10 py-8 text-right">
                           <div className={`inline-flex items-center gap-2 font-black text-[11px] uppercase tracking-tighter ${idx === 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                              <TrendingUp size={16} /> +{10 + (stats.length - idx) * 5}% Momentum
                           </div>
                        </td>
                     </tr>
                  ))}
                  {stats.length === 0 && (
                     <tr>
                        <td colSpan={5} className="px-10 py-32 text-center">
                           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 border border-dashed border-slate-200">
                              <Users size={32} />
                           </div>
                           <h4 className="text-lg font-black text-slate-300 uppercase tracking-widest">Roster Standby</h4>
                           <p className="text-slate-300 text-sm mt-1">No operational metrics captured for current cycle.</p>
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
         
         <div className="px-10 py-6 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
               <Fingerprint size={16} className="text-slate-400" />
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                  Analytics based on verified task completion and system-linked QC passports.
               </p>
            </div>
            <button className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-black transition-colors group">
               Full Audit History <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
         </div>
      </div>
    </div>
  );
}

// Internal Helper: Simple Info Icon for UI notes
const InfoIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);
