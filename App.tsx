import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import TicketList from "./components/TicketList";
import CustomerList from "./components/CustomerList";
import Settings from "./components/Settings";
import Reports from "./components/Reports";
import Supports from "./components/Supports";
import Schedule from "./components/Schedule";
import Login from "./components/Login";
import CustomerPortal from "./components/CustomerPortal";
import ReviewReports from "./components/ReviewReports";
import CustomerProfile from "./components/CustomerProfile";
import CustomerSupportInfo from "./components/CustomerSupportInfo";
import BrandIvoomi from "./components/BrandIvoomi";
import BrandElista from "./components/BrandElista";
import LaptopReports from "./components/LaptopReports";
import TaskManager from "./components/TaskManager";
import StaffRatingsView from "./components/StaffRatingsView";
import StaffReportsDashboard from "./components/StaffReports/Dashboard";
import StaffReportsFinancial from "./components/StaffReports/Financial";
import NotificationHub from "./components/NotificationHub";
import { TicketFormModal } from "./components/TicketFormModal";
import {
  View,
  Ticket,
  User,
  AppSettings,
  Customer,
  Task,
  Report,
  OperationalZone,
  AppNotification,
  Store,
  Role,
} from "./types";
import { CloudOff } from "lucide-react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

type SyncStatus = "checking" | "connected" | "local" | "error";

const safeStringify = (v: any) => JSON.stringify(v);
const safeParse = <T,>(json: string | null, fallback: T): T => {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
};
function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? safeParse(item, initialValue) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      setStoredValue(item ? safeParse(item, initialValue) : initialValue);
    } catch {
      setStoredValue(initialValue);
    }
  }, [key]);

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore =
        typeof value === "function"
          ? (value as (prev: T) => T)(storedValue)
          : value;

      setStoredValue(valueToStore);
      window.localStorage.setItem(key, safeStringify(valueToStore));
    } catch {}
  };

  return [storedValue, setValue];
}

