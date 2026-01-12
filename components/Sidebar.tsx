import React, { useState, useMemo, useEffect } from "react";
import {
  LayoutDashboard,
  Ticket,
  FileCheck,
  Users,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  LifeBuoy,
  Clock,
  User,
  Phone,
  Globe,
  ChevronDown,
  Briefcase,
  Cpu,
  X,
  ClipboardCheck,
  Database,
  CheckSquare,
  FileText,
  Star,
  Wallet,
  Zap,
  Crown,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
} from "lucide-react";
import { View, User as AppUser, Role, AppSettings } from "../types";
import { InstallPWA } from "./InstallPWA";

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
  currentUser: AppUser;
  onLogout: () => void;
  syncStatus?: "connected" | "local" | "error";
  settings: AppSettings;
  selectedZoneId: string;
  onZoneChange: (id: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  allowedRoles: Role[];
  children?: NavItem[];
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  isMobileOpen,
  setIsMobileOpen,
  currentUser,
  onLogout,
  settings,
  selectedZoneId,
  onZoneChange,
}) => {
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // NAVIGATION CONFIGURATION
  const allNavItems: NavItem[] = useMemo(
    () => [
      {
        id: "dashboard",
        label: "Main Dashboard",
        icon: LayoutDashboard,
        allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
      },
      {
        id: "tickets",
        label: "Zonal Tickets",
        icon: Ticket,
        allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "TECHNICIAN"],
      },
      {
        id: "review_reports",
        label: "Ticket Approvals",
        icon: FileCheck,
        allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
      },
      {
        id: "tasks_group",
        label: "Team Tasks",
        icon: CheckSquare,
        allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "TECHNICIAN"],
        children: [
          {
            id: "task_dashboard",
            label: "Task Dashboard",
            icon: LayoutDashboard,
            allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
          },
          {
            id: "task_my_works",
            label: "My Work",
            icon: Briefcase,
            allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "TECHNICIAN"],
          },
          {
            id: "task_schedule",
            label: "Schedule",
            icon: Calendar,
            allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "TECHNICIAN"],
          },
          {
            id: "task_reports",
            label: "Task Reports",
            icon: FileText,
            allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
          },
        ],
      },
      {
        id: "laptop_reports_group",
        label: "Laptop Checking",
        icon: ClipboardCheck,
        allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "TECHNICIAN"],
        children: [
          {
            id: "laptop_dashboard",
            label: "QC Analytics",
            icon: BarChart3,
            allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
          },
          {
            id: "laptop_data",
            label: "Device Database",
            icon: Database,
            allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "TECHNICIAN"],
          },
        ],
      },
      {
        id: "staff_reports_group",
        label: "Staff Management",
        icon: Users,
        allowedRoles: ["SUPER_ADMIN", "ADMIN"],
        children: [
          {
            id: "staff_reports_dashboard",
            label: "Performance",
            icon: Zap,
            allowedRoles: ["SUPER_ADMIN", "ADMIN"],
          },
          {
            id: "staff_reports_financial",
            label: "Financial Logs",
            icon: Wallet,
            allowedRoles: ["SUPER_ADMIN", "ADMIN"],
          },
          {
            id: "staff_reports_ratings",
            label: "Staff Ratings",
            icon: Star,
            allowedRoles: ["SUPER_ADMIN", "ADMIN"],
          },
        ],
      },
      {
        id: "customers",
        label: "Customers",
        icon: Users,
        allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
      },
      {
        id: "brands_group",
        label: "Partner Portals",
        icon: Briefcase,
        allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "TECHNICIAN"],
        children: [
          {
            id: "brand_ivoomi",
            label: "IVOOMI Center",
            icon: Globe,
            allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "TECHNICIAN"],
          },
          {
            id: "brand_elista",
            label: "ELISTA Center",
            icon: Globe,
            allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "TECHNICIAN"],
          },
        ],
      },
      {
        id: "reports",
        label: "Reports",
        icon: BarChart3,
        allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
      },
      {
        id: "supports",
        label: "AI Service Agent",
        icon: LifeBuoy,
        allowedRoles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "TECHNICIAN"],
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        allowedRoles: ["SUPER_ADMIN", "ADMIN"],
      },
      {
        id: "customer_dashboard",
        label: "My Service History",
        icon: Clock,
        allowedRoles: ["CUSTOMER"],
      },
      {
        id: "customer_supports",
        label: "Help & Contact",
        icon: Phone,
        allowedRoles: ["CUSTOMER"],
      },
      {
        id: "customer_profile",
        label: "Account Profile",
        icon: User,
        allowedRoles: ["CUSTOMER"],
      },
    ],
    []
  );

  // Sync expanded menu with current view initially and on view changes
  useEffect(() => {
    if (isCollapsed) return; // Don't mess with expansion state if collapsed

    const activeParent = allNavItems.find((item) =>
      item.children?.some((child) => child.id === currentView)
    );

    if (activeParent) {
      setExpandedMenu(activeParent.id);
    }
  }, [currentView, allNavItems, isCollapsed]);

  const handleNavClick = (item: NavItem) => {
    if (item.children) {
      if (isCollapsed) {
        setIsCollapsed(false);
        setExpandedMenu(item.id);
      } else {
        setExpandedMenu(expandedMenu === item.id ? null : item.id);
      }
    } else {
      setCurrentView(item.id as View);
      setIsMobileOpen(false);
    }
  };

  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";

  const userZone = useMemo(() => {
    if (selectedZoneId === "all")
      return { name: "Global Network", color: "indigo" };
    return settings.zones.find((z) => z.id === selectedZoneId);
  }, [selectedZoneId, settings.zones]);

  const showLabels = !isCollapsed || isMobileOpen;

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 
        Fixed on Mobile (z-40 to overlay content)
        Relative on Desktop (lg:relative, z-auto to push content)
      */}
      <aside
        className={`
        fixed lg:relative inset-y-0 left-0 z-40 bg-[#020617] text-slate-300 transform transition-all duration-300 ease-out border-r border-white/[0.03] flex flex-col h-full
        ${
          isMobileOpen
            ? "translate-x-0 w-72"
            : "-translate-x-full lg:translate-x-0"
        }
        ${isCollapsed ? "lg:w-[90px]" : "lg:w-72"}
      `}
      >
        {/* Toggle Button (Desktop Only) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-10 w-6 h-6 bg-indigo-600 rounded-full text-white items-center justify-center shadow-lg hover:bg-indigo-500 transition-colors z-50 border-2 border-[#020617]"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen size={12} />
          ) : (
            <PanelLeftClose size={12} />
          )}
        </button>

        {/* Close Button (Mobile Only) */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white lg:hidden bg-white/5 rounded-full backdrop-blur-md transition-all"
        >
          <X size={20} />
        </button>

        {/* Brand Header */}
        <div
          className={`flex items-center gap-4 px-7 py-10 shrink-0 ${
            !showLabels ? "justify-center px-4" : ""
          }`}
        >
          <div
            className="relative group cursor-pointer"
            onClick={() => setIsCollapsed(false)}
          >
            <div
              className={`w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-tr ${
                isSuperAdmin
                  ? "from-purple-600 to-indigo-500"
                  : "from-indigo-600 to-indigo-400"
              } rounded-2xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-transform hover:scale-105 active:scale-95`}
            >
              {isSuperAdmin ? <Crown size={24} /> : <Cpu size={24} />}
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#020617] animate-pulse"></div>
          </div>

          <div
            className={`transition-opacity duration-300 ${
              showLabels ? "opacity-100" : "opacity-0 hidden w-0"
            }`}
          >
            <h1 className="text-xl font-black text-white tracking-tighter leading-none">
              INFOFIX
            </h1>
            <p className="text-[9px] font-black text-indigo-400/80 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-indigo-500"></span>{" "}
              {isSuperAdmin ? "Services" : "System"}
            </p>
          </div>
        </div>

        {/* Zone Selector */}
        {currentUser.role !== "CUSTOMER" && (
          <div className={`px-6 mb-4 ${!showLabels ? "px-3" : ""}`}>
            {isSuperAdmin ? (
              <div
                className={`bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md group hover:border-indigo-500/50 transition-all relative overflow-hidden ${
                  !showLabels ? "flex justify-center cursor-pointer" : ""
                }`}
                onClick={() => !showLabels && setIsCollapsed(false)}
              >
                <MapPin
                  size={16}
                  className={`text-indigo-400 ${
                    !showLabels
                      ? ""
                      : "absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  }`}
                />
                {showLabels && (
                  <>
                    <select
                      value={selectedZoneId}
                      onChange={(e) => onZoneChange(e.target.value)}
                      className="w-full pl-8 pr-8 py-1 bg-transparent border-none text-xs font-black text-white uppercase tracking-widest outline-none appearance-none cursor-pointer"
                    >
                      <option value="all" className="bg-[#0f172a] text-white">
                        All Zones
                      </option>
                      {settings.zones.map((z) => (
                        <option
                          key={z.id}
                          value={z.id}
                          className="bg-[#0f172a] text-white"
                        >
                          {z.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                    />
                  </>
                )}
              </div>
            ) : (
              userZone && (
                <div
                  className={`bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3 backdrop-blur-md ${
                    !showLabels ? "justify-center" : ""
                  }`}
                  title={userZone.name}
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <MapPin size={16} />
                  </div>
                  {showLabels && (
                    <div className="overflow-hidden">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest truncate">
                        Active Zone
                      </p>
                      <p className="text-xs font-black text-white truncate">
                        {userZone.name}
                      </p>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto scrollbar-hide">
          {allNavItems.map((item) => {
            if (!item.allowedRoles.includes(currentUser.role)) return null;

            const visibleChildren =
              item.children?.filter((child) =>
                child.allowedRoles.includes(currentUser.role)
              ) || [];
            if (item.children && visibleChildren.length === 0) return null;

            const isChildActive = visibleChildren.some(
              (child) => currentView === child.id
            );
            const isActive = currentView === item.id || isChildActive;

            // Allow manual toggle even if child is active
            const isOpen = expandedMenu === item.id;
            const Icon = item.icon;

            return (
              <div key={item.id} className="relative group/nav">
                {isActive && (
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)] ${
                      !showLabels ? "left-[-12px]" : "left-[-16px]"
                    }`}
                  ></div>
                )}

                <button
                  onClick={() => handleNavClick(item)}
                  className={`
                    w-full flex items-center px-4 py-3 rounded-xl text-[13px] font-bold transition-all duration-300
                    ${
                      isActive
                        ? "bg-white/[0.06] text-white"
                        : "hover:bg-white/[0.03] hover:text-slate-100 text-slate-500"
                    }
                    ${!showLabels ? "justify-center" : "justify-between"}
                  `}
                  title={!showLabels ? item.label : undefined}
                >
                  <div className="flex items-center gap-3.5">
                    <Icon
                      size={20}
                      className={
                        isActive
                          ? "text-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.4)]"
                          : "text-slate-600"
                      }
                    />
                    {showLabels && (
                      <span className="tracking-tight">{item.label}</span>
                    )}
                  </div>

                  {showLabels && item.children && (
                    <div
                      className={`transition-transform duration-500 ${
                        isOpen ? "rotate-180 text-indigo-400" : "text-slate-600"
                      }`}
                    >
                      <ChevronDown size={14} strokeWidth={3} />
                    </div>
                  )}
                </button>

                {/* --- FLOATING MENU FOR COLLAPSED STATE --- */}
                {!showLabels && item.children && (
                  <div className="absolute left-full top-0 ml-3 z-50 hidden group-hover/nav:block animate-in fade-in slide-in-from-left-2 duration-200">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-2 min-w-[200px]">
                      <div className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 mb-1">
                        {item.label}
                      </div>
                      {visibleChildren.map((child) => (
                        <button
                          key={child.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentView(child.id as View);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] font-bold transition-all ${
                            currentView === child.id
                              ? "text-white bg-indigo-600"
                              : "text-slate-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <child.icon size={14} />
                          {child.label}
                        </button>
                      ))}
                    </div>
                    {/* Arrow for tooltip feel */}
                    <div className="absolute top-4 -left-1.5 w-3 h-3 bg-slate-900 border-l border-b border-white/10 rotate-45 transform"></div>
                  </div>
                )}

                {/* --- STANDARD ACCORDION FOR EXPANDED STATE --- */}
                {item.children && isOpen && showLabels && (
                  <div className="mt-1 ml-6 pl-4 border-l border-white/[0.05] space-y-1 animate-in slide-in-from-top-2 duration-300">
                    {visibleChildren.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => {
                          setCurrentView(child.id as View);
                          setIsMobileOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[12px] font-bold transition-all ${
                          currentView === child.id
                            ? "text-white bg-white/5 shadow-inner"
                            : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]"
                        }`}
                      >
                        <child.icon
                          size={14}
                          className={
                            currentView === child.id
                              ? "text-indigo-400"
                              : "opacity-40"
                          }
                        />
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer User Profile */}
        <div className="p-4 shrink-0">
          {showLabels ? (
            <InstallPWA />
          ) : (
            <div className="flex justify-center mb-2">
              <div
                className="p-2 bg-white/5 rounded-lg text-slate-500 hover:text-white cursor-pointer"
                title="Install App"
              >
                <Zap size={16} />
              </div>
            </div>
          )}

          <div
            className={`bg-white/[0.03] backdrop-blur-2xl rounded-2xl border border-white/[0.05] shadow-2xl transition-all ${
              showLabels ? "p-4" : "p-2 flex justify-center"
            }`}
          >
            <div
              className={`flex items-center ${
                showLabels ? "justify-between" : "justify-center flex-col gap-3"
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div
                  className={`relative w-10 h-10 rounded-xl flex shrink-0 items-center justify-center text-white font-black text-sm shadow-xl ${
                    currentUser.role === "CUSTOMER"
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                      : "bg-gradient-to-br from-indigo-500 to-purple-600"
                  }`}
                >
                  {currentUser.photo ? (
                    <img
                      src={currentUser.photo}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    currentUser.name.charAt(0).toUpperCase()
                  )}
                </div>

                {showLabels && (
                  <div className="overflow-hidden">
                    <p className="text-[13px] font-black text-white truncate tracking-tight">
                      {currentUser.name}
                    </p>
                    <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mt-0.5">
                      {currentUser.role.replace("_", " ")}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={onLogout}
                className={`text-slate-500 hover:text-rose-400 transition-all ${
                  showLabels ? "p-2.5" : "p-2 hover:bg-white/5 rounded-lg"
                }`}
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default React.memo(Sidebar);
