import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Bell,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Trash2,
  CheckCheck,
  ChevronRight,
  Info,
  Flame,
  User,
  Ticket as TicketIcon,
  Filter,
  Volume2,
  VolumeX,
  Settings,
  Megaphone,
  ArrowUpDown,
  SortDesc,
  Shield,
  UserCheck,
} from "lucide-react";
import { AppNotification, View, User as AppUser, Role } from "../types";

interface NotificationHubProps {
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: View) => void;
  currentUser: AppUser | null;
}

// A short, valid base64 MP3 "ping" sound
const NOTIFICATION_SOUND =
  "data:audio/mp3;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7kVAAAAARIHRJqWAABiBCiTXAAACqgCZYourAAcABWOkXmpf725LLeSNwjah4L/2oZ/MFmkB+at8A+GF1JaaNgVqAvGz/l75D9x8//7kVAAAAAAAoaJTwAAAEwKJPAAAAG175D9x8/9+M2//5feD78/7/9/4f/8A8//7kVAAAAAAAoaJTwAAAEwKJPAAAAG175D9x8/9+M2//5feD78/7/9/4f/8A8//7kVAAAAAAAoaJTwAAAEwKJPAAAAG175D9x8/9+M2//5feD78/7/9/4f/8A8";

export default function NotificationHub({
  notifications,
  setNotifications,
  isOpen,
  onClose,
  onNavigate,
  currentUser,
}: NotificationHubProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "urgent" | "system">(
    "all",
  );
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [userRoleFilter, setUserRoleFilter] = useState<Role | "ALL">("ALL");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermission>(Notification.permission);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevCount = useRef(notifications.length);

  const isAdmin =
    currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ADMIN";

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND);
    audioRef.current.volume = 0.5;
  }, []);

  // Request Permissions
  const requestPermissions = async () => {
    const perm = await Notification.requestPermission();
    setPermissionStatus(perm);
  };

  useEffect(() => {
    if (notifications.length > prevCount.current) {
      // New notification arrived
      const latest = notifications[0];

      // 1. Play Sound
      if (soundEnabled && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current
          .play()
          .catch((e) => console.log("Audio play failed", e));
      }

      // 2. Vibrate
      if (navigator.vibrate) {
        if (latest.type === "urgent") navigator.vibrate([200, 100, 200]);
        else navigator.vibrate(200);
      }

      // 3. System Notification (if backgrounded)
      if (document.hidden && permissionStatus === "granted") {
        new Notification(latest.title, {
          body: latest.message,
          icon: "/vite.svg",
        });
      }
    }
    prevCount.current = notifications.length;
  }, [notifications, soundEnabled, permissionStatus]);

  // Filtering & Sorting
  const filteredNotifications = useMemo(() => {
    if (!currentUser) return [];

    let result = notifications.filter((n) => {
      if (!currentUser) return false;

      // Role-based access
      switch (currentUser.role) {
        case "SUPER_ADMIN":
          // SUPER_ADMIN sees everything
          break;

        case "ADMIN":
          // Admin sees everyone EXCEPT SUPER_ADMIN
          if (n.userRole === "SUPER_ADMIN") return false;
          break;

        case "MANAGER":
          // Manager sees only other managers and techs
          if (["SUPER_ADMIN", "ADMIN", "CUSTOMER"].includes(n.userRole))
            return false;
          break;

        case "TECHNICIAN":
          // Tech sees only own notifications
          if (n.userId !== currentUser.id) return false;
          break;

        case "CUSTOMER":
          // Customer sees only own notifications
          if (n.userId !== currentUser.id) return false;
          break;

        default:
          return false;
      }

      // Type filtering
      if (
        activeFilter === "urgent" &&
        n.type !== "urgent" &&
        n.type !== "warning"
      )
        return false;
      if (
        activeFilter === "system" &&
        n.type !== "info" &&
        n.type !== "success"
      )
        return false;

      // Admin-specific role filter dropdown
      if (isAdmin && userRoleFilter !== "ALL" && n.userRole !== userRoleFilter)
        return false;

      return true;
    });

    // 4. Sorting
    result = result.sort((a, b) => {
      if (sortOrder === "newest") return b.timestamp - a.timestamp;
      return a.timestamp - b.timestamp;
    });

    return result;
  }, [
    notifications,
    activeFilter,
    sortOrder,
    isAdmin,
    currentUser,
    userRoleFilter,
  ]);

  // REPLACE the markAllRead function in NotificationHub (around line 170)

  const markAllRead = async () => {
    if (!currentUser) return;

    const visibleIds = filteredNotifications
      .filter((n) => !n.readBy.includes(currentUser.id))
      .map((n) => n.id);

    if (visibleIds.length === 0) return;

    // Update in Supabase
    if (window.supabase) {
      for (const id of visibleIds) {
        const notif = notifications.find((n) => n.id === id);
        if (notif) {
          const updatedReadBy = [...notif.readBy, currentUser.id];
          await window.supabase
            .from("notifications")
            .update({ read_by: updatedReadBy })
            .eq("id", id);
        }
      }
    }

    // Update local state
    setNotifications((prev) =>
      prev.map((n) =>
        visibleIds.includes(n.id)
          ? { ...n, readBy: [...n.readBy, currentUser.id] }
          : n,
      ),
    );
  };

  // REPLACE the clearAll function (around line 190)

  const clearAll = async () => {
    if (!confirm("Clear currently visible notifications?")) return;

    const visibleIds = filteredNotifications.map((n) => n.id);

    // Delete from Supabase
    if (window.supabase) {
      for (const id of visibleIds) {
        await window.supabase.from("notifications").delete().eq("id", id);
      }
    }

    // Update local state
    setNotifications(notifications.filter((n) => !visibleIds.includes(n.id)));
  };

  // REPLACE the handleItemClick function (around line 200)

  const handleItemClick = async (n: AppNotification) => {
    if (!currentUser) return;

    if (!n.readBy.includes(currentUser.id)) {
      const updatedReadBy = [...n.readBy, currentUser.id];

      // Update in Supabase
      if (window.supabase) {
        await window.supabase
          .from("notifications")
          .update({ read_by: updatedReadBy })
          .eq("id", n.id);
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === n.id ? { ...item, readBy: updatedReadBy } : item,
        ),
      );
    }

    if (n.link) {
      onNavigate(n.link);
      onClose();
    }
  };
  const getIcon = (type: string) => {
    switch (type) {
      case "urgent":
        return <Flame size={18} className="text-white" />;
      case "warning":
        return <AlertCircle size={18} className="text-white" />;
      case "success":
        return <CheckCircle2 size={18} className="text-white" />;
      default:
        return <Info size={18} className="text-white" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "urgent":
        return "bg-rose-500 shadow-rose-200";
      case "warning":
        return "bg-amber-500 shadow-amber-200";
      case "success":
        return "bg-emerald-500 shadow-emerald-200";
      default:
        return "bg-indigo-500 shadow-indigo-200";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell size={24} className="text-indigo-600" />
              {/* Bell Indicator */}
              {currentUser &&
  filteredNotifications.some(
    (n) => !n.readBy.includes(currentUser.id)
  ) && (
    <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white"></span>
  )}

            </div>
            <h2 className="text-xl font-bold text-slate-800">Notifications</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Controls */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200">
              {["all", "urgent", "system"].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f as any)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                    activeFilter === f
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg border transition-colors ${
                  soundEnabled
                    ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                    : "bg-white border-slate-200 text-slate-400"
                }`}
                title="Toggle Sound"
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              {permissionStatus !== "granted" && (
                <button
                  onClick={requestPermissions}
                  className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                  title="Enable Desktop Notifications"
                >
                  <Megaphone size={16} />
                </button>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
              <div className="relative flex-1">
                <Filter
                  size={12}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value as any)}
                  className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 outline-none appearance-none"
                >
                  <option value="ALL">All Roles</option>
                  <option value="TECHNICIAN">Technicians</option>
                  <option value="MANAGER">Managers</option>
                  <option value="ADMIN">Admins</option>
                  <option value="CUSTOMER">Customers</option>
                </select>
              </div>
              <button
                onClick={() =>
                  setSortOrder((prev) =>
                    prev === "newest" ? "oldest" : "newest",
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:text-indigo-600 transition-colors"
              >
                <ArrowUpDown size={12} />
                {sortOrder === "newest" ? "Newest" : "Oldest"}
              </button>
            </div>
          )}

          <div className="flex justify-between items-center text-xs pt-1">
            <span className="font-bold text-slate-500">
              {filteredNotifications.length} Messages
            </span>
            <div className="flex gap-3">
              <button
                onClick={markAllRead}
                className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
              >
                <CheckCheck size={14} /> Mark Read
              </button>
              <button
                onClick={clearAll}
                className="text-slate-400 hover:text-rose-500 font-bold flex items-center gap-1 transition-colors"
              >
                <Trash2 size={14} /> Clear
              </button>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 bg-slate-50/50">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((note) => {
              const isRead = currentUser
                ? note.readBy.includes(currentUser.id)
                : false;

              return (
                <div
                  key={note.id}
                  onClick={() => !isRead && handleItemClick(note)}
                  className={`relative p-4 rounded-xl border transition-all group ${
                    isRead
                      ? "bg-white border-slate-100 opacity-70 cursor-default"
                      : "bg-white border-indigo-100 shadow-sm ring-1 ring-indigo-50 cursor-pointer hover:shadow-md"
                  }`}
                >
                  {!isRead && (
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                  )}

                  <div className="flex gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg shrink-0 ${getColor(
                        note.type,
                      )}`}
                    >
                      {getIcon(note.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4
                          className={`text-sm font-bold truncate ${
                            isRead ? "text-slate-600" : "text-slate-900"
                          }`}
                        >
                          {note.title}
                        </h4>

                        {isAdmin && note.userName && (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                            <User size={8} /> {note.userName.split(" ")[0]}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-2">
                        {note.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(note.timestamp).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>

                        {note.link && (
                          <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            View <ChevronRight size={10} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                <Bell size={32} className="opacity-20" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest opacity-50">
                All caught up
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
