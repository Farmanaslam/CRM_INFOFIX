import React, { useMemo } from "react";
import { Ticket, Customer, AppSettings, User } from "../types";
import {
  Briefcase,
  Clock,
  CalendarCheck,
  Users,
  Laptop,
  Zap,
  TrendingUp,
  FileCheck,
  AlertTriangle,
  Plus,
  UserPlus,
  ArrowRight,
  Monitor,
  Smartphone,
  Cctv,
  ShieldAlert,
  Layers,
  MapPin,
  ChevronRight,
  Activity,
  Rocket,
  ArrowUpRight,
  Store as StoreIcon,
  Wrench,
  FileQuestion,
  CheckCircle2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

interface DashboardProps {
  tickets: Ticket[];
  customers: Customer[];
  settings: AppSettings;
  currentUser: User;
  onNavigate: (view: any) => void;
  onAction: (action: string) => void;
  selectedZoneId: string;
}

const Dashboard: React.FC<DashboardProps> = ({
  tickets,
  customers,
  settings,
  currentUser,
  onNavigate,
  onAction,
  selectedZoneId,
}) => {
  // --- ZONE & ROLE FILTERED DATA ---
  const zoneFilteredTickets = useMemo(() => {
    let result = tickets;

    // Zone Filter
    if (selectedZoneId !== "all") {
      const zoneStoreNames = settings.stores
        .filter((s) => s.zoneId === selectedZoneId)
        .map((s) => s.name);
      result = result.filter((t) => zoneStoreNames.includes(t.store));
    }

    // Role Specific Filter: Technicians only see their assigned tickets
    if (currentUser.role === "TECHNICIAN") {
      result = result.filter((t) => t.assignedToId === currentUser.id);
    }

    return result;
  }, [tickets, selectedZoneId, settings.stores, currentUser]);

  const activeZoneName = useMemo(() => {
    if (selectedZoneId === "all") return "Global Network";
    return (
      settings.zones.find((z) => z.id === selectedZoneId)?.name ||
      "Local Sector"
    );
  }, [selectedZoneId, settings.zones]);

  const isSystemBlank = tickets.length === 0;

  // --- STATS ENGINE ---
  const metrics = useMemo(() => {
    const activeTickets = zoneFilteredTickets.filter(
      (t) => t.status !== "Resolved" && t.status !== "Rejected"
    );
    const today = new Date().toLocaleDateString();
    const resolvedToday = zoneFilteredTickets.filter(
      (t) => t.status === "Resolved" && t.date === today
    ).length;

    // SLA Overdue Calculation
    const overdueCount = activeTickets.filter((t) => {
      const created = new Date(t.date);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - created.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const priority = t.priority.toLowerCase() as "high" | "medium" | "low";
      const allowedDays = settings.sla[priority] || 7;
      return diffDays > allowedDays;
    }).length;

    // Strict Zonal Customer Filter: Identify unique customers present in the current zone's ticket list
    const customerEmailsInZone = new Set(
      zoneFilteredTickets.map((t) => t.email.toLowerCase())
    );
    const totalCustomersInZone = customers.length;

    return {
      openJobs: activeTickets.length,
      overdue: overdueCount,
      resolvedToday,
      totalCustomers: totalCustomersInZone,
      laptops: zoneFilteredTickets.filter((t) => t.deviceType === "Laptop")
        .length,
      brands: zoneFilteredTickets.filter((t) => t.brand).length,
      newIntake: zoneFilteredTickets.filter((t) => t.status === "New").length,
      allTimeResolved: zoneFilteredTickets.filter(
        (t) => t.status === "Resolved"
      ).length,
      pendingApprovals: zoneFilteredTickets.filter(
        (t) => t.status === "Pending Approval"
      ).length,
    };
  }, [zoneFilteredTickets, customers, settings.sla]);

  // --- LOAD TRACKING ---
  const storeLoads = useMemo(() => {
    const loadMap: Record<string, number> = {};

    // Count tickets per store name
    zoneFilteredTickets.forEach((t) => {
      const storeName = t.store?.trim();
      if (!storeName) return;
      loadMap[storeName] = (loadMap[storeName] || 0) + 1;
    });

    const totalTickets = Math.max(zoneFilteredTickets.length, 1);

    return Object.entries(loadMap)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / totalTickets) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [zoneFilteredTickets]);

  const technicianLoads = useMemo(() => {
    const activeTotal = metrics.openJobs || 1;
    const loadMap: Record<string, number> = {};
    zoneFilteredTickets
      .filter(
        (t) =>
          t.status !== "Resolved" && t.status !== "Rejected" && t.assignedToId
      )
      .forEach(
        (t) => (loadMap[t.assignedToId!] = (loadMap[t.assignedToId!] || 0) + 1)
      );

    const relevantTechs =
      selectedZoneId === "all"
        ? settings.teamMembers.filter((m) => m.role === "TECHNICIAN")
        : settings.teamMembers.filter(
            (m) => m.role === "TECHNICIAN" && m.zoneId === selectedZoneId
          );

    return relevantTechs
      .map((tech) => ({
        id: tech.id,
        name: tech.name,
        photo: tech.photo,
        count: loadMap[tech.id] || 0,
        percent: Math.round(((loadMap[tech.id] || 0) / activeTotal) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [
    zoneFilteredTickets,
    settings.teamMembers,
    selectedZoneId,
    metrics.openJobs,
  ]);

  // --- CHART DATA ---
  const intakeTrendData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString();
      const count = zoneFilteredTickets.filter(
        (t) => t.date === dateStr
      ).length;
      days.push({
        name: d.toLocaleDateString("en-US", { weekday: "short" }),
        tickets: count,
      });
    }
    return days;
  }, [zoneFilteredTickets]);

  const deviceDistData = useMemo(() => {
    const counts: Record<string, number> = {};
    zoneFilteredTickets.forEach(
      (t) => (counts[t.deviceType] = (counts[t.deviceType] || 0) + 1)
    );
    return Object.keys(counts)
      .map((k) => ({ name: k, value: counts[k] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [zoneFilteredTickets]);

  const urgentAlerts = useMemo(() => {
    return zoneFilteredTickets
      .filter(
        (t) =>
          (t.priority === "High" || t.status === "On Hold") &&
          t.status !== "Resolved" &&
          t.status !== "Rejected"
      )
      .slice(0, 5);
  }, [zoneFilteredTickets]);

  // --- ONBOARDING VIEW ---
  if (isSystemBlank) {
    return (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20">
        <div className="bg-slate-900 rounded-[3rem] p-10 lg:p-16 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-600 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl mb-8 border border-white/10">
              <Rocket size={20} className="text-indigo-400 animate-bounce" />
              <span className="text-xs font-black uppercase tracking-widest">
                System Readiness Phase
              </span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-black tracking-tighter leading-none mb-6">
              Initialize Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                Command Center
              </span>
            </h1>
            <p className="text-slate-400 text-lg lg:text-xl font-medium leading-relaxed mb-10">
              Your business environment is deployed. Complete the 4-step
              initialization protocol to start processing service requests.
            </p>
            <button
              onClick={() => onNavigate("settings")}
              className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-50 transition-all flex items-center gap-3 active:scale-95"
            >
              Start System Setup <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[
            {
              title: "Zones",
              desc: "Define operational sectors",
              icon: Layers,
              done: settings.zones.length > 0,
              view: "settings",
            },
            {
              title: "Stores",
              desc: "Add branch locations",
              icon: StoreIcon,
              done: settings.stores.length > 0,
              view: "settings",
            },
            {
              title: "Personnel",
              desc: "Invite technicians",
              icon: Users,
              done: settings.teamMembers.length > 1,
              view: "settings",
            },
            {
              title: "Activation",
              desc: "Raise first ticket",
              icon: Zap,
              done: false,
              view: "new_ticket",
            },
          ].map((step, idx) => (
            <div
              key={idx}
              className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-400 transition-all"
            >
              <div>
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                    step.done
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                  }`}
                >
                  {step.done ? (
                    <CheckCircle2 size={28} />
                  ) : (
                    <step.icon size={28} />
                  )}
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                  {step.desc}
                </p>
              </div>
              <button
                onClick={() =>
                  step.view === "new_ticket"
                    ? onAction("new_ticket")
                    : onNavigate(step.view)
                }
                className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-indigo-600 transition-all"
              >
                {step.done ? "Completed" : "Initialize"}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- OPERATIONAL COMMAND CENTER ---
  return (
    <div className="space-y-6 lg:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      {/* GLOBAL ACTIONS HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm backdrop-blur-md bg-white/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Activity size={20} />
            </div>
            <h2 className="text-xl lg:text-3xl font-black text-slate-800 tracking-tighter">
              Command Center
            </h2>
          </div>
          <p className="text-slate-500 text-sm mt-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Operational Intelligence Sync:{" "}
            <span className="font-bold text-indigo-600">{activeZoneName}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onAction("new_ticket")}
            className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2.5 text-xs uppercase tracking-widest active:scale-95"
          >
            <Plus size={18} strokeWidth={3} /> New Ticket
          </button>
          <button
            onClick={() => onNavigate("customers")}
            className="px-6 py-3 bg-white text-slate-700 font-black rounded-2xl border border-slate-200 hover:bg-slate-50 hover:border-indigo-300 transition-all flex items-center gap-2.5 text-xs uppercase tracking-widest shadow-sm active:scale-95"
          >
            <UserPlus size={18} /> Add Customer
          </button>
        </div>
      </div>

      {/* PRIMARY KPI PULSE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm group hover:border-indigo-400 transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
            <Briefcase size={80} />
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 relative z-10">
            Open Jobs
          </p>
          <h3 className="text-4xl font-black text-slate-800 tabular-nums relative z-10">
            {metrics.openJobs}
          </h3>
          <div className="mt-4 flex items-center gap-1.5 text-indigo-600 text-[9px] font-black uppercase tracking-widest bg-indigo-50 w-fit px-2 py-0.5 rounded-lg">
            Active Volume
          </div>
        </div>
        <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm group hover:border-rose-400 transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
            <Clock size={80} />
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 relative z-10">
            Est. Overdue
          </p>
          <h3
            className={`text-4xl font-black tabular-nums relative z-10 ${
              metrics.overdue > 0
                ? "text-rose-600 animate-pulse"
                : "text-slate-800"
            }`}
          >
            {metrics.overdue}
          </h3>
          <div className="mt-4 flex items-center gap-1.5 text-rose-600 text-[9px] font-black uppercase tracking-widest bg-rose-50 w-fit px-2 py-0.5 rounded-lg">
            SLA Violations
          </div>
        </div>
        <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm group hover:border-emerald-400 transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
            <CalendarCheck size={80} />
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 relative z-10">
            Resolved Today
          </p>
          <h3 className="text-4xl font-black text-emerald-600 tabular-nums relative z-10">
            {metrics.resolvedToday}
          </h3>
          <div className="mt-4 flex items-center gap-1.5 text-emerald-600 text-[9px] font-black uppercase tracking-widest bg-emerald-50 w-fit px-2 py-0.5 rounded-lg">
            Successful Cyc.
          </div>
        </div>
        <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm group hover:border-purple-400 transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
            <Users size={80} />
          </div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 relative z-10">
            Zonal Clients
          </p>
          <h3 className="text-4xl font-black text-slate-800 tabular-nums relative z-10">
            {metrics.totalCustomers}
          </h3>
          <div className="mt-4 flex items-center gap-1.5 text-purple-600 text-[9px] font-black uppercase tracking-widest bg-purple-50 w-fit px-2 py-0.5 rounded-lg">
            Registry Depth
          </div>
        </div>
      </div>

      {/* SECONDARY MICRO-METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {
            label: "Laptops",
            val: metrics.laptops,
            icon: Laptop,
            color: "text-blue-500",
          },
          {
            label: "Brand Link",
            val: metrics.brands,
            icon: Zap,
            color: "text-amber-500",
          },
          {
            label: "New Intake",
            val: metrics.newIntake,
            icon: TrendingUp,
            color: "text-indigo-500",
          },
          {
            label: "Total Res.",
            val: metrics.allTimeResolved,
            icon: CheckCircle2,
            color: "text-emerald-500",
          },
          {
            label: "Pending Appr.",
            val: metrics.pendingApprovals,
            icon: FileCheck,
            color: "text-purple-500",
          },
        ].map((m, i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 group hover:shadow-md transition-all"
          >
            <div
              className={`p-2 rounded-xl bg-slate-50 ${m.color} group-hover:scale-110 transition-transform`}
            >
              <m.icon size={16} />
            </div>
            <div>
              <p className="text-[14px] font-black text-slate-800 leading-none">
                {m.val}
              </p>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                {m.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* VISUAL INTELLIGENCE & ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* INTAKE TREND AREA CHART */}
        <div className="lg:col-span-8 bg-white p-8 lg:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-600" /> Intake
                Velocity
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">
                7-Day Ticket Momentum
              </p>
            </div>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-100"></div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={intakeTrendData}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 900 }}
                  dy={15}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
                    padding: "12px",
                  }}
                  itemStyle={{ color: "#4f46e5", fontWeight: "900" }}
                />
                <Area
                  type="monotone"
                  dataKey="tickets"
                  stroke="#4f46e5"
                  strokeWidth={4}
                  fill="url(#trendGrad)"
                  dot={{
                    r: 4,
                    fill: "#fff",
                    stroke: "#4f46e5",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                    shadow: "0 0 10px rgba(79, 70, 229, 0.3)",
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* URGENT ATTENTION LIST */}
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest">
              <ShieldAlert size={18} className="text-rose-500" /> Urgent Focus
            </h3>
            <span className="text-[10px] font-black bg-white border border-slate-200 px-2 py-1 rounded-lg text-slate-500">
              {urgentAlerts.length} NODES
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {urgentAlerts.length > 0 ? (
              urgentAlerts.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => onNavigate("tickets")}
                  className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer group relative"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                      ID: {ticket.ticketId}
                    </span>
                    <div
                      className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${
                        ticket.priority === "High"
                          ? "bg-rose-500 text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {ticket.priority === "High" ? "CRITICAL" : "ON HOLD"}
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {ticket.deviceType} • {ticket.brand}
                  </h4>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      {ticket.date}
                    </p>
                    <ArrowUpRight
                      size={14}
                      className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <CheckCircle2 size={48} className="text-emerald-500 mb-2" />
                <p className="text-xs font-black uppercase">Sector Clear</p>
              </div>
            )}
          </div>
          <button
            onClick={() => onNavigate("tickets")}
            className="p-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 hover:bg-slate-50 border-t border-slate-100 transition-colors"
          >
            Access Full Dispatch
          </button>
        </div>
      </div>

      {/* LOAD TRACKING & DEVICE MIX */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* SECTOR YIELD (STORE LOAD) */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 flex flex-col group hover:border-indigo-300 transition-all shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest">
              <StoreIcon size={20} className="text-indigo-600" /> Sector Yield
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Branches
            </span>
          </div>
          <div className="space-y-6 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {storeLoads.map((s) => (
              <div key={s.name} className="relative">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-tight truncate max-w-[150px]">
                    {s.name}
                  </span>
                  <span className="text-[10px] font-black text-indigo-600 tabular-nums">
                    {s.count} JOBS
                  </span>
                </div>
                <div className="w-full bg-slate-50 rounded-full h-2.5 overflow-hidden border border-slate-100 shadow-inner">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(79,70,229,0.3)]"
                    style={{ width: `${Math.max(s.percent, 4)}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {storeLoads.length === 0 && (
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center py-10">
                No clusters detected
              </p>
            )}
          </div>
        </div>

        {/* PERSONNEL LOAD */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 flex flex-col group hover:border-indigo-300 transition-all shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest">
              <Wrench size={20} className="text-indigo-600" /> Personnel Load
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Efficiency
            </span>
          </div>
          <div className="space-y-6 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {technicianLoads.map((tech) => (
              <div key={tech.id} className="relative">
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-indigo-600 uppercase overflow-hidden">
                      {tech.photo ? (
                        <img
                          src={tech.photo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        tech.name.charAt(0)
                      )}
                    </div>
                    <span className="text-xs font-black text-slate-700 uppercase tracking-tight truncate max-w-[120px]">
                      {tech.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-indigo-600 tabular-nums">
                    {tech.count} UNITS
                  </span>
                </div>
                <div className="w-full bg-slate-50 rounded-full h-2.5 overflow-hidden border border-slate-100 shadow-inner">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(79,70,229,0.3)]"
                    style={{ width: `${Math.max(tech.percent, 0)}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {technicianLoads.length === 0 && (
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center py-10">
                Roster Idle
              </p>
            )}
          </div>
        </div>

        {/* CATEGORY MIX BAR CHART */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 flex flex-col group hover:border-indigo-300 transition-all shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest">
              <Layers size={20} className="text-indigo-600" /> Category Mix
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Asset Distribution
            </span>
          </div>
          <div className="flex-1 h-full w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceDistData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 900 }}
                  dy={10}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)",
                    padding: "8px",
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={24}>
                  {deviceDistData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        ["#6366f1", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b"][
                          index % 5
                        ]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
