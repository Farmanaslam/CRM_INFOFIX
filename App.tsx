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
} from "./types";
import { CloudOff } from "lucide-react";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

type SyncStatus = "connected" | "local" | "error";

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
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? safeParse(item, initialValue) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // 🔥 KEY CHANGE HANDLER - Sync with localStorage when key changes
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      setStoredValue(item ? safeParse(item, initialValue) : initialValue);
    } catch {
      setStoredValue(initialValue);
    }
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
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
): [T, (val: T) => void] {
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

  const updateData = (newValue: T) => {
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
  stores: [
    {
      id: "store-1",
      name: "DGP SHOP",
      address: "",
      phone: "",
    },
    {
      id: "store-2",
      name: "DGP SHOWROOM",
      address: "",
      phone: "",
    },
    {
      id: "store-3",
      name: "DGP STORE",
      address: "",
      phone: "",
    },
    {
      id: "store-4",
      name: "ASANSOL",
      address: "",
      phone: "",
    },
    {
      id: "store-5",
      name: "UKHRA",
      address: "",
      phone: "",
    },
  ],
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
  laptopDealers: [],
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
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    navigator.onLine ? "connected" : "local"
  );
  const [isGlobalTicketModalOpen, setIsGlobalTicketModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useSessionStorage<User | null>(
    "nexus_current_user_v1",
    null
  );
  const [isNotificationHubOpen, setIsNotificationHubOpen] = useState(false);

  // isolation: User-specific notification storage key
  const notificationKey = useMemo(() => {
    return currentUser
      ? `nexus_notifications_${currentUser.id}_v1`
      : "nexus_notifications_guest_v1";
  }, [currentUser]);

  const [notifications, setNotifications] = useSessionStorage<
    AppNotification[]
  >(notificationKey, []);
  const [selectedZoneId, setSelectedZoneId] = useState<string>("all");

  const pushNotification = (
    notif: Omit<AppNotification, "id" | "timestamp" | "read" | "userId">
  ) => {
    if (!currentUser) return;
    const newNotif: AppNotification = {
      ...notif,
      id: Date.now().toString() + Math.random().toString().slice(2, 5),
      userId: currentUser.id,
      timestamp: Date.now(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
  };

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
  }, []); // No dependencies - supabase is constant

  // 🔥 FIX: Fetch tickets IMMEDIATELY when currentUser changes (on login)
  useEffect(() => {
    if (!supabase || !currentUser) {
      console.log("⏭️ Skipping ticket fetch - no user or supabase");
      return;
    }

    console.log("👤 User logged in, fetching tickets...");
    // Add a small delay to ensure all state updates have propagated
    fetchTickets();
  }, [currentUser, fetchTickets]);

  // 🔥 FIX: Set up realtime subscription separately
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

    // Removed: Zone filtering on login - keeps selectedZoneId as "all" to show all tickets
    // if (user.role !== "SUPER_ADMIN" && user.zoneId) {
    //   setSelectedZoneId(user.zoneId);
    // }

    setCurrentView(
      user.role === "CUSTOMER" ? "customer_dashboard" : "dashboard"
    );

    // 🔥 FIX: Clear any stale tickets before fetching fresh data from Supabase
    setTickets([]);
  };
  useEffect(() => {
    if (!currentUser) return;

    // Small delay to ensure notification system is ready
    const timeoutId = setTimeout(() => {
      pushNotification({
        type: "success",
        title: "Login Successful",
        message: `Welcome back, ${currentUser.name}!`,
        link: "dashboard",
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [currentUser?.id]); // Only trigger on user ID change

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
            teamMembers={appSettings.teamMembers}
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
            teamMembers={appSettings.teamMembers}
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
            teamMembers={appSettings.teamMembers}
            currentUser={currentUser}
            savedReports={laptopReports}
            settings={appSettings}
            selectedZoneId={selectedZoneId}
          />
        );
      case "staff_reports_dashboard":
        return (
          <StaffReportsDashboard
            teamMembers={appSettings.teamMembers}
            tasks={tasks}
            savedReports={laptopReports}
            settings={appSettings}
            selectedZoneId={selectedZoneId}
          />
        );
      case "staff_reports_financial":
        return (
          <StaffReportsFinancial
            teamMembers={appSettings.teamMembers}
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
            teamMembers={appSettings.teamMembers}
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
        return <Reports tickets={tickets} settings={appSettings} />;
      case "supports":
        return (
          <Supports
            tickets={tickets}
            customers={customers}
            tasks={tasks}
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
          console.log("👋 Logging out...");
          setCurrentUser(null);
          setCurrentView("dashboard");
          setSelectedZoneId("all");
          setTickets([]); // Clear tickets on logout
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
          notifications={notifications}
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
