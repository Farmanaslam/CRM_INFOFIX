
import React, { useMemo, useState, useEffect } from 'react';
import { 
  Wallet, 
  Activity,
  DollarSign, 
  Plus, 
  Search, 
  ChevronDown, 
  Calendar,
  AlertTriangle,
  History,
  X,
  Users,
  Target,
  Wrench,
  TrendingUp,
  Briefcase,
  Save,
  Calculator,
  CalendarDays,
  Sparkles,
  FileSearch,
  Trash2,
  ChevronRight,
  ReceiptText,
  UserCheck,
  Clock,
  UserX,
  Edit2,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Info,
  UserCog,
  Layers,
  LayoutList,
  BarChart3
} from 'lucide-react';
import { User as AppUser, Task, Report, AppSettings, OfficialPerformanceRecord, Role } from '../../types';

interface StaffReportsFinancialProps {
  teamMembers: AppUser[];
  tasks: Task[];
  savedReports: Report[];
  settings: AppSettings;
  onUpdateSettings?: (settings: AppSettings) => void;
  selectedZoneId: string;
}

export default function StaffReportsFinancial({ 
  teamMembers, 
  tasks, 
  savedReports, 
  settings, 
  onUpdateSettings, 
  selectedZoneId 
}: StaffReportsFinancialProps) {
  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'ledger' | 'summary'>('ledger');
  
  // Date range defaults to current month
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  // Form State for Data Entry
  const [formData, setFormData] = useState({
    techId: '',
    day: new Date().getDate(),
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    customersHandled: 0,
    servicesDone: 0,
    sellAmount: 0,
    profitAmount: 0,
    salaryAmount: 0,
    otherExpenses: 0
  });

  // --- DATA INTEGRITY: AUTO-REPAIR EFFECT ---
  useEffect(() => {
    if (!onUpdateSettings || !settings.officialRecords) return;
    
    const ids = new Set();
    let needsRepair = false;
    
    const repairedRecords = settings.officialRecords.map((record, index) => {
      if (!record.id || ids.has(record.id)) {
        needsRepair = true;
        const newId = `fin-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`;
        ids.add(newId);
        return { ...record, id: newId };
      }
      ids.add(record.id);
      return record;
    });

    if (needsRepair) {
      onUpdateSettings({ ...settings, officialRecords: repairedRecords });
    }
  }, []);

  // --- DERIVED DATA ---
  const accessibleTechs = useMemo(() => {
    let filtered = teamMembers.filter(m => m.role === 'TECHNICIAN' || m.role === 'MANAGER' || m.role === 'ADMIN' || m.role === 'SUPER_ADMIN');
    if (selectedZoneId !== 'all') {
      filtered = filtered.filter(m => m.zoneId === selectedZoneId);
    }
    if (selectedRole !== 'all') {
      filtered = filtered.filter(m => m.role === selectedRole);
    }
    return filtered;
  }, [teamMembers, selectedZoneId, selectedRole]);

  const financialLogs = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return (settings.officialRecords || [])
      .filter(r => {
        const recordDate = new Date(r.year, r.month, r.day || 1);
        const matchesDate = recordDate >= start && recordDate <= end;
        const tech = teamMembers.find(m => m.id === r.techId);
        
        const matchesSearch = !searchTerm || tech?.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStaff = selectedStaffId === 'all' || r.techId === selectedStaffId;
        const matchesZone = selectedZoneId === 'all' || tech?.zoneId === selectedZoneId;
        const matchesRole = selectedRole === 'all' || tech?.role === selectedRole;
        
        return matchesDate && matchesSearch && matchesStaff && matchesZone && matchesRole;
      })
      .map(record => {
        const tech = teamMembers.find(m => m.id === record.techId) || { name: 'Unknown', photo: '', role: 'TECHNICIAN' as Role };
        const grossProfit = record.profitAmount || 0;
        const salary = record.salaryAmount || 0;
        const otherExp = record.otherExpenses || 0;
        const netProfit = grossProfit - salary - otherExp;
        const bonus = netProfit > 0 ? netProfit * 0.05 : 0;
        
        return {
          ...record,
          tech,
          netProfit,
          bonus,
          margin: record.sellAmount ? (netProfit / record.sellAmount) * 100 : 0
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.year, a.month, a.day || 1).getTime();
        const dateB = new Date(b.year, b.month, b.day || 1).getTime();
        return dateB - dateA;
      });
  }, [settings.officialRecords, startDate, endDate, searchTerm, selectedStaffId, selectedZoneId, selectedRole, teamMembers]);

  // --- AGGREGATE SUMMARY BY MEMBER ---
  const teamAggregates = useMemo(() => {
    const memberStats: Record<string, { 
      tech: AppUser; 
      totalSales: number; 
      totalProfit: number; 
      totalNet: number; 
      totalBonus: number; 
      count: number;
      totalCustomers: number;
      totalServices: number;
    }> = {};

    financialLogs.forEach(log => {
      const id = log.techId;
      if (!memberStats[id]) {
        memberStats[id] = { 
          tech: log.tech as AppUser, 
          totalSales: 0, 
          totalProfit: 0, 
          totalNet: 0, 
          totalBonus: 0, 
          count: 0,
          totalCustomers: 0,
          totalServices: 0
        };
      }
      memberStats[id].totalSales += (log.sellAmount || 0);
      memberStats[id].totalProfit += (log.profitAmount || 0);
      memberStats[id].totalNet += log.netProfit;
      memberStats[id].totalBonus += log.bonus;
      memberStats[id].totalCustomers += (log.customersHandled || 0);
      memberStats[id].totalServices += (log.servicesDone || 0);
      memberStats[id].count += 1;
    });

    return Object.values(memberStats).sort((a, b) => b.totalNet - a.totalNet);
  }, [financialLogs]);

  const kpis = useMemo(() => {
    const totalSales = financialLogs.reduce((acc, curr) => acc + (curr.sellAmount || 0), 0);
    const totalNetProfit = financialLogs.reduce((acc, curr) => acc + curr.netProfit, 0);
    const totalBonus = financialLogs.reduce((acc, curr) => acc + curr.bonus, 0);
    const avgMargin = financialLogs.length > 0 ? (totalNetProfit / (totalSales || 1)) * 100 : 0;

    return { totalSales, totalNetProfit, totalBonus, avgMargin };
  }, [financialLogs]);

  const staffHistory = useMemo(() => {
    if (!formData.techId) return [];
    return (settings.officialRecords || [])
      .filter(r => r.techId === formData.techId)
      .sort((a, b) => {
        const dateA = new Date(a.year, a.month, a.day || 1).getTime();
        const dateB = new Date(b.year, b.month, b.day || 1).getTime();
        return dateB - dateA;
      })
      .slice(0, 10);
  }, [formData.techId, settings.officialRecords]);

  // --- LIVE PROJECTION LOGIC ---
  const projection = useMemo(() => {
    const net = (formData.profitAmount || 0) - (formData.salaryAmount || 0) - (formData.otherExpenses || 0);
    const bonus = net > 0 ? net * 0.05 : 0;
    return { net, bonus };
  }, [formData.profitAmount, formData.salaryAmount, formData.otherExpenses]);

  // --- HANDLERS ---
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateSettings || !formData.techId) return;

    const recordToSave: OfficialPerformanceRecord = {
      ...formData,
      id: editingRecordId || `fin-${Date.now()}`
    };

    const existing = settings.officialRecords || [];
    const updated = editingRecordId 
      ? existing.map(r => r.id === editingRecordId ? recordToSave : r)
      : [recordToSave, ...existing];

    onUpdateSettings({ ...settings, officialRecords: updated });
    setShowAddModal(false);
    setEditingRecordId(null);
  };

  const handleDelete = (id: string) => {
    if (!onUpdateSettings || !window.confirm("Permanent deletion of this financial record. Proceed?")) return;
    const updated = (settings.officialRecords || []).filter(r => r.id !== id);
    onUpdateSettings({ ...settings, officialRecords: updated });
  };

  const openEdit = (record: OfficialPerformanceRecord) => {
    setFormData({
      techId: record.techId,
      day: record.day || 1,
      month: record.month,
      year: record.year,
      customersHandled: record.customersHandled || 0,
      servicesDone: record.servicesDone || 0,
      sellAmount: record.sellAmount || 0,
      profitAmount: record.profitAmount || 0,
      salaryAmount: record.salaryAmount || 0,
      otherExpenses: record.otherExpenses || 0
    });
    setEditingRecordId(record.id);
    setShowAddModal(true);
  };

  const setRangePreset = (type: 'month' | 'year') => {
    const now = new Date();
    if (type === 'month') {
      setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
      setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
    } else {
      setStartDate(new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]);
      setEndDate(new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]);
    }
  };

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const years = [2024, 2025, 2026, 2027];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700 max-w-[1920px] mx-auto">
      
      {/* 1. ADVANCED CONTROL BAR */}
      <div className="bg-white p-5 lg:p-6 rounded-[2rem] lg:rounded-[3rem] border border-slate-200 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 w-full xl:w-auto">
           <div className="w-12 h-12 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-indigo-100 shrink-0">
              <Wallet size={24} />
           </div>
           <div>
              <h1 className="text-lg lg:text-xl font-black text-slate-800 tracking-tight">Financial Audit</h1>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Incentive engine & Profit share</p>
           </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-3 bg-slate-50 p-2 lg:p-3 rounded-[2rem] border border-slate-100 w-full xl:w-auto overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 shrink-0">
                <div className="relative group">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={12} />
                    <input 
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:ring-4 ring-indigo-500/5 transition-all"
                    />
                </div>
                <ChevronRight size={12} className="text-slate-300" />
                <div className="relative group">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={12} />
                    <input 
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:ring-4 ring-indigo-500/5 transition-all"
                    />
                </div>
            </div>
            <div className="h-5 w-px bg-slate-200 hidden md:block shrink-0"></div>
            <div className="flex gap-1.5 shrink-0">
                <button onClick={() => setRangePreset('month')} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm active:scale-95">Month</button>
                <button onClick={() => setRangePreset('year')} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm active:scale-95">Year</button>
            </div>
        </div>

        <button 
          onClick={() => { setEditingRecordId(null); setShowAddModal(true); }}
          className="w-full xl:w-auto px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-2xl flex items-center justify-center gap-2.5 active:scale-95"
        >
          <Plus size={16} /> Log Performance
        </button>
      </div>

      {/* 2. KPI PULSE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Period Gross Sales', val: kpis.totalSales, icon: ReceiptText, color: 'indigo' },
          { label: 'Cumulative Net Profit', val: kpis.totalNetProfit, icon: TrendingUp, color: 'emerald' },
          { label: 'Bonus Distribution', val: kpis.totalBonus, icon: Sparkles, color: 'amber' },
          { label: 'Margin Efficiency', val: `${kpis.avgMargin.toFixed(1)}%`, icon: Target, color: 'purple' }
        ].map((card, i) => (
          <div key={i} className="bg-white p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
             <div className={`absolute -right-6 -top-6 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 text-${card.color}-600`}>
                <card.icon size={120} />
             </div>
             <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1 relative z-10">{card.label}</p>
             <h3 className="text-2xl lg:text-4xl font-black text-slate-800 relative z-10">
               {typeof card.val === 'number' ? `₹${card.val.toLocaleString()}` : card.val}
             </h3>
             <div className="mt-4 flex items-center gap-1.5 relative z-10">
                <span className={`w-1.5 h-1.5 rounded-full bg-${card.color}-500 animate-pulse`}></span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Verified Metric</span>
             </div>
          </div>
        ))}
      </div>

      {/* 3. PERFORMANCE LOG GRID */}
      <div className="bg-white rounded-[2rem] lg:rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
         <div className="p-4 lg:p-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-5 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row bg-white p-1 rounded-2xl border border-slate-200 shadow-inner w-full lg:w-auto">
               <div className="relative group flex-1 sm:w-56">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search personnel..."
                    className="w-full pl-9 pr-4 py-3 sm:py-2 text-[11px] font-bold text-slate-700 bg-transparent outline-none"
                  />
               </div>
               
               <div className="h-px w-full sm:h-5 sm:w-px bg-slate-200 sm:mx-2 self-center"></div>
               
               <div className="flex items-center group relative p-2 sm:p-0">
                  <UserCog size={14} className="text-slate-300 mr-2" />
                  <select 
                     value={selectedRole}
                     onChange={e => { setSelectedRole(e.target.value); setSelectedStaffId('all'); }}
                     className="bg-transparent text-[10px] font-black uppercase text-indigo-600 outline-none cursor-pointer pr-4 w-full"
                  >
                     <option value="all">All Roles</option>
                     <option value="TECHNICIAN">Technician</option>
                     <option value="MANAGER">Manager</option>
                     <option value="ADMIN">Admin</option>
                     <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
               </div>

               <div className="h-px w-full sm:h-5 sm:w-px bg-slate-200 sm:mx-2 self-center"></div>

               <div className="flex items-center group relative p-2 sm:p-0">
                  <Users size={14} className="text-slate-300 mr-2" />
                  <select 
                     value={selectedStaffId}
                     onChange={e => setSelectedStaffId(e.target.value)}
                     className="bg-transparent text-[10px] font-black uppercase text-indigo-600 outline-none cursor-pointer pr-4 w-full"
                  >
                     <option value="all">Global View</option>
                     {accessibleTechs.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
               </div>
            </div>

            <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full lg:w-auto overflow-x-auto no-scrollbar">
               <button 
                  onClick={() => setActiveTab('ledger')}
                  className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 lg:flex-none ${activeTab === 'ledger' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
               >
                  <LayoutList size={14} /> Detailed Ledger
               </button>
               <button 
                  onClick={() => setActiveTab('summary')}
                  className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 lg:flex-none ${activeTab === 'summary' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
               >
                  <BarChart3 size={14} /> Team Aggregates
               </button>
            </div>
         </div>

         <div className="flex-1 overflow-x-auto custom-scrollbar min-h-0">
            {activeTab === 'ledger' ? (
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-white sticky top-0 z-10">
                            <th className="px-6 py-5">Personnel Identity</th>
                            <th className="px-6 py-5">Role</th>
                            <th className="px-6 py-5">Registry Date</th>
                            <th className="px-6 py-5 text-center">Output Load</th>
                            <th className="px-6 py-5">Financial Ledger (₹)</th>
                            <th className="px-6 py-5 text-center">Efficiency</th>
                            <th className="px-6 py-5 text-right">Incentive Yield</th>
                            <th className="px-6 py-5"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {financialLogs.map((log) => (
                            <tr key={log.id} className="group hover:bg-slate-50/80 transition-all duration-300">
                                <td className="px-6 py-5">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-50 overflow-hidden border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-[11px] shadow-sm shrink-0">
                                        {log.tech.photo ? <img src={log.tech.photo} className="w-full h-full object-cover" /> : log.tech.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black text-slate-800 text-[13px] leading-none mb-1 truncate">{log.tech.name}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Certified Specialist</p>
                                    </div>
                                </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                                        log.tech.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                        log.tech.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                        log.tech.role === 'MANAGER' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                        'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                        {log.tech.role.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                <div className="flex items-center gap-2 text-slate-600 font-bold text-[11px] whitespace-nowrap">
                                    <CalendarDays size={12} className="text-indigo-400" />
                                    {log.day} {months[log.month]} {log.year}
                                </div>
                                </td>
                                <td className="px-6 py-5">
                                <div className="flex flex-col items-center gap-1">
                                    <div className="flex gap-1">
                                        <div className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase border border-blue-100 whitespace-nowrap" title="Jobs Done">{log.servicesDone} J</div>
                                        <div className="px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded text-[9px] font-black uppercase border border-purple-100 whitespace-nowrap" title="Customers Handled">{log.customersHandled} C</div>
                                    </div>
                                </div>
                                </td>
                                <td className="px-6 py-5">
                                <div className="space-y-1">
                                    <div className="flex justify-between w-36 text-[9px] font-bold">
                                        <span className="text-slate-400">Yield:</span>
                                        <span className="text-emerald-600">₹{log.profitAmount?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between w-36 text-[9px] font-bold">
                                        <span className="text-slate-400">Overhead:</span>
                                        <span className="text-rose-400">₹{((log.salaryAmount || 0) + (log.otherExpenses || 0)).toLocaleString()}</span>
                                    </div>
                                    <div className="h-px bg-slate-100 w-36"></div>
                                    <div className="flex justify-between w-36 text-xs font-black">
                                        <span className="text-slate-800">NET:</span>
                                        <span className={log.netProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}>₹{log.netProfit.toLocaleString()}</span>
                                    </div>
                                </div>
                                </td>
                                <td className="px-6 py-5">
                                <div className="flex flex-col items-center gap-1">
                                    <div className="w-16 bg-slate-100 h-1 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full ${log.margin > 30 ? 'bg-indigo-500' : 'bg-slate-400'}`} 
                                            style={{ width: `${Math.min(Math.max(log.margin, 0), 100)}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{log.margin.toFixed(0)}% Profitability</span>
                                </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                {log.bonus > 0 ? (
                                    <div className="inline-flex flex-col items-end">
                                        <div className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-100 whitespace-nowrap">
                                            +₹{log.bonus.toLocaleString()}
                                        </div>
                                        <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest mt-1.5 italic whitespace-nowrap">5% Direct Share</span>
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest whitespace-nowrap">NIL Incentive</span>
                                )}
                                </td>
                                <td className="px-6 py-5 text-right shrink-0">
                                <div className="flex gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-2">
                                    <button onClick={() => openEdit(log)} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all"><Edit2 size={12}/></button>
                                    <button onClick={() => handleDelete(log.id)} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-500 hover:border-rose-200 shadow-sm transition-all"><Trash2 size={12}/></button>
                                </div>
                                </td>
                            </tr>
                        ))}
                        {financialLogs.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-24 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200 border border-dashed border-slate-200">
                                    <ReceiptText size={24} />
                                </div>
                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Operational Data</h4>
                                <p className="text-slate-300 text-xs mt-1">Select a different range, role or staff member.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            ) : (
                /* SUMMARY VIEW BY TEAM MEMBER */
                <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-white sticky top-0 z-10">
                            <th className="px-10 py-5">Member Portfolio</th>
                            <th className="px-6 py-5 text-center">Data Points</th>
                            <th className="px-6 py-5 text-center">Total Output (J/C)</th>
                            <th className="px-6 py-5">Aggregated Yield</th>
                            <th className="px-6 py-5 text-center">Cumulative NET</th>
                            <th className="px-10 py-5 text-right">Total Bonus</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {teamAggregates.map((agg) => (
                            <tr key={agg.tech.id} className="group hover:bg-slate-50 transition-all duration-300">
                                <td className="px-10 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center font-black text-indigo-600 shrink-0">
                                            {agg.tech.photo ? <img src={agg.tech.photo} className="w-full h-full object-cover" /> : agg.tech.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-slate-800 text-sm tracking-tight leading-none mb-1.5 truncate">{agg.tech.name}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">{agg.tech.role.replace('_', ' ')}</span>
                                                <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest whitespace-nowrap">Active Specialist</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-6 text-center">
                                    <div className="inline-flex flex-col items-center">
                                        <span className="text-sm font-black text-slate-700">{agg.count}</span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Reports</span>
                                    </div>
                                </td>
                                <td className="px-6 py-6 text-center">
                                    <div className="inline-flex flex-col items-center gap-1">
                                        <span className="text-sm font-black text-slate-700 whitespace-nowrap">{agg.totalServices} J / {agg.totalCustomers} C</span>
                                        <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500" style={{ width: `${Math.min(agg.totalServices * 2, 100)}%` }}></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-6">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gross Flow</p>
                                        <p className="text-sm font-black text-emerald-600">₹{agg.totalProfit.toLocaleString()}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-6 text-center">
                                    <div className={`inline-flex flex-col items-center px-4 py-1.5 rounded-xl border ${agg.totalNet >= 0 ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                        <span className="text-sm font-black">₹{agg.totalNet.toLocaleString()}</span>
                                        <span className="text-[7px] font-bold uppercase tracking-widest opacity-60">Consolidated</span>
                                    </div>
                                </td>
                                <td className="px-10 py-6 text-right">
                                    <div className="inline-flex flex-col items-end">
                                        <div className="text-lg font-black text-slate-800 tabular-nums whitespace-nowrap">
                                            ₹{agg.totalBonus.toLocaleString()}
                                        </div>
                                        <div className="flex items-center gap-1 text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-1">
                                            <Sparkles size={10} className="animate-pulse" /> Incentive
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {teamAggregates.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-10 py-32 text-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 border border-dashed border-slate-200">
                                        <Users size={32} />
                                    </div>
                                    <h4 className="text-lg font-black text-slate-300 uppercase tracking-widest">No Member Data Captured</h4>
                                    <p className="text-slate-400 text-sm mt-1">System is awaiting performance logs for the selected criteria.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
         </div>
      </div>

      {/* 4. DATA ENTRY SUITE (THE MODAL) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md">
           <div className="bg-white rounded-none sm:rounded-[3rem] w-full max-w-6xl shadow-2xl animate-in fade-in zoom-in-95 duration-500 overflow-hidden flex flex-col h-full sm:max-h-[95vh] border border-white/20">
              
              {/* Modal Header */}
              <div className="px-6 lg:px-10 py-4 lg:py-6 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md z-10 shrink-0 sticky top-0">
                  <div className="flex items-center gap-4 lg:gap-5">
                      <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center text-white shadow-xl ${editingRecordId ? 'bg-amber-500 shadow-amber-100' : 'bg-indigo-600 shadow-indigo-100'}`}>
                          {editingRecordId ? <Edit2 size={18} /> : <Calculator size={18} />}
                      </div>
                      <div>
                         <h3 className="font-black text-slate-800 text-lg lg:text-xl uppercase tracking-tighter leading-none">
                            {editingRecordId ? 'Adjust Registry' : 'Sync Performance'}
                         </h3>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Asset & Productivity Ledger</p>
                      </div>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="p-2 lg:p-2.5 hover:bg-slate-100 rounded-full text-slate-400 transition-all active:scale-90"><X size={24}/></button>
              </div>

              {/* Multi-Pane Body */}
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
                 
                 {/* LEFT: FORM */}
                 <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 bg-slate-50/30">
                    <form onSubmit={handleSave} className="space-y-8 lg:space-y-10">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                           <div className="space-y-3">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Technician Identification</label>
                              <div className="relative group">
                                 <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                 <select 
                                    required
                                    value={formData.techId}
                                    onChange={e => setFormData({...formData, techId: e.target.value})}
                                    className="w-full pl-10 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-800 focus:ring-4 ring-indigo-500/5 outline-none appearance-none cursor-pointer transition-all shadow-sm"
                                 >
                                    <option value="">-- Choose Member --</option>
                                    {accessibleTechs.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                 </select>
                                 <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                              </div>
                           </div>
                           
                           <div className="space-y-3">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Registry Timestamp</label>
                              <div className="grid grid-cols-3 gap-2">
                                 <select 
                                    value={formData.day}
                                    onChange={e => setFormData({...formData, day: parseInt(e.target.value)})}
                                    className="px-2 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-800 outline-none shadow-sm cursor-pointer"
                                 >
                                    {Array.from({length: 31}, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                                 </select>
                                 <select 
                                    value={formData.month}
                                    onChange={e => setFormData({...formData, month: parseInt(e.target.value)})}
                                    className="px-2 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-800 outline-none shadow-sm cursor-pointer"
                                 >
                                    {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                 </select>
                                 <select 
                                    value={formData.year}
                                    onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}
                                    className="px-2 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-800 outline-none shadow-sm cursor-pointer"
                                 >
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                 </select>
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                            
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em] flex items-center gap-2">
                                   <Target size={14} /> Output Variables
                                </h4>
                                <div className="space-y-4">
                                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-5">
                                       <div className="space-y-1.5">
                                          <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Client Interactions</label>
                                          <input 
                                             type="number" 
                                             value={formData.customersHandled}
                                             onChange={e => setFormData({...formData, customersHandled: parseInt(e.target.value) || 0})}
                                             className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-lg lg:text-xl font-black text-slate-800 outline-none focus:bg-white transition-colors"
                                          />
                                       </div>
                                       <div className="space-y-1.5">
                                          <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Services Initialized</label>
                                          <input 
                                             type="number" 
                                             value={formData.servicesDone}
                                             onChange={e => setFormData({...formData, servicesDone: parseInt(e.target.value) || 0})}
                                             className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-lg lg:text-xl font-black text-slate-800 outline-none focus:bg-white transition-colors"
                                          />
                                       </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em] flex items-center gap-2">
                                   <DollarSign size={14} /> Financial Audit (₹)
                                </h4>
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm grid grid-cols-2 gap-x-4 gap-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Total Sales</label>
                                        <input 
                                            type="number" 
                                            value={formData.sellAmount}
                                            onChange={e => setFormData({...formData, sellAmount: parseFloat(e.target.value) || 0})}
                                            className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black text-slate-800 outline-none focus:bg-white transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Gross Profit</label>
                                        <input 
                                            type="number" 
                                            value={formData.profitAmount}
                                            onChange={e => setFormData({...formData, profitAmount: parseFloat(e.target.value) || 0})}
                                            className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black text-indigo-600 outline-none focus:bg-white transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Staff Base Cost</label>
                                        <input 
                                            type="number" 
                                            value={formData.salaryAmount}
                                            onChange={e => setFormData({...formData, salaryAmount: parseFloat(e.target.value) || 0})}
                                            className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black text-slate-800 outline-none focus:bg-white transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Ops Expenses</label>
                                        <input 
                                            type="number" 
                                            value={formData.otherExpenses}
                                            onChange={e => setFormData({...formData, otherExpenses: parseFloat(e.target.value) || 0})}
                                            className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black text-slate-800 outline-none focus:bg-white transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* LIVE PROJECTED PAYOUT CARD */}
                        <div className="bg-slate-900 p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
                           <div className="absolute right-0 top-0 p-8 opacity-10">
                              <Sparkles size={140} />
                           </div>
                           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                              <div className="flex items-center gap-5">
                                 <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/10 rounded-xl lg:rounded-2xl border border-white/20 backdrop-blur-md flex items-center justify-center text-indigo-400">
                                    <Calculator size={28} />
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Real-time Yield</p>
                                    <h5 className="text-2xl lg:text-3xl font-black text-white whitespace-nowrap">₹{projection.net.toLocaleString()} <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider ml-1">Net Flow</span></h5>
                                 </div>
                              </div>
                              <div className="flex flex-col items-center md:items-end w-full md:w-auto">
                                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2.5">Automated Profit Share</p>
                                 <div className={`px-6 lg:px-8 py-3 lg:py-4 rounded-2xl lg:rounded-[1.75rem] text-xl lg:text-2xl font-black transition-all duration-500 w-full md:w-auto text-center ${projection.bonus > 0 ? 'bg-indigo-600 shadow-xl shadow-indigo-500/30 scale-105 ring-4 ring-indigo-400/20' : 'bg-white/5 text-slate-600 grayscale'}`}>
                                    + ₹{projection.bonus.toLocaleString()}
                                 </div>
                                 <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-4 flex items-center gap-1.5">
                                    <ShieldCheck size={10} className="text-indigo-400" /> Fixed 5% Model
                                 </p>
                              </div>
                           </div>
                        </div>

                        <div className="flex gap-4 pt-4 shrink-0">
                           <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-400 font-black rounded-2xl lg:rounded-[2rem] text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95">Discard Entry</button>
                           <button type="submit" disabled={!formData.techId} className="flex-[2.5] py-4 bg-indigo-600 text-white font-black rounded-2xl lg:rounded-[2rem] text-[10px] lg:text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50">
                              <Save size={18} /> {editingRecordId ? 'Apply Correction' : 'Commit Registry'}
                           </button>
                        </div>
                    </form>
                 </div>

                 {/* RIGHT: STAFF CONTEXT SIDEBAR */}
                 <div className="hidden lg:block lg:w-1/3 bg-slate-100 p-8 border-l border-slate-200 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                          <History size={18} />
                       </div>
                       <div>
                          <h4 className="font-black text-slate-800 uppercase text-[11px] tracking-widest">Performance History</h4>
                          <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Comparison Reference</p>
                       </div>
                    </div>

                    <div className="space-y-4">
                        {staffHistory.map(entry => (
                           <div key={entry.id} className="bg-white p-4 lg:p-5 rounded-[2rem] border border-slate-200 shadow-sm space-y-4 group hover:border-indigo-400 transition-colors">
                              <div className="flex justify-between items-start">
                                 <div>
                                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{entry.day} {months[entry.month]}</p>
                                    <p className="text-[9px] text-slate-400 font-bold">{entry.year}</p>
                                 </div>
                                 <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${((entry.profitAmount || 0) - (entry.salaryAmount || 0) - (entry.otherExpenses || 0)) > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400'}`}>
                                    ₹{((entry.profitAmount || 0) - (entry.salaryAmount || 0) - (entry.otherExpenses || 0)).toLocaleString()}
                                 </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-center border-t border-slate-50 pt-3">
                                 <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Sales</p>
                                    <p className="text-[11px] font-bold text-slate-700">₹{entry.sellAmount?.toLocaleString()}</p>
                                 </div>
                                 <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Jobs</p>
                                    <p className="text-[11px] font-bold text-slate-700">{entry.servicesDone}</p>
                                 </div>
                              </div>
                           </div>
                        ))}
                        {staffHistory.length === 0 && (
                           <div className="py-20 text-center text-slate-400 flex flex-col items-center">
                              <div className="w-12 h-12 bg-slate-50 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center mb-4">
                                <FileSearch size={20} className="opacity-20" />
                              </div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">No Historical Data</p>
                           </div>
                        )}
                    </div>
                 </div>

              </div>
           </div>
        </div>
      )}

    </div>
  );
}