function useSmartSync<T>(
  docName: string,
  initialValue: T,
  activeZoneId: string,
  onStatusChange?: (status: SyncStatus) => void,
  onUpdateReceived?: (newData: T) => void
): [T, (val: T | ((prev: T) => T)) => void] {
  const [data, setData] = useState<T>(() => {
    try {
      return safeParse(
        localStorage.getItem(`${docName}_${activeZoneId}`),
        initialValue
      );
    } catch {
      return initialValue;
    }
  });

  const updateData = (value: T | ((prev: T) => T)) => {
    const newValue =
      typeof value === "function" ? (value as (prev: T) => T)(data) : value;

    setData(newValue);
    localStorage.setItem(`${docName}_${activeZoneId}`, safeStringify(newValue));

    if (isSupabaseConfigured && supabase) {
      supabase
        .from("app_data")
        .upsert(
          {
            key: docName,
            data: newValue,
            zone_id: activeZoneId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key,zone_id" }
        )
        .then(({ error }) => {
          onStatusChange?.(error ? "local" : "connected");
        });
    }
  };

  return [data, updateData];
}

const DEFAULT_SETTINGS: AppSettings = {
  zones: [],
  stores: [],

  deviceTypes: [
    { id: "d1", name: "Smartphone" },
    { id: "d2", name: "Laptop" },
    { id: "d3", name: "Desktop" },
  ],
  ticketStatuses: [
    { id: "st1", name: "New", isSystem: true },
    { id: "st2", name: "In Progress" },
    { id: "st3", name: "Resolved", isSystem: true },
    { id: "st6", name: "On Hold", isSystem: true },
  ],
  priorities: [
    { id: "p1", name: "Low" },
    { id: "p2", name: "Medium" },
    { id: "p3", name: "High" },
  ],
  holdReasons: [{ id: "h1", name: "Parts Pending" }],
  progressReasons: [{ id: "pr1", name: "Diagnosing" }],
  serviceBrands: [
    { id: "b1", name: "IVOOMI" },
    { id: "b2", name: "ELISTA" },
  ],
  laptopDealers: [
    { id: "ld-1", name: "Direct Customer" },
    { id: "ld-2", name: "Local Dealer" },
  ],
  sla: { high: 2, medium: 5, low: 10 },
  teamMembers: [
    {
      id: "1",
      name: "System Admin",
      email: "admin@infofix.com",
      role: "SUPER_ADMIN",
      zoneId: "global",
    },
  ],
  supportGuidelines: [],
  officialRecords: [],
};

function App() {
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("checking");

  const [isGlobalTicketModalOpen, setIsGlobalTicketModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useSessionStorage<User | null>(
    "nexus_current_user_v1",
    null
  );
  const [isNotificationHubOpen, setIsNotificationHubOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [zones, setZones] = useState<OperationalZone[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoadingTeamData, setIsLoadingTeamData] = useState(false);

  // Add this function to fetch all team-related data
  const fetchTeamData = useCallback(async () => {
    if (!supabase) {
      console.log("Supabase not configured");
      return;
    }

    setIsLoadingTeamData(true);
    try {
      // Fetch team members
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;

      const transformedUsers: User[] = usersData.map((user) => ({
        id: user.id,
        auth_id: user.auth_id,
        name: user.name,
        email: user.email,
        role: user.role as Role,
        zoneId: user.zone_id || "",
        storeId: user.store_id || "",
        mobile: user.mobile || "",
        photo: user.photo || "",
        experience: user.experience || "",
        address: user.address || "",
        password: user.password || "",
      }));

      setTeamMembers(transformedUsers);

      // Fetch zones
      const { data: zonesData, error: zonesError } = await supabase
        .from("operational_zones")
        .select("*");

      if (zonesError) throw zonesError;

      const transformedZones: OperationalZone[] = zonesData.map((z: any) => ({
        id: z.id,
        name: z.name,
        color: z.color,
        address: z.address,
        headBranchId: z.head_branch_id ?? undefined,
      }));

      setZones(transformedZones);

      // Fetch stores
      const { data: storesData, error: storesError } = await supabase
        .from("stores")
        .select("*");

      if (storesError) throw storesError;

      const transformedStores: Store[] = storesData.map((s) => ({
        id: s.id,
        name: s.name,
        address: s.address,
        phone: s.phone,
        zoneId: s.zone_id ?? undefined,
      }));

      setStores(transformedStores);

      // Update app settings with fetched data
      setAppSettings((prev) => ({
        ...prev,
        teamMembers: transformedUsers,
        zones: transformedZones,
        stores: transformedStores,
      }));

      console.log("✅ Team data fetched successfully");
    } catch (error) {
      console.error("❌ Error fetching team data:", error);
    } finally {
      setIsLoadingTeamData(false);
    }
  }, []);

  // Replace the existing useEffect that fetches zones (around line 300) with this combined one:
  useEffect(() => {
    if (!supabase || !currentUser) return;

    console.log("👥 User logged in, fetching team data...");
    fetchTeamData();
  }, [currentUser, fetchTeamData]);

  // Health check to determine actual Supabase connectivity
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      if (!supabase) {
        setSyncStatus("local");
        return;
      }

      try {
        const { error } = await supabase
          .from("app_data")
          .select("key")
          .limit(1);
        setSyncStatus(error ? "local" : "connected");
      } catch {
        setSyncStatus("local");
      }
    };

    checkSupabaseConnection();
  }, []);

  // Handle PWA Shortcuts
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "new_ticket") {
      setIsGlobalTicketModalOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  // NEW: global notifications synced across users
  const [notifications, setNotifications] = useSmartSync<AppNotification[]>(
    "notifications",
    [],
    "global",
    setSyncStatus
  );

  const [selectedZoneId, setSelectedZoneId] = useState<string>("all");

  const pushNotification = (
    notif: Omit<
      AppNotification,
      "id" | "timestamp" | "read" | "userId" | "userRole"
    >
  ) => {
    if (!currentUser) return;

    const newNotif: AppNotification = {
      ...notif,
      id: Date.now().toString() + Math.random().toString().slice(2, 5),
      userId: currentUser.id,
      userRole: currentUser.role,
      timestamp: Date.now(),

      // 🔥 NEW
      readBy: [],
    };

    // --- Notification Permission Logic ---
    setNotifications((prev) => {
      // Super admin sees all
      if (currentUser.role === "SUPER_ADMIN")
        return [newNotif, ...prev].slice(0, 50);

      // Admin sees all except notifications from SUPER_ADMIN
      if (currentUser.role === "ADMIN") {
        return [
          newNotif,
          ...prev.filter((n) => n.userRole !== "SUPER_ADMIN"),
        ].slice(0, 50);
      }

      // Other roles only see self notifications
      return [
        newNotif,
        ...prev.filter((n) => n.userId === currentUser.id),
      ].slice(0, 50);
    });
  };

  const isRelevance = useCallback(
    (t: Ticket) => {
      if (!currentUser) return false;
      if (currentUser.role === "SUPER_ADMIN" || currentUser.role === "ADMIN")
        return true;
      if (currentUser.role === "MANAGER")
        return t.zoneId === currentUser.zoneId;
      if (currentUser.role === "TECHNICIAN")
        return t.assignedToId === currentUser.id;
      if (currentUser.role === "CUSTOMER")
        return t.email.toLowerCase() === currentUser.email.toLowerCase();
      return false;
    },
    [currentUser]
  );

  const syncZone = selectedZoneId === "all" ? "global" : selectedZoneId;
  const [appSettings, setAppSettings] = useSmartSync<AppSettings>(
    "settings",
    DEFAULT_SETTINGS,
    "global",
    setSyncStatus
  );
  // ✅ GLOBAL customers (used ONLY for Dashboard KPIs)
  const [globalCustomers, setGlobalCustomers] = useSmartSync<Customer[]>(
    "customers",
    [],
    "global",
    setSyncStatus
  );

  const [customers, setCustomers] = useSmartSync<Customer[]>(
    "customers",
    [],
    syncZone,
    setSyncStatus
  );

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  // 🔥 FIX: Fetch tickets function with proper loading state
  const fetchTickets = useCallback(async () => {
    if (!supabase) {
      console.log("Supabase not configured");
      return;
    }

    console.log("🎫 Fetching tickets from Supabase...");
    setIsLoadingTickets(true);

    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Ticket fetch error:", error);
        setSyncStatus("error");
        return;
      }

      console.log(`✅ Fetched ${data?.length || 0} tickets from Supabase`);

      const mapped: Ticket[] = data.map((t) => ({
        id: t.id,
        ticketId: t.id,
        customerId: t.customer_id,
        name: t.name ?? "",
        email: t.email ?? "",
        number: t.mobile ?? "",
        address: t.address ?? "",
        deviceType: t.device_type,
        brand: t.device_brand,
        model: t.device_model,
        serial: t.device_serial_number,
        deviceDescription: t.device_description ?? "",
        chargerIncluded: t.charger_status === "INCLUDED",
        issueDescription: t.subject,
        store: t.store,
        estimatedAmount: t.amount_estimate
          ? Number(t.amount_estimate)
          : undefined,
        warranty: t.warranty === "YES",
        billNumber: t.bill_number,
        priority: t.priority,
        status: t.status,
        holdReason: t.hold_reason,
        progressReason: t.internal_progress_reason,
        progressNote: t.internal_progress_note,
        scheduledDate: t.scheduled_date,
        assignedToId: t.assigned_to ?? "",
        date: new Date(t.created_at).toLocaleDateString(),
        zoneId: t.zone_id ?? "",
        history: [],
      }));

      setTickets(mapped);
      setSyncStatus("connected");
    } catch (err) {
      console.error("❌ Error fetching tickets:", err);
      setSyncStatus("error");
    } finally {
      setIsLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase || !currentUser) {
      setSyncStatus("local");
      return;
    }

    console.log("👤 User logged in, fetching tickets...");
    // Add a small delay to ensure all state updates have propagated
    fetchTickets();
  }, [currentUser, fetchTickets]);

  useEffect(() => {
    if (!supabase || !currentUser) return;

    console.log("🔄 Setting up realtime subscription...");

    const channel = supabase
      .channel("tickets-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        (payload) => {
          console.log("🔔 Realtime update received:", payload);
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      console.log("🔌 Unsubscribing from realtime...");
      supabase.removeChannel(channel);
    };
  }, [currentUser, fetchTickets]);

  const [tasks, setTasks] = useSmartSync<Task[]>(
    "tasks",
    [],
    syncZone,
    setSyncStatus
  );
  const [laptopReports, setLaptopReports] = useState<Report[]>([]);

  // 🔥 FIX: handleLogin now properly triggers ticket fetch
  const handleLogin = async (user: User) => {
    console.log("🔐 Login initiated for:", user.email);

    setCurrentUser(user);

    setCurrentView(
      user.role === "CUSTOMER" ? "customer_dashboard" : "dashboard"
    );

    // 🔥 FIX: Clear any stale tickets before fetching fresh data from Supabase
    setTickets([]);
    // ✅ SYSTEM LOGIN NOTIFICATION (OLD APP STYLE)
    setNotifications((prev) => [
      {
        id: Date.now().toString(),
        type: "info",
        title: "System Access",
        message: `${user.name} logged into the system.`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        timestamp: Date.now(),
        readBy: [],
      },
      ...prev,
    ]);
  };

  const visibleNotifications = useMemo(() => {
    if (!currentUser) return [];

    return notifications.filter((n) => {
      // TECHNICIAN: only own notifications
      if (currentUser.role === "TECHNICIAN") {
        return n.userId === currentUser.id;
      }

      // MANAGER: exclude admin & customer
      if (currentUser.role === "MANAGER") {
        return !["SUPER_ADMIN", "ADMIN", "CUSTOMER"].includes(n.userRole);
      }

      // ADMIN & SUPER_ADMIN: see all
      return true;
    });
  }, [notifications, currentUser]);

  const renderContent = () => {
    if (!currentUser) return null;

    // Show loading state while tickets are being fetched
    if (isLoadingTickets && tickets.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Loading tickets...</p>
          </div>
        </div>
      );
    }

    if (currentUser.role === "CUSTOMER") {
      switch (currentView) {
        case "customer_dashboard":
          return (
            <CustomerPortal
              currentUser={currentUser}
              tickets={tickets}
              setTickets={setTickets}
              settings={appSettings}
            />
          );
        case "customer_profile":
          return (
            <CustomerProfile
              currentUser={currentUser}
              customers={customers}
              setCustomers={setCustomers}
              updateCurrentUser={setCurrentUser}
              tickets={tickets}
            />
          );
        case "customer_supports":
          return <CustomerSupportInfo settings={appSettings} />;
        default:
          return (
            <CustomerPortal
              currentUser={currentUser}
              tickets={tickets}
              setTickets={setTickets}
              settings={appSettings}
            />
          );
      }
    }

    switch (currentView) {
      case "dashboard":
        return (
          <Dashboard
            tickets={tickets}
            customers={globalCustomers}
            settings={appSettings}
            currentUser={currentUser}
            onNavigate={setCurrentView}
            onAction={(a) =>
              a === "new_ticket" && setIsGlobalTicketModalOpen(true)
            }
            selectedZoneId={selectedZoneId}
          />
        );
      case "tickets":
        return (
          <TicketList
            tickets={tickets}
            setTickets={setTickets}
            customers={customers}
            setCustomers={setCustomers}
            settings={appSettings}
            currentUser={currentUser}
            selectedZoneId={selectedZoneId}
            onRefresh={fetchTickets}
            teamMembers={teamMembers}
            zones={zones}
            stores={stores || []}
          />
        );
      case "review_reports":
        return (
          <ReviewReports
            tickets={tickets}
            setTickets={setTickets}
            currentUser={currentUser}
          />
        );
      case "task_dashboard":
        return (
          <TaskManager
            activeTab="dashboard"
            tasks={tasks}
            setTasks={setTasks}
            teamMembers={teamMembers}
            currentUser={currentUser}
            savedReports={laptopReports}
            settings={appSettings}
            selectedZoneId={selectedZoneId}
          />
        );
      case "task_my_works":
        return (
          <TaskManager
            activeTab="my_works"
            tasks={tasks}
            setTasks={setTasks}
            teamMembers={teamMembers}
            currentUser={currentUser}
            savedReports={laptopReports}
            settings={appSettings}
            selectedZoneId={selectedZoneId}
          />
        );
      case "task_schedule":
        return (
          <Schedule
            tasks={tasks}
            setTasks={setTasks}
            tickets={tickets}
            settings={appSettings}
            currentUser={currentUser}
          />
        );
      case "task_reports":
        return (
          <TaskManager
            activeTab="reports"
            tasks={tasks}
            setTasks={setTasks}
            teamMembers={teamMembers}
            currentUser={currentUser}
            savedReports={laptopReports}
            settings={appSettings}
            selectedZoneId={selectedZoneId}
          />
        );
      case "staff_reports_dashboard":
        return (
          <StaffReportsDashboard
            teamMembers={teamMembers}
            tasks={tasks}
            savedReports={laptopReports}
            settings={appSettings}
            selectedZoneId={selectedZoneId}
            onNavigate={setCurrentView}
          />
        );
      case "staff_reports_financial":
        return (
          <StaffReportsFinancial
            currentUser={currentUser}
            teamMembers={teamMembers}
            tasks={tasks}
            savedReports={laptopReports}
            settings={appSettings}
            onUpdateSettings={setAppSettings}
            selectedZoneId={selectedZoneId}
            
          />
        );
      case "staff_reports_ratings":
        return (
          <StaffRatingsView
            currentUser={currentUser}
            teamMembers={teamMembers}
            tasks={tasks}
            savedReports={laptopReports}
            settings={appSettings}
            onUpdateSettings={setAppSettings}
          />
        );
      case "laptop_dashboard":
        return (
          <LaptopReports
            activeTab="dashboard"
            settings={appSettings}
            currentUser={currentUser}
            reports={laptopReports}
            setReports={setLaptopReports}
            selectedZoneId={selectedZoneId}
          />
        );
      case "laptop_data":
        return (
          <LaptopReports
            activeTab="data"
            settings={appSettings}
            currentUser={currentUser}
            reports={laptopReports}
            setReports={setLaptopReports}
            selectedZoneId={selectedZoneId}
          />
        );
      case "customers":
        return (
          <CustomerList
            customers={customers}
            setCustomers={setCustomers}
            tickets={tickets}
            selectedZoneId={selectedZoneId}
          />
        );
      case "brand_ivoomi":
        return <BrandIvoomi />;
      case "brand_elista":
        return <BrandElista />;
      case "reports":
        return <Reports currentUser={currentUser} tickets={tickets} settings={appSettings} />;
      case "supports":
        return (
          <Supports
            tickets={tickets}
            customers={customers}
            tasks={tasks}
            reports={laptopReports}
            settings={appSettings}
            onUpdateSettings={setAppSettings}
          />
        );
      case "settings":
        return (
          <Settings
            currentUser={currentUser}
            tickets={tickets}
            onUpdateTickets={setTickets}
            customers={customers}
            onUpdateCustomers={setCustomers}
            tasks={tasks}
            onUpdateTasks={setTasks}
            laptopReports={laptopReports}
            onUpdateLaptopReports={setLaptopReports}
            settings={appSettings}
            onUpdateSettings={setAppSettings}
            teamMembers={teamMembers}
            zones={zones}
            stores={stores}
            onRefreshTeamData={fetchTeamData}
          />
        );
      default:
        return (
          <Dashboard
            tickets={tickets}
            customers={customers}
            settings={appSettings}
            currentUser={currentUser}
            onNavigate={setCurrentView}
            onAction={(a) =>
              a === "new_ticket" && setIsGlobalTicketModalOpen(true)
            }
            selectedZoneId={selectedZoneId}
          />
        );
    }
  };

  if (!currentUser)
    return (
      <Login
        onLogin={handleLogin}
        teamMembers={appSettings.teamMembers}
        customers={customers}
        setCustomers={setCustomers}
        pushNotification={pushNotification}
      />
    );

  return (
    <div className="flex h-screen bg-slate-50 relative overflow-hidden">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        currentUser={currentUser}
        onLogout={() => {
          if (currentUser) {
            setNotifications((prev) => [
              {
                id: Date.now().toString(),
                type: "info",
                title: "Session Ended",
                message: `${currentUser.name} logged out.`,
                userId: currentUser.id,
                userName: currentUser.name,
                userRole: currentUser.role,
                timestamp: Date.now(),
                readBy: [],
              },
              ...prev,
            ]);
          }

          setCurrentUser(null);
          setCurrentView("dashboard");
          setSelectedZoneId("all");
          setTickets([]);
        }}
        syncStatus={syncStatus}
        settings={appSettings}
        selectedZoneId={selectedZoneId}
        onZoneChange={setSelectedZoneId}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header
          onMenuClick={() => setIsMobileOpen(true)}
          title={currentView.replace(/_/g, " ")}
          currentUser={currentUser}
          visibleNotifications={visibleNotifications}
          onBellClick={() => setIsNotificationHubOpen(true)}
        />
        {syncStatus === "local" && isBannerVisible && (
          <div className="bg-slate-800 text-white px-6 py-3 flex items-center justify-between shadow-2xl z-50">
            <div className="flex items-center gap-4">
              <CloudOff size={18} className="text-amber-400 animate-pulse" />
              <p className="text-xs font-black uppercase tracking-widest">
                Local Mode (Offline Sync)
              </p>
            </div>
            <button
              onClick={() => setIsBannerVisible(false)}
              className="px-4 py-1.5 bg-white/10 rounded-lg text-xs font-black uppercase"
            >
              DISMISS
            </button>
          </div>
        )}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-8">
          <div className="max-w-[1920px] mx-auto h-full">{renderContent()}</div>
        </main>
        <TicketFormModal
          isOpen={isGlobalTicketModalOpen}
          onClose={() => setIsGlobalTicketModalOpen(false)}
          customers={customers}
          setCustomers={setCustomers}
          tickets={tickets}
          setTickets={setTickets}
          settings={appSettings}
          currentUser={currentUser}
          onSuccess={() => setIsGlobalTicketModalOpen(false)}
          onRefresh={fetchTickets}
          teamMembers={teamMembers}
          zones={zones}
          stores={stores || []}
        />
        <NotificationHub
          isOpen={isNotificationHubOpen}
          onClose={() => setIsNotificationHubOpen(false)}
          notifications={notifications}
          setNotifications={setNotifications}
          onNavigate={setCurrentView}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}

export default App;
