
import React, { useMemo, useState } from 'react';
import { 
  CheckSquare, 
  Briefcase, 
  FileText, 
  Star, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User, 
  Calendar as CalendarIcon, 
  Search,
  Filter,
  BarChart,
  LayoutDashboard,
  Check,
  Award,
  Users,
  ChevronDown,
  Activity,
  Flame,
  Target,
  Zap,
  ArrowUpRight,
  TrendingUp,
  PieChart as PieIcon,
  GanttChartSquare
} from 'lucide-react';
import { Task, AppSettings, User as AppUser, Report } from '../types';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import TasksView from './TasksView';
import StaffRatingsView from './StaffRatingsView';

interface TaskManagerProps {
  activeTab: 'dashboard' | 'my_works' | 'reports' | 'ratings';
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  teamMembers: AppUser[];
  currentUser: AppUser;
  savedReports?: Report[];
  settings: AppSettings;
  // Added selectedZoneId property to fix App.tsx assignment error
  selectedZoneId: string;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function TaskManager({ activeTab, tasks, setTasks, teamMembers, currentUser, savedReports = [], settings, selectedZoneId }: TaskManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');

  // --- DERIVED DATA ---
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
      const matchesAssignee = filterAssignee === 'all' || t.assignedToId === filterAssignee;
      return matchesSearch && matchesStatus && matchesAssignee;
    });
  }, [tasks, searchTerm, filterStatus, filterAssignee]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = total - completed;
    const urgent = tasks.filter(t => t.priority === 'urgent' && t.status === 'pending').length;
    
    // Group by assignee for ratings
    const staffPerformance: Record<string, { id: string, name: string, total: number, completed: number, points: number, photo: string }> = {};
    
    tasks.forEach(t => {
        if(t.assignedToId) {
            const member = teamMembers.find(m => m.id === t.assignedToId);
            const name = member ? member.name : 'Unknown';
            if(!staffPerformance[name]) staffPerformance[name] = { id: t.assignedToId, name, total: 0, completed: 0, points: 0, photo: member?.photo || '' };
            
            staffPerformance[name].total += 1;
            if(t.status === 'completed') {
                staffPerformance[name].completed += 1;
                staffPerformance[name].points += 10; 
            }
        }
    });

    const leaderboard = Object.values(staffPerformance)
        .map(s => ({ ...s, rate: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0 }))
        .sort((a,b) => b.points - a.points);

    // Breakdown by Type
    const typeMap: Record<string, number> = { general: 0, meeting: 0, maintenance: 0 };
    tasks.forEach(t => { if(typeMap[t.type] !== undefined) typeMap[t.type]++; });
    const typeData = Object.keys(typeMap).map(k => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: typeMap[k] }));

    return { total, completed, pending, urgent, leaderboard, typeData };
  }, [tasks, teamMembers]);

  // 1. Determine which users the current user is allowed to see
  const accessibleMembers = useMemo(() => {
    let members = teamMembers;
    // Role-based visibility
    if (currentUser.role === 'MANAGER') {
      members = teamMembers.filter(m => m.id === currentUser.id || m.role === 'TECHNICIAN');
    } else if (currentUser.role === 'TECHNICIAN') {
      members = [currentUser];
    }
    
    // Zone-based filtering (Fix: added selectedZoneId to dependencies and logic)
    if (selectedZoneId !== 'all') {
      members = members.filter(m => m.zoneId === selectedZoneId);
    }
    
    return members;
  }, [currentUser, teamMembers, selectedZoneId]);

  // --- SUB-VIEWS ---

  // 1. DASHBOARD VIEW
  if (activeTab === 'dashboard') {
    const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    const pieData = [
      { name: 'Completed', value: stats.completed, color: '#10b981' },
      { name: 'Pending', value: stats.pending, color: '#f59e0b' }
    ];

    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-700">
         {/* DASHBOARD HEADER */}
         <div className="bg-white border border-slate-200 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                  <GanttChartSquare size={28} />
               </div>
               <div>
                  <h1 className="text-2xl font-black text-slate-800 tracking-tight">Operations Hub</h1>
                  <p className="text-xs text-slate-500 font-medium">Real-time task synchronization & team output.</p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Completion</p>
                  <p className="text-xl font-black text-indigo-600">{completionRate}%</p>
               </div>
               <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-indigo-600 flex items-center justify-center">
                  <Activity size={18} className="text-indigo-600" />
               </div>
            </div>
         </div>

         {/* KPI PULSE GRID */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
               { label: 'Total Volume', val: stats.total, sub: 'Lifetime Tasks', icon: CheckSquare, color: 'text-indigo-600', bg: 'bg-indigo-50' },
               { label: 'Active Queue', val: stats.pending, sub: 'Awaiting Action', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
               { label: 'High Urgency', val: stats.urgent, sub: 'Immediate Focus', icon: Flame, color: 'text-rose-600', bg: 'bg-rose-50' },
               { label: 'Success Rate', val: `${completionRate}%`, sub: 'Avg Efficiency', icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' }
            ].map((kpi, i) => (
               <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 group hover:border-indigo-300 transition-all shadow-sm">
                   <div className="flex justify-between items-start mb-3">
                       <div className={`p-2 rounded-xl ${kpi.bg} ${kpi.color}`}>
                           <kpi.icon size={20} />
                       </div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase">{kpi.label}</span>
                   </div>
                   <h3 className="text-3xl font-black text-slate-800">{kpi.val}</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 flex items-center gap-1">
                      <ArrowUpRight size={10} className="text-emerald-500" /> {kpi.sub}
                   </p>
               </div>
            ))}
         </div>

         {/* ANALYTICS GRID */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* WORKLOAD DISTRIBUTION */}
            <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
               <div className="flex justify-between items-center mb-8">
                  <div>
                     <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp size={16} className="text-indigo-600" /> Activity Breakdown
                     </h3>
                     <p className="text-xs text-slate-400 mt-1 font-medium">Distribution by category</p>
                  </div>
               </div>
               
               <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={stats.typeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                           <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                        <Tooltip 
                           contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* PRIORITY DONUT */}
            <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <PieIcon size={16} className="text-purple-600" /> Task Status
               </h3>
               <div className="flex-1 h-56 relative">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={pieData}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={85}
                           paddingAngle={8}
                           dataKey="value"
                           stroke="none"
                        >
                           {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Pie>
                        <Tooltip />
                     </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-3xl font-black text-slate-800">{stats.total}</span>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                  </div>
               </div>
               <div className="space-y-3 mt-6">
                  {pieData.map((item, idx) => (
                     <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2">
                           <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                           <span className="text-[11px] font-bold text-slate-600 uppercase">{item.name}</span>
                        </div>
                        <span className="text-xs font-black text-slate-800 tabular-nums">{item.value}</span>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* BOTTOM SECTION: LEADERBOARD & RECENT SNIPPET */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ELITE LEADERBOARD */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl">
                <div className="flex justify-between items-center mb-10">
                   <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-500/20 rounded-2xl text-indigo-400">
                         <Award size={22} />
                      </div>
                      Top Performers
                   </h3>
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Points based</span>
                </div>
                
                <div className="space-y-4">
                    {stats.leaderboard.slice(0, 5).map((staff, idx) => (
                        <div key={idx} className="group flex items-center justify-between p-4 bg-white/5 rounded-3xl border border-transparent hover:border-white/10 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-800 overflow-hidden border-2 border-white/10 flex items-center justify-center font-black text-lg text-white/20 uppercase">
                                       {staff.photo ? <img src={staff.photo} className="w-full h-full object-cover" /> : staff.name.charAt(0)}
                                    </div>
                                    <div className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-slate-900 shadow-lg ${idx === 0 ? 'bg-yellow-400 text-slate-900' : 'bg-slate-700 text-white'}`}>
                                       {idx + 1}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white/90 group-hover:text-white transition-colors">{staff.name}</h4>
                                    <div className="flex items-center gap-1.5 mt-1">
                                       <div className="w-16 bg-white/10 h-1 rounded-full overflow-hidden">
                                          <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${staff.rate}%` }}></div>
                                       </div>
                                       <span className="text-[8px] font-black text-slate-500 uppercase">{staff.rate}% Rate</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black text-white tabular-nums">{staff.completed}</p>
                                <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Completed</p>
                            </div>
                        </div>
                    ))}
                    {stats.leaderboard.length === 0 && <p className="text-slate-400 text-center py-8 italic text-sm">Waiting for performance data...</p>}
                </div>
            </div>

            {/* RECENT ACTIVITY SNEAK PEEK */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Zap size={18} className="text-amber-500" /> Recent Activity
                   </h3>
                   <button onClick={() => {}} className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-widest">View All</button>
                </div>
                
                <div className="flex-1 space-y-4">
                   {tasks.slice(0, 5).map((task, idx) => (
                      <div key={task.id} className="flex items-start gap-4 p-4 rounded-3xl border border-slate-50 hover:bg-slate-50 transition-all group">
                         <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${task.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                         <div className="flex-1 overflow-hidden">
                            <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{task.title}</h4>
                            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-2 mt-1">
                               <CalendarIcon size={10} /> {task.date}
                               {task.assignedToId && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <span className="flex items-center gap-1"><User size={10} /> {teamMembers.find(m => m.id === task.assignedToId)?.name}</span>
                                  </>
                               )}
                            </p>
                         </div>
                         <span className={`text-[8px] px-2 py-1 rounded-lg font-black uppercase border ${
                            task.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                         }`}>
                            {task.status}
                         </span>
                      </div>
                   ))}
                   {tasks.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-300 opacity-50 py-12">
                         <CheckCircle2 size={48} className="mb-2" />
                         <p className="text-sm font-medium">No activity to show</p>
                      </div>
                   )}
                </div>
            </div>
         </div>
      </div>
    );
  }

  // 2. MY WORKS VIEW (Using New TasksView Component)
  if (activeTab === 'my_works') {
    return (
        <TasksView 
            tasks={tasks} 
            setTasks={setTasks} 
            savedReports={savedReports} 
            currentUser={currentUser}
            teamMembers={teamMembers}
        />
    );
  }

  // 3. REPORTS VIEW
  if (activeTab === 'reports') {
      return (
          <div className="h-full flex flex-col space-y-6">
              <div className="flex flex-col xl:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                  <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                          <FileText size={24} />
                      </div>
                      <div>
                          <h2 className="text-xl font-bold text-slate-800">Task Reports</h2>
                          <p className="text-xs text-slate-400 font-medium">Audit logs and assignment summary</p>
                      </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                      {/* Search Bar */}
                      <div className="relative flex-1 sm:w-64">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                              type="text" 
                              placeholder="Search tasks..." 
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                          />
                      </div>

                      {/* Assignee Filter */}
                      <div className="relative group min-w-[180px]">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors">
                              <Users size={16} />
                          </div>
                          <select 
                              value={filterAssignee}
                              onChange={(e) => setFilterAssignee(e.target.value)}
                              className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none appearance-none hover:bg-slate-100 focus:bg-white transition-all cursor-pointer"
                          >
                              <option value="all">All Staff</option>
                              {teamMembers.map(m => (
                                  <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                      </div>

                      {/* Status Filter */}
                      <div className="relative group min-w-[150px]">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors">
                              <Filter size={16} />
                          </div>
                          <select 
                              value={filterStatus}
                              onChange={(e) => setFilterStatus(e.target.value as any)}
                              className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none appearance-none hover:bg-slate-100 focus:bg-white transition-all cursor-pointer"
                          >
                              <option value="all">All Status</option>
                              <option value="pending">Pending</option>
                              <option value="completed">Completed</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                      </div>
                  </div>
              </div>

              <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 sticky top-0 z-10 uppercase tracking-widest text-[10px] font-black">
                              <tr>
                                  <th className="px-6 py-4">Task Activity</th>
                                  <th className="px-6 py-4">Assignee</th>
                                  <th className="px-6 py-4">Schedule</th>
                                  <th className="px-6 py-4">Type</th>
                                  <th className="px-6 py-4 text-right">Status</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {filteredTasks.map(task => {
                                  const assignee = teamMembers.find(m => m.id === task.assignedToId);
                                  return (
                                      <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group">
                                          <td className="px-6 py-5">
                                              <p className="font-bold text-slate-800">{task.title}</p>
                                              <p className="text-xs text-slate-400 line-clamp-1">{task.description}</p>
                                          </td>
                                          <td className="px-6 py-5">
                                              {assignee ? (
                                                  <div className="flex items-center gap-2.5">
                                                      <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm">
                                                          {assignee.photo ? <img src={assignee.photo} className="w-full h-full object-cover rounded-lg" alt="" /> : assignee.name.charAt(0)}
                                                      </div>
                                                      <span className="font-semibold text-slate-600">{assignee.name}</span>
                                                  </div>
                                              ) : (
                                                  <span className="text-slate-400 italic font-medium">Unassigned</span>
                                              )}
                                          </td>
                                          <td className="px-6 py-5">
                                              <div className="flex flex-col">
                                                  <span className="font-bold text-slate-700">{task.date}</span>
                                                  {task.time && <span className="text-[10px] text-slate-400">{task.time}</span>}
                                              </div>
                                          </td>
                                          <td className="px-6 py-5">
                                              <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-wider border border-slate-200">{task.type}</span>
                                          </td>
                                          <td className="px-6 py-5 text-right">
                                              <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                                                  task.status === 'completed' 
                                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                  : 'bg-amber-50 text-amber-700 border border-amber-100'
                                              }`}>
                                                  {task.status === 'completed' ? <Check size={12} className="mr-1" /> : <Clock size={12} className="mr-1" />}
                                                  {task.status}
                                              </span>
                                          </td>
                                      </tr>
                                  );
                              })}
                              {filteredTasks.length === 0 && (
                                  <tr>
                                      <td colSpan={5} className="px-6 py-24 text-center">
                                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                              <FileSearch size={32} className="text-slate-300" />
                                          </div>
                                          <p className="text-slate-400 font-medium">No tasks found matching your criteria.</p>
                                          <button 
                                              onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterAssignee('all'); }}
                                              className="mt-3 text-indigo-600 text-xs font-bold hover:underline"
                                          >
                                              Clear all filters
                                          </button>
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      );
  }

  // 4. NEW STAFF RATINGS VIEW
  if (activeTab === 'ratings') {
      return (
          <StaffRatingsView 
             currentUser={currentUser}
             teamMembers={teamMembers}
             tasks={tasks}
             savedReports={savedReports}
             settings={settings}
          />
      );
  }

  return null;
}

// Simple internal helper for Search result icon
function FileSearch({ size, className }: { size: number, className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="15" r="3"/><line x1="12" y1="17" x2="15" y2="20"/>
        </svg>
    );
}
