import React, { useState, useMemo } from "react";
import {
  Trophy,
  Crown,
  Target,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  Users,
  Zap,
  Laptop,
  Award,
  MinusCircle,
  PlusCircle,
  Save,
  Plus,
  Sparkles,
  Search,
  X,
  UserCheck,
  UserX,
  CalendarDays,
  History,
  Activity,
  Medal,
  TrendingUp as TrendingIcon,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Fingerprint,
  Verified,
  Activity as ActivityIcon,
  ListChecks,
  MousePointer2,
  Flame,
  Globe,
  Edit,
  Delete,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  User,
  Task,
  Report,
  OfficialPerformanceRecord,
  AppSettings,
} from "../types";
import { supabase } from "@/supabaseClient";

interface StaffRatingsViewProps {
  currentUser: User;
  teamMembers: User[];
  tasks: Task[];
  savedReports: Report[];
  settings: AppSettings;
  onUpdateSettings?: (settings: AppSettings) => void;
}

export default function StaffRatingsView({
  currentUser,
  teamMembers,
  tasks,
  savedReports,
  settings,
  onUpdateSettings,
}: StaffRatingsViewProps) {
  // --- STATE ---
  const initialTechId = useMemo(() => {
    if (currentUser.role === "TECHNICIAN") return currentUser.id;
    const firstStaff = teamMembers.find((m) => m.role !== "SUPER_ADMIN");
    return firstStaff?.id || "";
  }, [currentUser, teamMembers]);

  const [selectedTechId, setSelectedTechId] = useState<string>(initialTechId);
  const [viewType, setViewType] = useState<"day" | "month" | "year">("month");
  const [navDate, setNavDate] = useState(new Date());
  const [attributionSearch, setAttributionSearch] = useState("");

  const [showGoalConfig, setShowGoalConfig] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);

  const [attendanceForm, setAttendanceForm] = useState({
    techId: initialTechId,
    date: new Date().toISOString().split("T")[0],
    status: "full" as "full" | "half" | "absent",
  });

  const [adminBonusInput, setAdminBonusInput] = useState(1);
  const [adminBonusReasonInput, setAdminBonusReasonInput] = useState("");
  const [dutyRecords, setDutyRecords] = useState<OfficialPerformanceRecord[]>(
    [],
  );
  const [localReports, setLocalReports] = useState<Report[]>([]);
  // ---- NEW: Editing State ----
  const [editingRecord, setEditingRecord] =
    useState<OfficialPerformanceRecord | null>(null);
  const [editingType, setEditingType] = useState<"attendance" | "merit" | null>(
    null,
  );

  const isAdmin =
    currentUser.role === "SUPER_ADMIN" ||
    currentUser.role === "ADMIN" ||
    currentUser.role === "MANAGER";
  const selectedTech = teamMembers.find((m) => m.id === selectedTechId);

  React.useEffect(() => {
    const fetchLaptopReports = async () => {
      const { data, error } = await supabase.from("laptop_reports").select("*");

      if (!error && data) {
        const normalized = (data as any[]).map((r) => {
          let deviceInfo = r.device_info;

          if (typeof deviceInfo === "string") {
            try {
              deviceInfo = JSON.parse(deviceInfo);
            } catch {
              deviceInfo = {};
            }
          }

          return {
            ...r,
            deviceInfo,
          };
        });

        setLocalReports(normalized as Report[]);
      }
    };

    const fetchDutyRegistry = async () => {
      const { data, error } = await supabase.from("duty_registry").select("*");

      if (!error && data) {
        setDutyRecords(data as OfficialPerformanceRecord[]);
      }
    };

    fetchLaptopReports();
    fetchDutyRegistry();
  }, []);

  // --- DATE NAVIGATION ---
  const navigate = (direction: number) => {
    const newDate = new Date(navDate);
    if (viewType === "day") newDate.setDate(newDate.getDate() + direction);
    if (viewType === "month") newDate.setMonth(newDate.getMonth() + direction);
    if (viewType === "year")
      newDate.setFullYear(newDate.getFullYear() + direction);
    setNavDate(newDate);
  };

  const dateLabel = useMemo(() => {
    if (viewType === "day")
      return navDate.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    if (viewType === "month")
      return navDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    return navDate.getFullYear().toString();
  }, [navDate, viewType]);

  // --- CALCULATION ENGINE ---
  const attributionData = useMemo(() => {
    const tech = teamMembers.find((m) => m.id === selectedTechId);
    if (!tech)
      return {
        fixedUnitsList: [],
        deadlineTasksList: [],
        attendanceList: [],
        bonusRecords: [],
      };

    const filterFn = (itemDate: string | number) => {
      const d = new Date(itemDate);
      if (viewType === "day")
        return d.toDateString() === navDate.toDateString();
      if (viewType === "month")
        return (
          d.getMonth() === navDate.getMonth() &&
          d.getFullYear() === navDate.getFullYear()
        );
      return d.getFullYear() === navDate.getFullYear();
    };
    const attendanceList = dutyRecords.filter((r) => {
      const rDate = new Date(r.year, r.month, r.day || 1);
      return (
        r.techId === selectedTechId &&
        r.type === "attendance" &&
        filterFn(rDate.getTime()) &&
        typeof r.attendanceDays === "number"
      );
    });

    const bonusRecords = dutyRecords.filter((r) => {
      const rDate = new Date(r.year, r.month, r.day || 1);
      return (
        r.techId === selectedTechId &&
        r.type === "merit" &&
        filterFn(rDate.getTime()) &&
        typeof r.adminBonus === "number"
      );
    });

    const fixedUnitsList = (
      localReports.length ? localReports : savedReports || []
    ).filter((r) => {
      const techName = tech.name.trim().toLowerCase();

      const reportTechName = (r.deviceInfo?.technicianName || "")
        .trim()
        .toLowerCase();

      const isMyReport = reportTechName === techName;

      const reportDate = r.date
        ? new Date(r.date)
        : r.created_at
          ? new Date(r.created_at)
          : null;

      const passesDate = reportDate ? filterFn(reportDate.getTime()) : true;

      return isMyReport && passesDate && r.progress >= 50;
    });

    const deadlineTasksList = (tasks || []).filter(
      (t) =>
        t.assignedToId === selectedTechId &&
        t.status === "completed" &&
        filterFn(t.date),
    );

    return { fixedUnitsList, deadlineTasksList, attendanceList, bonusRecords };
  }, [
    selectedTechId,
    navDate,
    viewType,
    tasks,
    savedReports,
    teamMembers,
    dutyRecords,
    localReports,
  ]);

  const performance = useMemo(() => {
    const attendancePoints = attributionData.attendanceList.reduce(
      (acc, r) => acc + (r.attendanceDays || 0),
      0,
    );
    const bonusPoints = attributionData.bonusRecords.reduce(
      (acc, r) => acc + (r.adminBonus || 0),
      0,
    );
    const qcPoints = attributionData.fixedUnitsList.length;
    const taskPoints = attributionData.deadlineTasksList.length;

    const totalScore = attendancePoints + qcPoints + taskPoints + bonusPoints;

    return {
      attendancePoints,
      qcPoints,
      taskPoints,
      bonusPoints,
      score: Math.round(totalScore * 10) / 10,
    };
  }, [attributionData]);

  const getTier = (score: number) => {
    if (score >= 70)
      return {
        name: "Diamond",
        color: "from-cyan-400 to-blue-600",
        icon: Crown,
        text: "text-cyan-600",
        bg: "bg-cyan-50",
        border: "border-cyan-200",
        shadow: "shadow-cyan-100",
      };
    if (score >= 60)
      return {
        name: "Achiever",
        color: "from-purple-500 to-indigo-600",
        icon: Trophy,
        text: "text-purple-600",
        bg: "bg-purple-50",
        border: "border-purple-200",
        shadow: "shadow-purple-100",
      };
    if (score >= 50)
      return {
        name: "Expert",
        color: "from-emerald-400 to-teal-600",
        icon: Target,
        text: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        shadow: "shadow-emerald-100",
      };
    if (score >= 40)
      return {
        name: "Core",
        color: "from-blue-500 to-indigo-500",
        icon: CheckCircle2,
        text: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
        shadow: "shadow-blue-100",
      };
    if (score >= 30)
      return {
        name: "Moderate",
        color: "from-amber-400 to-orange-500",
        icon: Activity,
        text: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        shadow: "shadow-amber-100",
      };
    if (score >= 20)
      return {
        name: "Developing",
        color: "from-orange-500 to-red-500",
        icon: Zap,
        text: "text-orange-600",
        bg: "bg-orange-50",
        border: "border-orange-200",
        shadow: "shadow-orange-100",
      };
    return {
      name: "Entry",
      color: "from-slate-600 to-slate-800",
      icon: MousePointer2,
      text: "text-slate-600",
      bg: "bg-slate-100",
      border: "border-slate-200",
      shadow: "shadow-slate-100",
    };
  };

  const tier = getTier(performance.score);

  // --- HANDLERS ---
  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();

    const [year, monthStr, day] = attendanceForm.date.split("-").map(Number);
    const month = monthStr - 1;
    const attVal =
      attendanceForm.status === "full"
        ? 1.0
        : attendanceForm.status === "half"
          ? 0.5
          : 0;

    const isEdit = editingType === "attendance" && editingRecord;

    const record: OfficialPerformanceRecord = {
      id: isEdit ? editingRecord.id : `att-${Date.now()}`,
      techId: attendanceForm.techId,
      day,
      month,
      year,
      attendanceDays: attVal,
      adminBonus: 0,
      type: "attendance", // <-- mark type
    };

    const { error } = isEdit
      ? await supabase.from("duty_registry").update(record).eq("id", record.id)
      : await supabase.from("duty_registry").insert(record);
    if (!error) {
      setDutyRecords((prev) =>
        isEdit
          ? prev.map((r) => (r.id === record.id ? record : r))
          : [record, ...prev],
      );
      setShowAttendanceModal(false);
      setEditingRecord(null);
      setEditingType(null);
    }
  };

  const handleSaveMerit = async () => {
    if (!adminBonusReasonInput.trim()) return;

    const isEdit = editingType === "merit" && editingRecord;

    const record: OfficialPerformanceRecord = {
      id: isEdit ? editingRecord.id : `merit-${Date.now()}`,
      techId: selectedTechId,
      day: navDate.getDate(),
      month: navDate.getMonth(),
      year: navDate.getFullYear(),
      adminBonus: adminBonusInput,
      adminBonusReason: adminBonusReasonInput.trim(),
      attendanceDays: 0,
      type: "merit",
    };

    const { error } = isEdit
      ? await supabase.from("duty_registry").update(record).eq("id", record.id)
      : await supabase.from("duty_registry").insert(record);

    if (!error) {
      setDutyRecords((prev) =>
        isEdit
          ? prev.map((r) => (r.id === record.id ? record : r))
          : [record, ...prev],
      );
      setShowGoalConfig(false);
      setAdminBonusInput(1);
      setAdminBonusReasonInput("");
      setEditingRecord(null);
      setEditingType(null);
    }
  };

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return (
    <div className="flex flex-col gap-5 pb-16 animate-in fade-in duration-500 max-w-[1440px] mx-auto">
      {/* 1. MAIN CONTENT AREA */}
      <div className="flex-1 space-y-5 min-w-0">
        {/* COMPACT TOOLBAR */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm sticky top-0 z-40 transition-all">
          <div className="flex items-center gap-2.5 w-full md:w-auto px-1">
            <div className="bg-indigo-600 w-9 h-9 rounded-xl text-white shadow-md flex items-center justify-center shrink-0">
              <Award size={18} />
            </div>
            <div className="relative flex-1 md:min-w-[220px]">
              <Users
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={selectedTechId}
                disabled={currentUser.role === "TECHNICIAN"}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-800 focus:ring-4 ring-indigo-500/5 focus:bg-white outline-none appearance-none transition-all cursor-pointer"
              >
                {teamMembers
                  .filter((m) => m.role !== "SUPER_ADMIN")
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            {(["day", "month", "year"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setViewType(type)}
                className={`px-5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                  viewType === type
                    ? "bg-white text-indigo-600 shadow-sm scale-105"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 transition-all active:scale-90"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-md">
              <CalendarIcon size={14} className="text-indigo-400" />
              <span className="text-[10px] font-black text-indigo-50 uppercase tracking-widest min-w-[90px] text-center">
                {dateLabel}
              </span>
            </div>
            <button
              onClick={() => navigate(1)}
              className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 transition-all active:scale-90"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* HERO RANKING SECTION - REFINED SCALE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Tier Main Feature */}
          <div
            className={`lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 relative overflow-hidden group shadow-sm transition-all duration-500`}
          >
            <div className="absolute -right-8 -top-8 p-6 opacity-[0.03] group-hover:scale-110 group-hover:rotate-6 transition-transform duration-1000 pointer-events-none text-slate-900">
              <tier.icon size={220} />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                <div className="relative shrink-0">
                  <div
                    className={`w-24 h-24 lg:w-28 lg:h-28 rounded-3xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-white shadow-xl animate-in zoom-in duration-700 relative z-10`}
                  >
                    <tier.icon size={44} strokeWidth={2.5} />
                  </div>
                  <div className="absolute inset-0 rounded-3xl border-2 border-indigo-500/10 scale-110 animate-pulse"></div>
                </div>

                <div className="pt-1">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 text-[9px] font-black uppercase tracking-widest ${tier.bg} ${tier.text} border ${tier.border} shadow-sm`}
                  >
                    <Sparkles size={10} className="animate-pulse" /> {tier.name}{" "}
                    Rank
                  </div>
                  <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-3">
                    {selectedTech?.name}
                  </h1>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    <div className="bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                      <Verified size={12} className="text-indigo-500" />
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-wider">
                        Expert Status
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                      <ShieldCheck size={12} className="text-emerald-500" />
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-wider">
                        Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center md:items-end shrink-0 md:bg-slate-50/50 md:p-5 md:rounded-2xl md:border md:border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Total Score
                </p>
                <div className="text-6xl lg:text-7xl font-black text-slate-900 tabular-nums leading-none tracking-tighter">
                  {performance.score}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-emerald-500 font-black text-[8px] uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <TrendingIcon size={10} /> +8% Momentum
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
                  Operations Control Console
                </p>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setAttendanceForm({
                        ...attendanceForm,
                        techId: selectedTechId,
                      });
                      setShowAttendanceModal(true);
                    }}
                    className="flex-1 sm:flex-none px-5 py-2 bg-slate-900 text-white font-black rounded-lg text-[9px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CalendarDays size={14} className="text-indigo-400" /> Duty
                    Registry
                  </button>
                  <button
                    onClick={() => {
                      setAdminBonusInput(1);
                      setAdminBonusReasonInput("");
                      setEditingRecord(null);
                      setEditingType(null);
                      setShowGoalConfig(true);
                    }}
                    className="flex-1 sm:flex-none px-5 py-2 bg-indigo-600 text-white font-black rounded-lg text-[9px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <Zap size={14} className="text-amber-300" /> Merit Award
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* KPI Widgets - Shrunken */}
          <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-4">
            {[
              {
                label: "Work Log",
                val: performance.attendancePoints.toFixed(1),
                sub: "Days Sync",
                icon: UserCheck,
                color: "text-indigo-600",
                bg: "bg-indigo-50",
              },
              {
                label: "QC Passed",
                val: performance.qcPoints,
                sub: "Units Verified",
                icon: Laptop,
                color: "text-cyan-600",
                bg: "bg-cyan-50",
              },
              {
                label: "Task Master",
                val: performance.taskPoints,
                sub: "Efficiency",
                icon: ListChecks,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
              },
              {
                label: "Merit Pts",
                val:
                  performance.bonusPoints >= 0
                    ? `+${performance.bonusPoints}`
                    : `${performance.bonusPoints}`,
                sub: "Direct Credit",
                icon: Medal,
                color:
                  performance.bonusPoints >= 0
                    ? "text-amber-600"
                    : "text-rose-600",
                bg: performance.bonusPoints >= 0 ? "bg-amber-50" : "bg-rose-50",
              },
            ].map((kpi, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-2xl p-4 group hover:border-indigo-400 transition-all duration-300 shadow-sm flex flex-col justify-between overflow-hidden relative"
              >
                <div
                  className={`absolute top-0 right-0 p-3 opacity-[0.02] group-hover:scale-125 transition-transform duration-700 ${kpi.color}`}
                >
                  <kpi.icon size={52} />
                </div>
                <div
                  className={`w-9 h-9 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center mb-3 relative z-10 shadow-sm`}
                >
                  <kpi.icon size={18} />
                </div>
                <div className="relative z-10">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                    {kpi.label}
                  </p>
                  <h3 className="text-xl font-black text-slate-800 tabular-nums">
                    {kpi.val}
                  </h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                      {kpi.sub}
                    </p>
                    <ArrowUpRight
                      size={12}
                      className={`${kpi.color} opacity-0 group-hover:opacity-100 transition-opacity`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ATTRIBUTION PIPELINE - Shrunken */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-[0.015] pointer-events-none text-slate-900">
            <Fingerprint size={180} />
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-6 relative z-10">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
                <Activity size={20} className="text-indigo-600" />
                Performance Audit
              </h3>
              <p className="text-slate-500 font-medium text-[10px] mt-0.5 uppercase tracking-wider">
                Verification of point contributions.
              </p>
            </div>
            <div className="relative group lg:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={attributionSearch}
                onChange={(e) => setAttributionSearch(e.target.value)}
                placeholder="Search logs..."
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-4 ring-indigo-500/5 focus:border-indigo-500 transition-all w-full shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-8 relative z-10">
            {/* Attendance Section */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md">
                    <CalendarDays size={14} />
                  </div>
                  <h4 className="text-[9px] font-black uppercase text-slate-800 tracking-widest">
                    Duty Log
                  </h4>
                </div>
                <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                  {attributionData.attendanceList.length} Entries
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {attributionData.attendanceList
                  .sort(
                    (a, b) =>
                      b.year * 10000 +
                      b.month * 100 +
                      (b.day || 0) -
                      (a.year * 10000 + a.month * 100 + (a.day || 0)),
                  )
                  .map((r) => (
                    <div
                      key={r.id}
                      className="p-4 bg-white rounded-xl border border-slate-100 flex flex-col gap-4 hover:border-indigo-500 hover:shadow-md transition-all group relative overflow-hidden shadow-sm"
                    >
                      <div className="flex justify-between items-center relative z-10">
                        <span className="text-[9px] font-black text-slate-400 group-hover:text-indigo-600 uppercase tracking-widest">
                          {r.day} {months[r.month].slice(0, 3)}
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="p-1 text-indigo-600 hover:text-indigo-900"
                            onClick={() => {
                              setEditingRecord(r);
                              setEditingType("attendance");
                              setAttendanceForm({
                                techId: r.techId,
                                date: `${r.year}-${(r.month + 1)
                                  .toString()
                                  .padStart(2, "0")}-${(r.day || 1)
                                  .toString()
                                  .padStart(2, "0")}`,
                                status:
                                  r.attendanceDays === 1
                                    ? "full"
                                    : r.attendanceDays === 0.5
                                      ? "half"
                                      : "absent",
                              });
                              setShowAttendanceModal(true);
                            }}
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-rose-600 hover:text-rose-900"
                            onClick={async () => {
                              const { error } = await supabase
                                .from("duty_registry")
                                .delete()
                                .eq("id", r.id)
                                .eq("type", "attendance");
                              if (!error) {
                                setDutyRecords((prev) =>
                                  prev.filter((rec) => rec.id !== r.id),
                                );
                              }
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Existing Attendance info */}
                      <div className="flex items-end justify-between relative z-10">
                        <div className="space-y-0.5">
                          <p className="text-[8px] font-black uppercase text-slate-900 leading-none">
                            {r.attendanceDays === 1
                              ? "Full"
                              : r.attendanceDays === 0.5
                                ? "Half"
                                : "Off"}
                          </p>
                          <p className="text-[7px] font-bold text-slate-400 uppercase italic">
                            Verified
                          </p>
                        </div>
                        <span className="text-lg font-black tabular-nums text-indigo-600 tracking-tight">
                          +{r.attendanceDays?.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                {attributionData.attendanceList.length === 0 && (
                  <div className="col-span-full py-8 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                    <CalendarIcon size={32} className="mb-2 opacity-10" />
                    <p className="font-black text-[9px] uppercase tracking-widest opacity-30 text-center">
                      No logs found
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* QC Section */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-cyan-600 rounded-lg text-white shadow-md">
                    <Laptop size={14} />
                  </div>
                  <h4 className="text-[9px] font-black uppercase text-slate-800 tracking-widest">
                    QC Verified
                  </h4>
                </div>
                <span className="text-[9px] font-black text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full uppercase tracking-widest border border-cyan-100">
                  {attributionData.fixedUnitsList.length} Passed
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {attributionData.fixedUnitsList
                  .filter((r) =>
                    (r.deviceInfo?.laptopNo || "")
                      .toLowerCase()
                      .includes(attributionSearch.toLowerCase()),
                  )
                  .map((r) => (
                    <div
                      key={r.id}
                      className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between hover:border-cyan-500 shadow-sm transition-all group relative overflow-hidden"
                    >
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-emerald-500 shadow-inner group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                          <Verified size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-black text-slate-900 tracking-tight leading-none">
                              {r.deviceInfo?.laptopNo}
                            </p>
                            <span className="text-[7px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-black uppercase border border-indigo-100">
                              PASS
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                            <ActivityIcon
                              size={10}
                              className="text-emerald-500"
                            />
                            {r.progress}% Quality
                          </div>
                        </div>
                      </div>
                      <div className="text-right relative z-10 flex flex-col items-end">
                        <div className="text-xl font-black text-cyan-600 tabular-nums tracking-tight">
                          +1.0
                        </div>
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                          Credit
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            {/* Merit Section */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500 rounded-lg text-white shadow-md">
                    <Sparkles size={14} />
                  </div>
                  <h4 className="text-[9px] font-black uppercase text-slate-800 tracking-widest">
                    Merit Registry
                  </h4>
                </div>
              </div>

              <div className="space-y-4 relative">
                <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-100 rounded-full"></div>

                {attributionData.bonusRecords
                  .sort(
                    (a, b) =>
                      b.year * 10000 +
                      b.month * 100 +
                      (b.day || 0) -
                      (a.year * 10000 + a.month * 100 + (a.day || 0)),
                  )
                  .map((b) => (
                    <div key={b.id} className="relative pl-16 group">
                      <div className="absolute left-0 top-0 w-14 h-14 bg-white rounded-xl border-2 border-slate-50 shadow-md flex flex-col items-center justify-center z-10 transition-transform group-hover:scale-105 duration-500">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                          {months[b.month].slice(0, 3)}
                        </span>
                        <span className="text-xl font-black text-slate-900 tracking-tighter leading-none">
                          {b.day}
                        </span>
                      </div>

                      <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-500 flex flex-col sm:flex-row gap-6 justify-between items-start relative overflow-hidden border-l-4 border-l-amber-400">
                        <div className="space-y-3 flex-1 relative z-10">
                          <div className="flex items-center gap-2">
                            <div
                              className={`px-3 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest shadow-sm ${
                                (b.adminBonus || 0) < 0
                                  ? "bg-rose-50 text-rose-600 border-rose-100"
                                  : "bg-amber-50 text-amber-600 border-amber-100"
                              }`}
                            >
                              {(b.adminBonus || 0) < 0 ? "Deducted" : "Awarded"}
                            </div>
                            <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest italic flex items-center gap-1.5">
                              <Zap size={10} /> Performance Bonus
                            </p>
                          </div>
                          <p className="text-lg font-bold text-slate-800 leading-snug tracking-tight italic">
                            "{b.adminBonusReason}"
                          </p>
                        </div>

                        <div className="shrink-0 text-center bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 min-w-[120px] shadow-inner relative z-10 flex flex-col items-center justify-center">
                          <span
                            className={`text-4xl font-black tabular-nums tracking-tighter leading-none ${
                              (b.adminBonus || 0) < 0
                                ? "text-rose-600"
                                : "text-indigo-600"
                            }`}
                          >
                            {(b.adminBonus || 0) > 0 ? "+" : ""}
                            {b.adminBonus}
                          </span>
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-3">
                            Multiplier
                          </p>
                          <div className="flex gap-2 mt-4">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRecord(b);
                                setEditingType("merit");
                                setAdminBonusInput(b.adminBonus || 1);
                                setAdminBonusReasonInput(
                                  b.adminBonusReason || "",
                                );
                                setShowGoalConfig(true);
                              }}
                              className="px-2 py-1 text-[8px] font-black uppercase text-indigo-600 hover:text-indigo-900 border border-indigo-100 rounded"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              type="button"
                              className="px-2 py-1 text-[8px] font-black uppercase text-rose-600 hover:text-rose-900 border border-rose-100 rounded"
                              onClick={async () => {
                                const { error } = await supabase
                                  .from("duty_registry")
                                  .delete()
                                  .eq("id", b.id)
                                  .eq("type", "merit");

                                if (!error) {
                                  setDutyRecords((prev) =>
                                    prev.filter((rec) => rec.id !== b.id),
                                  );
                                }
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* MODALS - Shrunken */}
      {showAttendanceModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#020617]/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-500 overflow-hidden flex flex-col max-h-[90vh] border border-white/10">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 relative overflow-hidden">
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl shadow-lg flex items-center justify-center">
                  <CalendarDays size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-xl uppercase tracking-tighter leading-none mb-1.5">
                    Work Registry
                  </h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Attendance Validation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="w-10 h-10 hover:bg-white rounded-full text-slate-300 hover:text-rose-500 transition-all flex items-center justify-center active:scale-90"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} className="p-8 space-y-8">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-3">
                    Staff Member
                  </label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                      <Users size={18} />
                    </div>
                    <select
                      value={attendanceForm.techId}
                      onChange={(e) =>
                        setAttendanceForm({
                          ...attendanceForm,
                          techId: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none appearance-none cursor-pointer focus:ring-4 ring-indigo-500/5 transition-all"
                    >
                      {teamMembers
                        .filter((m) => m.role !== "SUPER_ADMIN")
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.role})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-3">
                    Operational Date
                  </label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                      <CalendarIcon size={18} />
                    </div>
                    <input
                      type="date"
                      value={attendanceForm.date}
                      onChange={(e) =>
                        setAttendanceForm({
                          ...attendanceForm,
                          date: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    id: "full",
                    label: "Full",
                    val: "+1.0",
                    icon: UserCheck,
                    color: "text-indigo-600 bg-indigo-50",
                    active:
                      "bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-500/10",
                  },
                  {
                    id: "half",
                    label: "Half",
                    val: "+0.5",
                    icon: Clock,
                    color: "text-amber-600 bg-amber-50",
                    active:
                      "bg-amber-600 text-white shadow-lg ring-4 ring-amber-500/10",
                  },
                  {
                    id: "absent",
                    label: "Off",
                    val: "0.0",
                    icon: UserX,
                    color: "text-rose-600 bg-rose-50",
                    active:
                      "bg-rose-600 text-white shadow-lg ring-4 ring-rose-500/10",
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setAttendanceForm({
                        ...attendanceForm,
                        status: item.id as any,
                      })
                    }
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-500 ${
                      attendanceForm.status === item.id
                        ? item.active + " border-transparent scale-105"
                        : item.color +
                          " border-transparent opacity-40 hover:opacity-100 scale-100"
                    }`}
                  >
                    <item.icon size={28} className="mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none text-center mb-1">
                      {item.label}
                    </span>
                    <span
                      className={`text-[8px] font-black opacity-60 uppercase tracking-widest ${
                        attendanceForm.status === item.id ? "text-white" : ""
                      }`}
                    >
                      {item.val} yield
                    </span>
                  </button>
                ))}
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAttendanceModal(false)}
                  className="flex-1 py-4 bg-slate-50 text-slate-500 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-[#020617] text-white font-black rounded-xl shadow-lg text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Save size={16} className="text-indigo-400" /> Commit Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGoalConfig && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#020617]/85 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-500 overflow-hidden border border-white/20">
            <div className="p-10 border-b border-slate-100 bg-slate-50/50 text-center relative overflow-hidden">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner group border transition-all ${
                  adminBonusInput < 0
                    ? "bg-rose-50 text-rose-500 border-rose-100"
                    : "bg-amber-50 text-amber-500 border-amber-100"
                }`}
              >
                {adminBonusInput < 0 ? (
                  <AlertTriangle
                    size={32}
                    className="animate-pulse group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <Sparkles
                    size={32}
                    className="animate-pulse group-hover:scale-110 transition-transform duration-700"
                  />
                )}
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">
                {adminBonusInput < 0 ? "Point Deduction" : "Merit Recognition"}
              </h3>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                {adminBonusInput < 0
                  ? "Performance Penalty"
                  : "Technical Contribution Credit"}
              </p>
            </div>
            <div className="p-10 space-y-8">
              <div className="flex items-center justify-center gap-10 bg-slate-100/50 p-8 rounded-[2rem] border border-slate-200/80 shadow-inner relative overflow-hidden group/multiplier">
                <button
                  onClick={() => setAdminBonusInput((prev) => prev - 1)}
                  className="w-12 h-12 bg-white rounded-xl hover:bg-indigo-50 text-slate-300 hover:text-indigo-600 shadow-md active:scale-90 transition-all border border-slate-100 relative z-10 flex items-center justify-center"
                >
                  <MinusCircle size={24} />
                </button>
                <div className="text-center relative z-10 min-w-[100px]">
                  <input
                    type="number"
                    value={adminBonusInput}
                    onChange={(e) =>
                      setAdminBonusInput(parseInt(e.target.value) || 0)
                    }
                    className={`w-full text-center font-black text-7xl lg:text-8xl bg-transparent outline-none tabular-nums tracking-tighter focus:ring-0 ${
                      adminBonusInput < 0 ? "text-rose-600" : "text-indigo-600"
                    }`}
                  />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">
                    {adminBonusInput < 0 ? "Deduction" : "Multiplier"}
                  </p>
                </div>
                <button
                  onClick={() => setAdminBonusInput((prev) => prev + 1)}
                  className="w-12 h-12 bg-white rounded-xl hover:bg-indigo-50 text-slate-300 hover:text-indigo-600 shadow-md active:scale-90 transition-all border border-slate-100 relative z-10 flex items-center justify-center"
                >
                  <PlusCircle size={24} />
                </button>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3">
                  Justification *
                </label>
                <div className="relative group">
                  <textarea
                    value={adminBonusReasonInput}
                    onChange={(e) => setAdminBonusReasonInput(e.target.value)}
                    placeholder="Explain the achievement..."
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 ring-indigo-500/5 focus:bg-white focus:border-indigo-500 outline-none resize-none h-32 transition-all duration-500 leading-relaxed italic shadow-inner placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowGoalConfig(false)}
                  className="flex-1 py-4 bg-slate-50 text-slate-500 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-100 active:scale-95 border border-slate-200 shadow-sm"
                >
                  Discard
                </button>
                <button
                  onClick={handleSaveMerit}
                  disabled={!adminBonusReasonInput.trim()}
                  className={`flex-[2] py-4 text-white font-black rounded-xl shadow-xl transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-50 border border-white/20 ${
                    adminBonusInput < 0
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {adminBonusInput < 0 ? (
                    <>
                      <AlertTriangle size={20} className="text-rose-200" />{" "}
                      Apply Deduction
                    </>
                  ) : (
                    <>
                      <Zap size={20} className="text-amber-300" /> Authorize
                      Asset
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
