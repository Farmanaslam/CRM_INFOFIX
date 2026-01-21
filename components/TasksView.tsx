import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Trash2,
  TrendingUp,
  Target,
  Calendar as CalendarIcon,
  Flame,
  Check,
  Plus,
  Filter,
  User as UserIcon,
  Search,
  ChevronDown,
  StickyNote,
} from "lucide-react";
import { Task, Report, User } from "../types";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface TasksViewProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  savedReports: Report[];
  currentUser: User;
  teamMembers: User[];
}

export default function TasksView({
  tasks,
  setTasks,
  savedReports,
  currentUser,
  teamMembers,
}: TasksViewProps) {
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "urgent" | "completed"
  >("all");
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [chartView, setChartView] = useState<"monthly" | "yearly">("monthly");
  const [quickTaskTitle, setQuickTaskTitle] = useState("");

  const isAdmin =
    currentUser.role === "SUPER_ADMIN" ||
    currentUser.role === "ADMIN" ||
    currentUser.role === "MANAGER";

  // --- DERIVED DATA & PERMISSIONS ---
  const accessibleMembers = useMemo(() => {
    if (currentUser.role === "SUPER_ADMIN") {
      return teamMembers;
    }

    if (currentUser.role === "ADMIN") {
      return teamMembers.filter((m) => m.role !== "SUPER_ADMIN");
    }

    if (currentUser.role === "MANAGER") {
      return teamMembers.filter(
        (m) => m.role === "MANAGER" || m.role === "TECHNICIAN",
      );
    }

    return [currentUser];
  }, [currentUser, teamMembers]);
  const accessibleTasks = useMemo(() => {
    const accessibleIds = accessibleMembers.map((m) => m.id);
    return tasks.filter(
      (t) => t.assignedToId && accessibleIds.includes(t.assignedToId),
    );
  }, [tasks, accessibleMembers]);

  const accessibleReports = useMemo(() => {
    const accessibleNames = accessibleMembers.map((m) =>
      m.name.trim().toLowerCase(),
    );
    return savedReports.filter((r) => {
      const techName = r.deviceInfo.technicianName?.trim().toLowerCase();
      return techName && accessibleNames.includes(techName);
    });
  }, [savedReports, accessibleMembers]);

  const filteredTasks = useMemo(() => {
    let result = accessibleTasks;

    if (memberFilter !== "all") {
      result = result.filter((t) => t.assignedToId === memberFilter);
    }

    if (statusFilter === "active")
      result = result.filter((t) => t.status === "pending");
    if (statusFilter === "completed")
      result = result.filter((t) => t.status === "completed");
    if (statusFilter === "urgent")
      result = result.filter(
        (t) => t.priority === "urgent" && t.status === "pending",
      );

    return result.sort((a, b) => {
      if (
        a.priority === "urgent" &&
        b.priority !== "urgent" &&
        a.status === "pending"
      )
        return -1;
      if (
        b.priority === "urgent" &&
        a.priority !== "urgent" &&
        b.status === "pending"
      )
        return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [accessibleTasks, statusFilter, memberFilter]);

  const technicianIds = useMemo(() => {
    return accessibleMembers
      .filter((m) => m.role === "TECHNICIAN")
      .map((m) => m.id);
  }, [accessibleMembers]);

  const kpiData = useMemo(() => {
    const baseTasks =
      memberFilter === "all"
        ? accessibleTasks.filter(
            (t) =>
              t.status === "completed" &&
              t.assignedToId &&
              technicianIds.includes(t.assignedToId),
          )
        : accessibleTasks.filter(
            (t) => t.status === "completed" && t.assignedToId === memberFilter,
          );

    const total = baseTasks.length;
    const completed = baseTasks.filter((t) => t.status === "completed").length;
    const urgentPending = baseTasks.filter(
      (t) => t.status === "pending" && t.priority === "urgent",
    ).length;
    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const reportsThisMonth = baseTasks.filter((t) => {
      const taskDate = new Date(t.date);
      return (
        taskDate.getMonth() === currentMonth &&
        taskDate.getFullYear() === currentYear
      );
    }).length;

    const monthlyTarget =
      memberFilter === "all" ? accessibleMembers.length * 20 : 20;

    const targetProgress = Math.min(
      Math.round((reportsThisMonth / (monthlyTarget || 1)) * 100),
      100,
    );

    return {
      active: total - completed,
      completed,
      urgentPending,
      completionRate,
      reportsThisMonth,
      targetProgress,
      totalHistory: completed, // ✅ FIX: Show total completed tasks instead of reports
      monthlyTargetDisplay: monthlyTarget,
    };
  }, [
    accessibleTasks,
    accessibleReports,
    memberFilter,
    accessibleMembers,
    teamMembers,
    currentUser.role,
  ]);

  const chartData = useMemo(() => {
    const data: Record<string, number> = {};
    const now = new Date();

    const reportsForChart =
      memberFilter === "all"
        ? accessibleReports
        : accessibleReports.filter((r) => {
            const member = teamMembers.find((m) => m.id === memberFilter);
            return member
              ? r.deviceInfo.technicianName?.trim().toLowerCase() ===
                  member.name.trim().toLowerCase()
              : false;
          });

    if (chartView === "monthly") {
      const daysInMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
      ).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        data[i] = 0;
      }
      reportsForChart.forEach((r) => {
        const d = new Date(r.date);
        if (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        ) {
          data[d.getDate()] = (data[d.getDate()] || 0) + 1;
        }
      });
      return Object.keys(data).map((day) => ({
        name: day,
        value: data[day],
        isCurrent: parseInt(day) === now.getDate(),
      }));
    } else {
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
      months.forEach((m) => (data[m] = 0));
      reportsForChart.forEach((r) => {
        const d = new Date(r.date);
        if (d.getFullYear() === now.getFullYear()) {
          const mName = months[d.getMonth()];
          data[mName] = (data[mName] || 0) + 1;
        }
      });
      return months.map((m, idx) => ({
        name: m,
        value: data[m],
        isCurrent: idx === now.getMonth(),
      }));
    }
  }, [accessibleReports, chartView, memberFilter, teamMembers]);

  // --- HANDLERS ---
  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: quickTaskTitle,
      description: "Quickly added via My Works",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      assignedToId: memberFilter !== "all" ? memberFilter : currentUser.id,
      type: "general",
      status: "pending",
      priority: "normal",
      createdBy: currentUser.id,
    };

    setTasks([newTask, ...tasks]);
    setQuickTaskTitle("");
  };

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "completed" ? "pending" : "completed" }
          : t,
      ),
    );
  };

  const updateTaskNote = (id: string, note: string) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, technicianNote: note } : t)),
    );
  };

  const deleteTask = (id: string) => {
    if (confirm("Delete this task?")) {
      setTasks(tasks.filter((t) => t.id !== id));
    }
  };

  const clearCompleted = () => {
    if (confirm("Remove all completed tasks visible in this list?")) {
      const visibleIds = new Set(filteredTasks.map((t) => t.id));
      setTasks(
        tasks.filter((t) => !visibleIds.has(t.id) || t.status !== "completed"),
      );
    }
  };

  const getUserDetails = (id: string) =>
    teamMembers.find((m) => m.id === id) || { name: "Unknown", photo: "" };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Work Log{" "}
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
              {memberFilter === "all"
                ? currentUser.role === "TECHNICIAN"
                  ? "Personal View"
                  : "Team Overview"
                : getUserDetails(memberFilter).name}
            </span>
          </h1>
          <p className="text-slate-500 text-sm">
            Monitor activity and verify completed service units.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm text-xs font-bold text-slate-600 items-center gap-2">
            <CalendarIcon size={14} className="text-indigo-500" />
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </div>

          {isAdmin && (
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none transition-colors group-focus-within:scale-110">
                <UserIcon size={14} />
              </div>
              <select
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className="pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 shadow-sm focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none appearance-none cursor-pointer hover:border-indigo-400 transition-all min-w-[200px]"
              >
                <option value="all">🌐 Full Team View</option>
                <optgroup label="Members">
                  {accessibleMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.id === currentUser.id
                        ? "📍 My Personal Work"
                        : `👤 ${m.name}`}
                    </option>
                  ))}
                </optgroup>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <ChevronDown size={14} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Target size={80} />
          </div>
          <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mb-2">
            Monthly QC Reports
          </p>
          <h3 className="text-3xl font-black mb-1">
            {kpiData.reportsThisMonth}{" "}
            <span className="text-lg font-medium opacity-70">
              / {kpiData.monthlyTargetDisplay}
            </span>
          </h3>
          <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden mt-4">
            <div
              className="bg-white h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${kpiData.targetProgress}%` }}
            ></div>
          </div>
          <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-indigo-100">
            {kpiData.targetProgress}% Achievement Rate
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-300 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
                Assigned Tasks
              </p>
              <h3 className="text-3xl font-black text-slate-800">
                {kpiData.active}
              </h3>
            </div>
            {kpiData.urgentPending > 0 ? (
              <div className="bg-red-50 text-red-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 animate-pulse">
                <Flame size={12} fill="currentColor" /> Urgent
              </div>
            ) : (
              <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl">
                <CheckCircle2 size={20} />
              </div>
            )}
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
            Active queue status
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-300 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
                Lifetime Output
              </p>
              <h3 className="text-3xl font-black text-slate-800">
                {kpiData.totalHistory}
              </h3>
            </div>
            <div className="bg-slate-50 text-slate-400 p-2 rounded-xl">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
            Total verified reports
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-300 transition-colors">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
              Total Completion
            </p>
            <h3 className="text-3xl font-black text-slate-800">
              {kpiData.completionRate}%
            </h3>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
              Efficiency index
            </p>
          </div>
          <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#f1f5f9"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke={kpiData.completionRate === 100 ? "#10b981" : "#6366f1"}
                strokeWidth={kpiData.completionRate > 0 ? 6 : 0}
                fill="transparent"
                strokeDasharray={175.9}
                strokeDashoffset={
                  175.9 - (175.9 * kpiData.completionRate) / 100
                }
                className="transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. ACTIVITY CHART */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              Productivity Trend
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Daily output for{" "}
              {chartView === "monthly" ? "current month" : "current year"}
            </p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setChartView("monthly")}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                chartView === "monthly"
                  ? "bg-white shadow-md text-indigo-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setChartView("yearly")}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                chartView === "yearly"
                  ? "bg-white shadow-md text-indigo-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                interval={chartView === "monthly" ? 2 : 0}
              />
              <Tooltip
                cursor={{ fill: "#f1f5f9" }}
                contentStyle={{
                  borderRadius: "16px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                barSize={chartView === "monthly" ? 12 : 32}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isCurrent ? "#6366f1" : "#e2e8f0"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. TASK LIST */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 bg-slate-50/30">
          <div className="flex bg-slate-200/60 p-1 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
            {(["all", "active", "urgent", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`flex-1 md:flex-none px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${
                  statusFilter === f
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {isAdmin && (
            <form onSubmit={handleQuickAdd} className="flex-1 relative">
              <input
                type="text"
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                placeholder={
                  memberFilter === "all"
                    ? "Quick-add task for yourself..."
                    : `Quick add task for ${
                        getUserDetails(memberFilter).name
                      }...`
                }
                className="w-full pl-5 pr-12 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={!quickTaskTitle.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-200 transition-all shadow-lg active:scale-95"
              >
                <Plus size={18} />
              </button>
            </form>
          )}
        </div>

        <div className="flex-1 min-h-[400px] max-h-[600px] overflow-y-auto custom-scrollbar p-4 space-y-2">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const assignee = getUserDetails(task.assignedToId || "");
              const isAssignedToMe = task.assignedToId === currentUser.id;
              const isAssignedToOther =
                task.assignedToId && task.assignedToId !== currentUser.id;

              return (
                <div
                  key={task.id}
                  className={`group flex flex-col p-4 rounded-2xl transition-all border ${
                    task.status === "completed"
                      ? "bg-slate-50 border-transparent opacity-60"
                      : task.priority === "urgent"
                        ? "bg-white border-red-100 shadow-md ring-1 ring-red-50"
                        : "bg-white border-slate-100 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-0.5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 overflow-hidden flex-1">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                          task.status === "completed"
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : task.priority === "urgent"
                              ? "border-red-400 text-transparent hover:bg-red-50"
                              : "border-slate-200 text-transparent hover:border-indigo-500 hover:bg-indigo-50"
                        }`}
                      >
                        <Check size={16} strokeWidth={4} />
                      </button>
                      <div className="flex flex-col overflow-hidden">
                        <span
                          className={`text-sm font-bold truncate tracking-tight ${
                            task.status === "completed"
                              ? "line-through text-slate-400"
                              : "text-slate-800"
                          }`}
                        >
                          {task.title}
                        </span>
                        <div className="flex items-center gap-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span>
                            {new Date(task.date).toLocaleDateString()}
                          </span>
                          {task.time && <span>• {task.time}</span>}
                          {isAssignedToOther && (
                            <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                              {assignee.photo ? (
                                <img
                                  src={assignee.photo}
                                  className="w-4 h-4 rounded-md object-cover"
                                  alt=""
                                />
                              ) : (
                                <div className="w-4 h-4 rounded-md bg-indigo-500 flex items-center justify-center text-[7px] text-white font-black">
                                  {assignee.name.charAt(0)}
                                </div>
                              )}
                              <span className="text-slate-600">
                                {assignee.name}
                              </span>
                            </div>
                          )}
                          {task.priority === "urgent" &&
                            task.status !== "completed" && (
                              <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-lg flex items-center gap-1 font-black">
                                <Flame size={10} fill="currentColor" /> Urgent
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  {isAssignedToMe && (
                    <div className="mt-3 px-1.5">
                      <div className="relative group">
                        <StickyNote
                          size={12}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500"
                        />
                        <input
                          type="text"
                          placeholder="Add a private technical note..."
                          value={task.technicianNote || ""}
                          onChange={(e) =>
                            updateTaskNote(task.id, e.target.value)
                          }
                          className="w-full pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-4 ring-indigo-500/5 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  )}
                  {!isAssignedToMe && task.technicianNote && (
                    <div className="mt-2 ml-11 flex items-start gap-2 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100 italic">
                      <StickyNote
                        size={12}
                        className="text-indigo-400 mt-0.5 shrink-0"
                      />
                      <p className="text-[10px] text-slate-600 font-medium">
                        "{task.technicianNote}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-300">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-slate-200">
                <Search size={32} />
              </div>
              <p className="text-sm font-black uppercase tracking-widest">
                No activity found
              </p>
              <p className="text-xs mt-1 font-medium">
                Try clearing filters or adding a work item.
              </p>
            </div>
          )}
        </div>

        {isAdmin && kpiData.completed > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
            <button
              onClick={clearCompleted}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors flex items-center gap-2"
            >
              <Trash2 size={14} /> Clear {kpiData.completed} Completed Activity
              Logs
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
