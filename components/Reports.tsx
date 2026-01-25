import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Line,
} from "recharts";
import {
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Search,
  MapPin,
  Filter,
  Users,
  Briefcase,
  Smartphone,
  Laptop,
  Monitor,
  Loader2,
  ArrowUpRight,
  Target,
  FileText,
  ClipboardList,
  Activity,
  Layers,
  Shield,
  User as UserIcon,
} from "lucide-react";
import { Ticket, AppSettings } from "../types";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { User } from "../types";
interface ReportsProps {
  currentUser: User;
  tickets: Ticket[];
  settings: AppSettings;
}

const COLORS = {
  primary: "#6366f1", // Indigo
  secondary: "#8b5cf6", // Violet
  success: "#10b981", // Emerald
  warning: "#f59e0b", // Amber
  danger: "#ef4444", // Red
  info: "#06b6d4", // Cyan
  slate: "#64748b", // Slate
};

const PIE_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

export default function Reports({
  tickets,
  settings,
  currentUser,
}: ReportsProps) {
  // --- STATE ---
  const [timeFilter, setTimeFilter] = useState<"7d" | "30d" | "90d" | "all">(
    "30d",
  );
  const [storeFilter, setStoreFilter] = useState<string>("All");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [memberFilter, setMemberFilter] = useState<string>("All");
  const [isExporting, setIsExporting] = useState(false);

  // --- HELPER FUNCTIONS ---
  const calculateDaysDiff = (date1: string, date2: string) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // --- DATA PROCESSING ---
  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate = new Date(0); // Default all time

    if (timeFilter === "7d")
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (timeFilter === "30d")
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (timeFilter === "90d")
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    return tickets.filter((ticket) => {
      const ticketDate = new Date(ticket.date);
      // Date Check
      if (ticketDate < startDate) return false;

      // Store Check
      if (storeFilter !== "All" && ticket.store !== storeFilter) return false;

      // Role & Member Check
      if (roleFilter !== "All" || memberFilter !== "All") {
        const assignee = settings.teamMembers.find(
          (m) => m.id === ticket.assignedToId,
        );

        if (roleFilter !== "All") {
          if (!assignee || assignee.role !== roleFilter) return false;
        }

        if (memberFilter !== "All") {
          if (ticket.assignedToId !== memberFilter) return false;
        }
      }

      return true;
    });
  }, [
    tickets,
    timeFilter,
    storeFilter,
    roleFilter,
    memberFilter,
    settings.teamMembers,
  ]);

  const analytics = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {
        totalTickets: 0,
        resolvedTickets: 0,
        openTickets: 0,
        avgTat: "0",
        techPerformance: [],
        trendData: [],
        statusData: [],
        deviceData: [],
        resolutionRate: 0,
      };
    }
    // 1. KPI Stats
    const totalTickets = filteredData.length;
    const resolvedTickets = filteredData.filter((t) => t.status === "Resolved");
    const openTickets = filteredData.filter(
      (t) => t.status !== "Resolved" && t.status !== "Rejected",
    ).length;

    // 2. Average Turnaround Time (TAT)
    let totalDays = 0;
    let resolvedCountWithDate = 0;
    resolvedTickets.forEach((t) => {
      if (t.history && t.history.length > 0) {
        const resolvedLog = t.history.find((h) =>
          h.action.includes("Resolved"),
        );
        if (resolvedLog) {
          totalDays += calculateDaysDiff(
            t.date,
            resolvedLog.date.split(" ")[0],
          );
          resolvedCountWithDate++;
        }
      }
    });
    const avgTat =
      resolvedCountWithDate > 0
        ? (totalDays / resolvedCountWithDate).toFixed(1)
        : "0";

    // 3. Technician Performance (By Volume)
    const techMap: Record<
      string,
      { name: string; count: number; resolved: number }
    > = {};
    filteredData.forEach((t) => {
      if (t.assignedToId) {
        const tech = settings.teamMembers.find((m) => m.id === t.assignedToId);
        const techName = tech ? tech.name : "Unknown";

        if (!techMap[techName])
          techMap[techName] = { name: techName, count: 0, resolved: 0 };

        techMap[techName].count++;
        if (t.status === "Resolved") techMap[techName].resolved++;
      }
    });
    const techPerformance = Object.values(techMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 4. Volume Trend (Group by Date)
    const trendMap: Record<string, { date: string; tickets: number }> = {};

    filteredData.forEach((t) => {
      const d = new Date(t.date);

      // Skip invalid dates
      if (isNaN(d.getTime())) {
        console.warn(`Invalid date found in ticket: ${t.id}, date: ${t.date}`);
        return;
      }

      const isoKey = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      if (!trendMap[isoKey]) {
        trendMap[isoKey] = { date: label, tickets: 0 };
      }
      trendMap[isoKey].tickets++;
    });

    const trendData = Object.entries(trendMap)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([_, value]) => value);

    // 5. Status Distribution
    const statusCounts: Record<string, number> = {};
    filteredData.forEach((t) => {
      const statusKey = t.status.trim().toLowerCase(); // normalize
      statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;
    });
    const statusData = Object.keys(statusCounts).map((key) => ({
      name: key,
      value: statusCounts[key],
    }));

    // 6. Device Distribution
    const deviceCounts: Record<string, number> = {};
    filteredData.forEach((t) => {
      deviceCounts[t.deviceType] = (deviceCounts[t.deviceType] || 0) + 1;
    });
    const deviceData = Object.keys(deviceCounts)
      .map((key) => ({ name: key, count: deviceCounts[key] }))
      .sort((a, b) => b.count - a.count);

    return {
      totalTickets,
      resolvedTickets: resolvedTickets.length,
      openTickets,
      avgTat,
      techPerformance,
      trendData,
      statusData,
      deviceData,
      resolutionRate:
        totalTickets > 0
          ? Math.round((resolvedTickets.length / totalTickets) * 100)
          : 0,
    };
  }, [filteredData, settings.teamMembers]);

  const accessibleStaff = useMemo(() => {
    switch (currentUser.role) {
      case "SUPER_ADMIN":
        return settings.teamMembers;

      case "ADMIN":
        return settings.teamMembers.filter((m) => m.role !== "SUPER_ADMIN");

      case "MANAGER":
        return settings.teamMembers.filter(
          (m) => m.role !== "ADMIN" && m.role !== "SUPER_ADMIN",
        );

      default:
        return [];
    }
  }, [settings.teamMembers, currentUser.role]);

  // --- EXPORT PDF ---
  const handleExportPDF = async () => {
    const element = document.getElementById("report-dashboard");
    if (!element) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#f8fafc",
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      pdf.save(
        `InfoFix_Work_Report_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };
  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2
            className="animate-spin mx-auto mb-4 text-indigo-600"
            size={40}
          />
          <p className="text-slate-600">Loading reports...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6 pb-20">
      {/* HEADER & FILTERS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sticky top-0 z-20 backdrop-blur-xl bg-white/90">
        <div className="flex flex-col xl:flex-row xl:items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
              <ClipboardList size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Work Status Reports
              </h2>
              <p className="text-xs text-slate-500">
                Service operations & turnaround metrics
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Time Filter */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {(["7d", "30d", "90d", "all"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeFilter(period)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all uppercase ${
                    timeFilter === period
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {period === "all" ? "All Time" : period}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              {/* Store Filter */}
              <div className="relative shrink-0">
                <MapPin
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                  className="pl-8 pr-8 py-2 bg-slate-100 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none cursor-pointer min-w-[120px]"
                >
                  <option value="All">All Stores</option>
                  {settings.stores.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Filter */}
              <div className="relative shrink-0">
                <Shield
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setMemberFilter("All");
                  }}
                  className="pl-8 pr-8 py-2 bg-slate-100 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none cursor-pointer min-w-[120px]"
                >
                  <option value="All">All Roles</option>
                  <option value="TECHNICIAN">Technician</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {/* Member Filter */}
              <div className="relative shrink-0">
                <UserIcon
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={memberFilter}
                  onChange={(e) => setMemberFilter(e.target.value)}
                  className="pl-8 pr-8 py-2 bg-slate-100 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none cursor-pointer min-w-[120px]"
                >
                  <option value="All">All Staff</option>
                  {accessibleStaff
                    .filter(
                      (m) => roleFilter === "All" || m.role === roleFilter,
                    )
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Export */}
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 disabled:opacity-70 ml-auto xl:ml-0"
            >
              {isExporting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              Export Summary
            </button>
          </div>
        </div>
      </div>

      {/* PRINTABLE DASHBOARD AREA */}
      <div id="report-dashboard" className="space-y-6">
        {/* 1. OPERATIONAL KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Total Intake */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <FileText size={64} className="text-indigo-600" />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              Total Intake
            </p>
            <h3 className="text-3xl font-black text-slate-800">
              {analytics.totalTickets}{" "}
              <span className="text-lg text-slate-400 font-medium">
                Tickets
              </span>
            </h3>
            <div className="flex items-center gap-2 mt-4">
              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-indigo-100 uppercase tracking-tight">
                Received in Period
              </span>
            </div>
          </div>

          {/* Turnaround Time */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Clock size={64} className="text-amber-500" />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              Avg. Turnaround
            </p>
            <h3 className="text-3xl font-black text-slate-800">
              {analytics.avgTat}{" "}
              <span className="text-lg text-slate-400 font-medium">Days</span>
            </h3>
            <div className="flex items-center gap-2 mt-4">
              <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-amber-100 flex items-center gap-1 uppercase tracking-tight">
                <Target size={10} /> Target: 2.0 Days
              </span>
            </div>
          </div>

          {/* Resolution Rate */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <CheckCircle size={64} className="text-emerald-500" />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              Resolution Rate
            </p>
            <h3 className="text-3xl font-black text-slate-800">
              {analytics.resolutionRate}%
            </h3>
            <div className="flex items-center gap-2 mt-4">
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-100 uppercase tracking-tight">
                {analytics.resolvedTickets} Resolved
              </span>
            </div>
          </div>

          {/* Active Load */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Activity size={64} className="text-blue-500" />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              Active Workload
            </p>
            <h3 className="text-3xl font-black text-slate-800">
              {analytics.openTickets}{" "}
              <span className="text-lg text-slate-400 font-medium">Open</span>
            </h3>
            <div className="flex items-center gap-2 mt-4">
              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-blue-100 uppercase tracking-tight">
                Work in Progress
              </span>
            </div>
          </div>
        </div>

        {/* 2. WORK TREND CHARTS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* INTAKE VOLUME TREND */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">
                  Ticket Volume Trend
                </h3>
                <p className="text-xs text-slate-500">
                  Service intake counts over the selected period
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium">
                <span className="flex items-center gap-1 text-indigo-600">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div> New
                  Jobs
                </span>
              </div>
            </div>

            {analytics.trendData && analytics.trendData.length > 0 ? (
              <div className="relative w-full h-[300px]">
                <div className="absolute inset-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={analytics.trendData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorTickets"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={COLORS.primary}
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor={COLORS.primary}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: COLORS.slate }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: COLORS.slate }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        }}
                        cursor={{ fill: "#f1f5f9" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="tickets"
                        stroke={COLORS.primary}
                        strokeWidth={4}
                        fill="url(#colorTickets)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">
                No data available for the selected period
              </div>
            )}
          </div>

          {/* STATUS DISTRIBUTION */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="font-bold text-slate-800 text-lg mb-2">
              Service Status
            </h3>
            {analytics.statusData && analytics.statusData.length > 0 ? (
              <>
                <div className="relative w-full h-[250px]">
                  <div className="absolute inset-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {analytics.statusData.map((entry, index) => {
                            const statusKey = entry.name.toLowerCase();
                            const STATUS_COLORS: Record<string, string> = {
                              new: "#3B82F6",
                              delivery: "#F59E0B",
                              hold: "#F97316",
                              "in progress": "#6366F1",
                              "pending approval": "#FACC15",
                              rejected: "#EF4444",
                              resolved: "#10B981",
                              "service done": "#EC4899",
                            };
                            const fillColor =
                              STATUS_COLORS[statusKey] || "#64748b";
                            return (
                              <Cell key={`cell-${index}`} fill={fillColor} />
                            );
                          })}
                        </Pie>
                        <Tooltip />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: "11px" }}
                          formatter={(value: string) => {
                            return value
                              .split(" ")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1),
                              )
                              .join(" ");
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                    <span className="text-3xl font-black text-slate-800">
                      {analytics.totalTickets}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Reports
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-slate-400 text-sm">
                No status data available
              </div>
            )}
          </div>
        </div>

        {/* 3. PERFORMANCE BREAKDOWNS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* TECHNICIAN VOLUME RANKING */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
              <Users size={20} className="text-indigo-600" /> Staff Performance
              (Volume)
            </h3>
            <div className="space-y-4">
              {analytics.techPerformance.map((tech, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100"
                >
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm ${
                      idx === 0
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-slate-700 text-sm">
                        {tech.name}
                      </span>
                      <span className="text-xs font-bold text-indigo-600">
                        {tech.resolved} Resolved
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full"
                        style={{
                          width: `${
                            (tech.count / (analytics.totalTickets || 1)) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                      <span>{tech.count} Total Tickets</span>
                      <span>
                        {Math.round((tech.resolved / tech.count) * 100)}%
                        Success
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {analytics.techPerformance.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No technician activity recorded.
                </div>
              )}
            </div>
          </div>

          {/* DEVICE INTAKE BREAKDOWN */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
              <Layers size={20} className="text-indigo-600" /> Device Breakdown
            </h3>

            {analytics.deviceData && analytics.deviceData.length > 0 ? (
              <div className="relative w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.deviceData}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      tick={{
                        fontSize: 11,
                        fontWeight: 600,
                        fill: COLORS.slate,
                      }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "#f8fafc" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                      {analytics.deviceData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">
                No device data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
