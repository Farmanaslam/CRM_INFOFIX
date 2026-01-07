import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ClipboardCheck,
  FileText,
  Plus,
  Trash2,
  Save,
  Download,
  RotateCcw,
  Check,
  X,
  AlertTriangle,
  Battery,
  Wifi,
  Monitor,
  Speaker,
  Keyboard,
  MousePointer,
  Camera,
  HardDrive,
  Cpu,
  Thermometer,
  Box,
  Grid,
  List as ListIcon,
  Search,
  User,
  Calendar,
  Zap,
  Layout,
  BarChart3,
  Disc,
  ShieldCheck,
  Mic,
  Plug,
  Activity,
  Wrench,
  Sparkles,
  Clock,
  Package,
  ChevronDown,
  History,
  TrendingUp,
  Target,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  Filter,
  FileDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import confetti from "canvas-confetti";
import { jsPDF } from "jspdf";
// @ts-ignore
import html2pdf from "html2pdf.js";
import {
  AppSettings,
  User as AppUser,
  Report,
  ReportHistory,
  ChecklistCategory,
  ChecklistItem,
  ChecklistState,
} from "../types";
import { supabase } from "@/supabaseClient";
// --- DATA ---

const CHECKLIST_DATA: ChecklistCategory[] = [
  {
    id: "service_install",
    title: "Service & Installation",
    items: [
      { id: "1", label: "1) LAPTOP SERVICE" },
      { id: "2", label: "2) WINDOWS INSTALLATION" },
      { id: "3", label: "3) WINDOWS UPDATE CLOSE" },
      { id: "4", label: "4) TURN ON METERED CONNECTION" },
      { id: "5", label: "5) STORAGE HEALTH TEST" },
      { id: "6", label: "6) STORAGE SPEED TEST" },
      { id: "7", label: "7) DRIVERS (OG)" },
      { id: "8", label: "8) DRIVERS (DRIVER PACK)" },
      { id: "9", label: "9) GOOGLE CHROME INSTALLATION" },
      { id: "10", label: "10) TESTING VIDEO COPIING" },
      { id: "11", label: "11) BIOS UPDATE" },
    ],
  },
  {
    id: "functionality",
    title: "Functionality Checks",
    items: [
      { id: "12", label: "12) BRIGHTNESS UP & DOWN CHECK" },
      { id: "13", label: "13) FUNCTION KEYS WORKING TEST" },
      { id: "14", label: "14) SLEEP & WAKE UP TEST" },
      { id: "15", label: "15) LAPTOP ALL SENSORS TEST" },
      { id: "16", label: "16) BLUETOOTH CONNECTIVITY TEST" },
      { id: "17", label: "17) WIFI RANGE TEST" },
      { id: "18", label: "18) INTERNAL SPEAKER TEST" },
      { id: "19", label: "19) INTERNAL SPEAKER VENT CHECK" },
      { id: "20", label: "20) AUDIO PORT TEST" },
      { id: "21", label: "21) WEBCAM TEST" },
      { id: "22", label: "22) MIC TEST" },
    ],
  },
  {
    id: "input_display",
    title: "Input & Display",
    items: [
      { id: "23", label: "23) TOUCHPAD TEST" },
      { id: "24", label: "24) TOUCHPAD TEST (IN ADAPTER)" },
      { id: "25", label: "25) KEYBOARD TEST" },
      { id: "26", label: "26) KEYBOARD POINTER TEST" },
      { id: "27", label: "27) SCREEN TEST" },
      { id: "28", label: "28) LAPTOP LVDS CABLE TEST" },
      { id: "29", label: "29) TOUCHPAD BUTTON TEST" },
    ],
  },
  {
    id: "ports_conn",
    title: "Ports & Connectivity",
    items: [
      { id: "30", label: "30) USB TYPE-A TEST" },
      { id: "31", label: "31) USB TYPE-C TEST" },
      { id: "32", label: "32) INTERNET PORT TEST" },
      { id: "33", label: "33) HDMI PORT TEST" },
      { id: "34", label: "34) VGA PORT TEST" },
      { id: "35", label: "35) MINI DISPLAY PORT TEST" },
      { id: "36", label: "36) OPTICAL DRIVE TEST" },
      { id: "37", label: "37) eMMC PORT TEST" },
      { id: "38", label: "38) SD CARD READER PORT TEST" },
      { id: "39", label: "39) CHARGING PORT TEST" },
    ],
  },
  {
    id: "system_stress",
    title: "System & Stress Tests",
    items: [
      { id: "40", label: "40) POWER & ALL PHYSICAL TEST" },
      { id: "41", label: "41) BIOS SETUP CONFIGURE" },
      { id: "42", label: "42) TPM CHECK & UPGRADE" },
      { id: "43", label: "43) TOUCHSCREEN TEST" },
      { id: "44", label: "44) START UP TEST" },
      { id: "45", label: "45) BATTERY HEALTH TEST" },
      { id: "46", label: "46) RAM STRESS TEST" },
      { id: "47", label: "47) GPU STRESS TEST" },
      { id: "48", label: "48) BATTERY BACK-UP TEST" },
      { id: "49", label: "49) LAPTOP CHARGING UP TO 100%" },
    ],
  },
  {
    id: "physical_fittings",
    title: "Physical Fittings & Assembly",
    items: [
      { id: "50", label: "50) SATA HDD/SSD ENCLOSURE CHECK" },
      { id: "51", label: "51) HINGES COVERS FITTINGS" },
      { id: "52", label: "52) SCREEN BEZEL FITTINGS (BACK SIDE)" },
      { id: "53", label: "53) HINGES COVERS FITTINGS" },
      { id: "54", label: "54) SCREEN BEZEL FITTINGS (BACK SIDE)" },
      { id: "55", label: "55) C & D PANEL FITTINGS (LEFT SIDE)" },
      { id: "56", label: "56) C & D PANEL FITTINGS (RIGHT SIDE)" },
      { id: "57", label: "57) C & D PANEL FITTINGS (RIGHT SIDE)" },
      { id: "58", label: "58) BACK COVERS FITTINGS" },
    ],
  },
  {
    id: "cosmetic_cleaning",
    title: "Cosmetic & Cleaning",
    items: [
      { id: "59", label: "59) LAMINATION REQ CHECKS (A-PANEL)" },
      { id: "60", label: "60) LAMINATION REQ CHECKS (TOUCHPAD)" },
      { id: "61", label: "61) LAMINATION ACC CHECKS (A-PANEL)" },
      { id: "62", label: "62) LAMINATION ACC CHECKS (TOUCHPAD)" },
      { id: "63", label: "63) ALL PORTS CLEANING" },
      { id: "64", label: "64) LAPTOP CLEANING" },
      { id: "65", label: "65) SCREW CHANGE/REFURBISH" },
      { id: "66", label: "66) ID ALLOCATION & PASTING" },
      { id: "67", label: "67) WARRANTY STICKERS ON EXTERNAL BATTERY" },
      { id: "68", label: "68) CATALOGING REMINDER TO CATALOGER" },
      { id: "69", label: "69) LAPTOP WARP VENT CUTTING" },
    ],
  },
  {
    id: "packaging_final",
    title: "Packaging & Final QC",
    items: [
      { id: "70", label: "70) ADAPTER ID PASTING" },
      { id: "71", label: "71) CHARGER CLEANING WITH POWER CORD" },
      { id: "72", label: "72) CHECK SYSTEM DATE & TIME" },
      { id: "73", label: "73) WINDOWS ACTIVATION" },
      { id: "74", label: "74) MS OFFICE INSTALLATION" },
      { id: "75", label: "75) EXPENSE SHEET RECONCILIATION" },
      { id: "76", label: "76) QC/REPORT CREATION" },
      { id: "78", label: "78) ADAPTER PACKAGING" },
      { id: "79", label: "79) LAPTOP PACKAGING" },
      { id: "80", label: "80) C & D PANEL FITTINGS (RIGHT SIDE)" },
    ],
  },
];

// --- UTILS ---

const getSmartIcon = (label: string) => {
  const l = label.toLowerCase();

  // Service
  if (l.includes("windows") || l.includes("os")) return <Disc size={16} />;
  if (l.includes("driver") || l.includes("bios") || l.includes("tpm"))
    return <Cpu size={16} />;
  if (l.includes("antivirus") || l.includes("bloatware"))
    return <ShieldCheck size={16} />;

  // Functionality
  if (l.includes("wifi")) return <Wifi size={16} />;
  if (l.includes("bluetooth")) return <Wifi size={16} />;
  if (l.includes("speaker") || l.includes("audio"))
    return <Speaker size={16} />;
  if (l.includes("mic")) return <Mic size={16} />;
  if (l.includes("webcam") || l.includes("camera")) return <Camera size={16} />;
  if (l.includes("lid") || l.includes("sleep") || l.includes("sensor"))
    return <Layout size={16} />;

  // Input & Display
  if (l.includes("keyboard")) return <Keyboard size={16} />;
  if (l.includes("touchpad") || l.includes("gesture"))
    return <MousePointer size={16} />;
  if (
    l.includes("screen") ||
    l.includes("pixel") ||
    l.includes("display") ||
    l.includes("brightness")
  )
    return <Monitor size={16} />;
  if (l.includes("touch")) return <MousePointer size={16} />;

  // Ports
  if (
    l.includes("usb") ||
    l.includes("hdmi") ||
    l.includes("port") ||
    l.includes("jack") ||
    l.includes("sd") ||
    l.includes("vga")
  )
    return <Plug size={16} />;
  if (l.includes("charging") || l.includes("power")) return <Zap size={16} />;

  // Stress
  if (l.includes("battery")) return <Battery size={16} />;
  if (l.includes("stress") || l.includes("ram") || l.includes("gpu"))
    return <Activity size={16} />;
  if (l.includes("fan") || l.includes("thermal"))
    return <Thermometer size={16} />;
  if (l.includes("hdd") || l.includes("ssd") || l.includes("storage"))
    return <HardDrive size={16} />;

  // Physical
  if (
    l.includes("hinge") ||
    l.includes("screw") ||
    l.includes("feet") ||
    l.includes("gap") ||
    l.includes("bezel") ||
    l.includes("panel") ||
    l.includes("fitting")
  )
    return <Wrench size={16} />;

  // Cosmetic
  if (
    l.includes("clean") ||
    l.includes("wipe") ||
    l.includes("sticker") ||
    l.includes("lamination")
  )
    return <Sparkles size={16} />;

  // Packaging
  if (l.includes("date") || l.includes("time")) return <Clock size={16} />;
  if (
    l.includes("pack") ||
    l.includes("accessory") ||
    l.includes("adapter") ||
    l.includes("id pasting")
  )
    return <Package size={16} />;

  return <ClipboardCheck size={16} />;
};

const getProgressColor = (progress: number) => {
  if (progress === 100) return "text-emerald-600 bg-emerald-500";
  if (progress >= 80) return "text-blue-600 bg-blue-500";
  if (progress >= 50) return "text-amber-600 bg-amber-500";
  return "text-red-600 bg-red-500";
};

const INITIAL_REPORT: Report = {
  id: "",
  date: new Date().toISOString(),
  deviceInfo: { laptopNo: "", customerName: "", technicianName: "" },
  checklist: {},
  battery: {
    chargePercent: "",
    remainingPercent: "",
    duration: "",
    health: "Good",
  },
  actionRequired: null,
  notes: "",
  status: "Draft",
  progress: 0,
  history: [],
};

interface LaptopReportsProps {
  activeTab: "dashboard" | "data";
  settings?: AppSettings;
  currentUser?: AppUser;
  reports?: Report[];
  setReports?: (reports: Report[]) => void;
  // Fix: Added missing selectedZoneId property to interface
  selectedZoneId: string;
}

// --- COMPONENTS ---

// History Modal Component
const HistoryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  history: ReportHistory[];
}> = ({ isOpen, onClose, history }) => {
  if (!isOpen) return null;

  const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

  const downloadHistoryPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(67, 56, 202); // Indigo-700
    doc.text("Laptop Report Audit Log", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.setDrawColor(200);
    doc.line(14, 32, 196, 32);

    let y = 40;

    sortedHistory.forEach((item, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      const dateParts = item.date.split(", ");
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(dateParts[0], 14, y);
      doc.text(dateParts[1] || "", 14, y + 5);

      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.text(item.action, 45, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(50);
      // Simple word wrap
      const splitDetails = doc.splitTextToSize(item.details, 140);
      doc.text(splitDetails, 45, y + 6);

      const detailsHeight = splitDetails.length * 5;

      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(
        `User: ${item.actor.toUpperCase()}`,
        45,
        y + 6 + detailsHeight + 2
      );

      // Draw line connecting items
      if (index < sortedHistory.length - 1) {
        doc.setDrawColor(220);
        doc.setLineWidth(0.5);
        // doc.line(38, y + 2, 38, y + 15 + detailsHeight); // Optional visual line
      }

      y += 15 + detailsHeight;
    });

    doc.save("laptop_report_history.pdf");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <History size={20} />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Report History</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadHistoryPDF}
              className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors text-sm font-bold"
            >
              <Download size={16} /> PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto bg-slate-50/50 custom-scrollbar flex-1">
          {sortedHistory.length > 0 ? (
            <div className="space-y-6 relative pl-4">
              {/* Vertical line */}
              <div className="absolute left-[34px] top-4 bottom-4 w-0.5 bg-slate-200"></div>

              {sortedHistory.map((item, index) => {
                const isCreated = item.action.includes("Created");
                const dateParts = item.date.split(", "); // Assuming 'MM/DD/YYYY, HH:MM:SS PM' format roughly

                return (
                  <div key={item.id} className="relative pl-10 group">
                    {/* Dot */}
                    <div
                      className={`absolute left-[14px] top-4 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10 ${
                        isCreated ? "bg-emerald-500" : "bg-indigo-500"
                      }`}
                    ></div>

                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={`font-bold text-sm ${
                            isCreated ? "text-emerald-700" : "text-slate-800"
                          }`}
                        >
                          {item.action}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {item.date}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 mb-3 leading-relaxed whitespace-pre-wrap">
                        {item.details}
                      </p>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <User size={10} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {item.actor.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">
              <History size={48} className="mx-auto mb-4 opacity-20" />
              <p>No history available for this report.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Fix: Added selectedZoneId to destructuring
export default function LaptopReports({
  activeTab,
  settings,
  currentUser,
  reports = [],
  setReports,
  selectedZoneId,
}: LaptopReportsProps) {
  // internalView controls List vs Editor inside the Data tab
  const [internalView, setInternalView] = useState<"list" | "editor">("list");

  const [currentReport, setCurrentReport] = useState<Report>(INITIAL_REPORT);
  const [showHistory, setShowHistory] = useState(false);

  // UI State
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter States
  const [filterTech, setFilterTech] = useState("All");
  const [filterDealer, setFilterDealer] = useState("All");
  const [filterAction, setFilterAction] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // Reset internal view when switching main tabs
  useEffect(() => {
    if (activeTab === "data") {
      setInternalView("list");
    }
  }, [activeTab]);
  // Inside the component, after useState declarations:

  // Fetch reports on mount and zone change

  useEffect(() => {
    const loadReports = async () => {
      const fetchedReports = await fetchReportsFromSupabase(selectedZoneId);
      if (setReports && fetchedReports.length >= 0) {
        setReports(fetchedReports);
      }
    };

    loadReports();
  }, [selectedZoneId]);

  // Realtime subscription
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("laptop-reports-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "laptop_reports" },
        async () => {
          const fetchedReports = await fetchReportsFromSupabase(selectedZoneId);
          if (setReports) setReports(fetchedReports);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedZoneId]);

  // Fix: Filter reports by zone before analytics and listing
  const zoneFilteredReports = useMemo(() => {
    if (selectedZoneId === "all") return reports;
    return reports.filter((r) => r.zoneId === selectedZoneId);
  }, [reports, selectedZoneId]);

  // --- ANALYTICS DATA ---
  const dashboardData = useMemo(() => {
    // 1. Dealer Stats
    const dealerStats: Record<
      string,
      { total: number; issues: number; passRate: number }
    > = {};
    // 2. Tech Stats
    const techStats: Record<string, { total: number; avgProgress: number }> =
      {};

    let totalIssues = 0;

    // Fix: Use zoneFilteredReports for dashboard data
    zoneFilteredReports.forEach((r) => {
      const dealer = r.deviceInfo.customerName || "Unknown Dealer";
      const tech = r.deviceInfo.technicianName || "Unassigned";
      const hasIssue = !!r.actionRequired;

      // Dealer Aggregation
      if (!dealerStats[dealer])
        dealerStats[dealer] = { total: 0, issues: 0, passRate: 0 };
      dealerStats[dealer].total += 1;
      if (hasIssue) {
        dealerStats[dealer].issues += 1;
        totalIssues += 1;
      }

      // Tech Aggregation
      if (!techStats[tech]) techStats[tech] = { total: 0, avgProgress: 0 };
      techStats[tech].total += 1;
      techStats[tech].avgProgress += r.progress; // Sum for now
    });

    // Finalize Dealer Stats
    const dealerList = Object.keys(dealerStats)
      .map((name) => ({
        name,
        total: dealerStats[name].total,
        issues: dealerStats[name].issues,
        passed: dealerStats[name].total - dealerStats[name].issues, // Explicit Passed Count
        defectRate: Math.round(
          (dealerStats[name].issues / dealerStats[name].total) * 100
        ),
        passRate: Math.round(
          ((dealerStats[name].total - dealerStats[name].issues) /
            dealerStats[name].total) *
            100
        ),
      }))
      .sort((a, b) => b.issues - a.issues); // Sort by issues descending for "Issues facing"

    // Finalize Tech Stats
    const techList = Object.keys(techStats)
      .map((name) => ({
        name,
        total: techStats[name].total,
        efficiency: Math.round(
          techStats[name].avgProgress / techStats[name].total
        ),
      }))
      .sort((a, b) => b.total - a.total);

    return {
      dealerList,
      techList,
      totalReports: zoneFilteredReports.length,
      totalIssues,
    };
  }, [zoneFilteredReports]);

  // --- FILTERED REPORTS ---
  const filteredReports = useMemo(() => {
    // Fix: Use zoneFilteredReports as base
    return zoneFilteredReports.filter((r) => {
      const matchesSearch = r.deviceInfo.laptopNo
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesTech =
        filterTech === "All" || r.deviceInfo.technicianName === filterTech;
      const matchesDealer =
        filterDealer === "All" || r.deviceInfo.customerName === filterDealer;
      const matchesAction =
        filterAction === "All" || r.actionRequired === filterAction;
      const matchesStatus = filterStatus === "All" || r.status === filterStatus;

      return (
        matchesSearch &&
        matchesTech &&
        matchesDealer &&
        matchesAction &&
        matchesStatus
      );
    });
  }, [
    zoneFilteredReports,
    searchTerm,
    filterTech,
    filterDealer,
    filterAction,
    filterStatus,
  ]);

  // --- EDITOR LOGIC ---

  const handleChecklistToggle = (itemId: string, status: "pass" | "fail") => {
    setCurrentReport((prev) => {
      const newVal = prev.checklist[itemId] === status ? null : status;
      const newChecklist = { ...prev.checklist, [itemId]: newVal };

      // Calculate Progress
      const totalItems = CHECKLIST_DATA.reduce(
        (acc, cat) => acc + cat.items.length,
        0
      );
      const checkedItems = Object.values(newChecklist).filter(
        (v) => v !== null
      ).length;
      const progress = Math.round((checkedItems / totalItems) * 100);

      // Confetti check
      if (progress === 100 && prev.progress < 100) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }

      // Check Failures
      const hasFailures = Object.values(newChecklist).includes("fail");
      const actionRequired = hasFailures
        ? prev.actionRequired || "Return to Dealers"
        : null;

      return { ...prev, checklist: newChecklist, progress, actionRequired };
    });
  };
  const saveReportToSupabase = async (report: Report) => {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from("laptop_reports")
        .upsert({
          id: report.id,
          date: report.date,
          device_info: report.deviceInfo,
          checklist: report.checklist,
          battery: report.battery,
          action_required: report.actionRequired,
          notes: report.notes,
          status: report.status,
          progress: report.progress,
          history: report.history || [],
          zone_id: report.zoneId,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Error saving:", err);
      return null;
    }
  };

  // Fetch reports from Supabase
  const fetchReportsFromSupabase = async (zoneId?: string) => {
    if (!supabase) return [];

    try {
      let query = supabase
        .from("laptop_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (zoneId && zoneId !== "all") {
        query = query.eq("zone_id", zoneId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((r: any) => ({
        id: r.id,
        date: r.date,
        deviceInfo: r.device_info,
        checklist: r.checklist || {},
        battery: r.battery,
        actionRequired: r.action_required,
        notes: r.notes,
        status: r.status,
        progress: r.progress,
        history: r.history || [],
        zoneId: r.zone_id,
      }));
    } catch (err) {
      console.error("Error fetching:", err);
      return [];
    }
  };

  // Delete report from Supabase
  const deleteReportFromSupabase = async (id: string) => {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from("laptop_reports")
        .delete()
        .eq("id", id);

      return !error;
    } catch {
      return false;
    }
  };
  const handleSaveReport = async () => {
    if (!currentReport.deviceInfo.laptopNo)
      return alert("Laptop No is required");

    const original = reports.find((r) => r.id === currentReport.id);
    let details = "";

    if (original) {
      const changes: string[] = [];
      const allItems = CHECKLIST_DATA.flatMap((c) => c.items);

      allItems.forEach((item) => {
        const oldVal = original.checklist[item.id];
        const newVal = currentReport.checklist[item.id];
        if (oldVal !== newVal) {
          const status = newVal
            ? newVal === "pass"
              ? "Pass"
              : "Fail"
            : "Unchecked";
          changes.push(`${item.label} [${status}]`);
        }
      });

      details = `Report updated. Progress: ${
        currentReport.progress
      }%. Status: ${currentReport.status || "Draft"}`;
      if (changes.length > 0) details += `\nChanges: ${changes.join(", ")}`;
    } else {
      details = `New report created for Laptop ${currentReport.deviceInfo.laptopNo}`;
    }

    const historyEntry: ReportHistory = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      date: new Date().toLocaleString(),
      actor: currentUser?.name || "Unknown User",
      action: currentReport.id ? "Report Updated" : "Report Created",
      details: details,
    };

    const reportToSave: Report = {
      ...currentReport,
      id: currentReport.id || Date.now().toString(),
      history: [...(currentReport.history || []), historyEntry],
      status: currentReport.progress === 100 ? "Completed" : "Draft",
      zoneId:
        currentReport.zoneId ||
        (selectedZoneId !== "all" ? selectedZoneId : undefined),
    };

    // SAVE TO SUPABASE
    const savedReport = await saveReportToSupabase(reportToSave);

    if (savedReport) {
      if (setReports) {
        const existingIndex = reports.findIndex(
          (r) => r.id === reportToSave.id
        );
        let updatedReports: Report[];

        if (existingIndex >= 0) {
          updatedReports = [...reports];
          updatedReports[existingIndex] = reportToSave;
        } else {
          updatedReports = [reportToSave, ...reports];
        }

        setReports(updatedReports);
      }

      setInternalView("list");
      setCurrentReport(INITIAL_REPORT);
    } else {
      alert("Failed to save report. Please try again.");
    }
  };
  const handleDownloadPDF = () => {
    const element = document.getElementById("report-container");
    const opt = {
      margin: 5,
      filename: `Laptop_Report_${currentReport.deviceInfo.laptopNo}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
    };
    html2pdf().set(opt).from(element).save();
  };

  const handleExportFilteredPDF = () => {
    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(67, 56, 202); // Indigo-700
    doc.rect(0, 0, pageWidth, 25, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Laptop QC Summary Report", 15, 15);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 70, 10);
    doc.text(
      `Filter View: Tech: ${filterTech}, Dealer: ${filterDealer}, Status: ${filterStatus}`,
      15,
      21
    );

    // Table Setup
    let y = 35;
    const headers = [
      "Device No",
      "Date",
      "Dealer",
      "Technician",
      "Progress",
      "Status",
      "Action Req.",
    ];
    const colWidths = [30, 30, 45, 45, 25, 25, 60];
    const totalWidth = colWidths.reduce((a, b) => a + b, 0);
    const startX = (pageWidth - totalWidth) / 2;

    // Header Row
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(startX, y - 5, totalWidth, 8, "F");
    doc.setTextColor(50);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");

    let currentX = startX;
    headers.forEach((header, i) => {
      doc.text(header, currentX + 2, y);
      currentX += colWidths[i];
    });

    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(70);

    // Data Rows
    filteredReports.forEach((report, index) => {
      if (y > 185) {
        doc.addPage("l");
        y = 25;
      } // Page break

      // Row Stripe
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(startX, y - 5, totalWidth, 8, "F");
      }

      currentX = startX;
      doc.text(report.deviceInfo.laptopNo, currentX + 2, y);
      currentX += colWidths[0];
      doc.text(new Date(report.date).toLocaleDateString(), currentX + 2, y);
      currentX += colWidths[1];
      doc.text(report.deviceInfo.customerName || "N/A", currentX + 2, y, {
        maxWidth: colWidths[2] - 4,
      });
      currentX += colWidths[2];
      doc.text(report.deviceInfo.technicianName || "N/A", currentX + 2, y, {
        maxWidth: colWidths[3] - 4,
      });
      currentX += colWidths[3];
      doc.text(`${report.progress}%`, currentX + 2, y);
      currentX += colWidths[4];
      doc.text(report.status, currentX + 2, y);
      currentX += colWidths[5];
      doc.text(report.actionRequired || "None", currentX + 2, y, {
        maxWidth: colWidths[6] - 4,
      });

      y += 8;
    });

    // Summary Footer
    if (y > 180) doc.addPage("l");
    y += 10;
    doc.setDrawColor(200);
    doc.line(startX, y, startX + totalWidth, y);
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text(
      `Total Records in this view: ${filteredReports.length}`,
      startX,
      y
    );

    doc.save(`QC_Summary_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const loadReport = (report: Report) => {
    // Ensure history array exists for legacy data
    setCurrentReport({
      ...report,
      history: report.history || [],
    });
    setInternalView("editor");
  };

  const deleteReport = async (id: string) => {
    if (!confirm("Delete this report?")) return;

    const success = await deleteReportFromSupabase(id);

    if (success && setReports) {
      setReports(reports.filter((r) => r.id !== id));
    } else if (!success) {
      alert("Failed to delete report. Please try again.");
    }
  };
  // --- RENDERERS ---

  // 1. DASHBOARD VIEW (ANALYTICS)
  if (activeTab === "dashboard") {
    return (
      <div className="h-full overflow-y-auto p-6 md:p-8 bg-slate-50 space-y-12 custom-scrollbar">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 size={24} className="text-indigo-600" />
              Performance Analytics
            </h1>
            <p className="text-slate-500 text-sm">
              Quality control metrics and efficiency tracking.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-xs font-bold text-slate-500 shadow-sm">
            Total Records: {dashboardData.totalReports}
          </div>
        </div>

        {/* KPI CARDS (TOTAL, FAILED, PASSED) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-300 transition-colors">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Total Reports
              </p>
              <h3 className="text-3xl font-black text-slate-800">
                {dashboardData.totalReports}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                Processed Laptops
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClipboardCheck size={24} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-red-300 transition-colors">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Failed Reports
              </p>
              <h3 className="text-3xl font-black text-slate-800">
                {dashboardData.totalIssues}
              </h3>
              <p className="text-[10px] text-red-400 mt-1 font-bold">
                Issues Found
              </p>
            </div>
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-emerald-300 transition-colors">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Passed Reports
              </p>
              <h3 className="text-3xl font-black text-emerald-600">
                {dashboardData.totalReports - dashboardData.totalIssues}
              </h3>
              <p className="text-[10px] text-emerald-500 mt-1 font-bold">
                Quality Assured
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>

        {/* DEALER QUALITY CONTROL GRID */}
        <div className="border-2 border-indigo-200/60 rounded-3xl p-6 bg-white shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <AlertOctagon size={20} className="text-red-500" /> Dealer Quality
            Control
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardData.dealerList.map((dealer, idx) => (
              <div
                key={idx}
                className="bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4
                      className="font-bold text-slate-800 text-lg truncate max-w-[150px]"
                      title={dealer.name}
                    >
                      {dealer.name}
                    </h4>
                    <span className="text-xs text-slate-400 font-medium">
                      Dealer Partner
                    </span>
                  </div>
                  <div
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      dealer.defectRate > 20
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {dealer.defectRate > 20 ? "High Defects" : "Good Quality"}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                    <span className="block text-xs font-bold text-slate-400 uppercase">
                      Total
                    </span>
                    <span className="block text-lg font-black text-slate-700">
                      {dealer.total}
                    </span>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                    <span className="block text-xs font-bold text-emerald-600 uppercase">
                      Pass
                    </span>
                    <span className="block text-lg font-black text-emerald-700">
                      {dealer.passed}
                    </span>
                  </div>
                  <div className="bg-red-50 p-2 rounded-lg border border-red-100">
                    <span className="block text-xs font-bold text-red-600 uppercase">
                      Fail
                    </span>
                    <span className="block text-lg font-black text-red-700">
                      {dealer.issues}
                    </span>
                  </div>
                </div>

                {/* Visual Bar */}
                <div className="w-full bg-red-100 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${dealer.passRate}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold mt-1 text-slate-400">
                  <span>{dealer.passRate}% Pass</span>
                  <span>{dealer.defectRate}% Defect</span>
                </div>
              </div>
            ))}
            {dashboardData.dealerList.length === 0 && (
              <div className="col-span-full text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-400">No dealer data available.</p>
              </div>
            )}
          </div>
        </div>

        {/* TECHNICIAN EFFICIENCY GRID */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Wrench size={20} className="text-blue-500" /> Technician Efficiency
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardData.techList.map((tech, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg border border-blue-100">
                    {tech.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700 text-lg">
                      {tech.name}
                    </h4>
                    <p className="text-xs text-slate-400">QC Specialist</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      Reports Done
                    </span>
                    <span className="text-2xl font-black text-slate-800">
                      {tech.total}
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      Avg Efficiency
                    </span>
                    <span
                      className={`text-2xl font-black ${
                        tech.efficiency >= 90
                          ? "text-emerald-600"
                          : "text-blue-600"
                      }`}
                    >
                      {tech.efficiency}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full ${
                      tech.efficiency >= 90 ? "bg-emerald-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${Math.min(tech.efficiency, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {dashboardData.techList.length === 0 && (
              <div className="col-span-full text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-400">No technician data available.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. DATA MANAGEMENT TAB -> LIST VIEW
  if (internalView === "list") {
    return (
      <div className="space-y-6 h-full flex flex-col bg-slate-50 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
        {/* HERO SECTION */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h1 className="text-3xl font-black mb-2 tracking-tight text-white">
                Laptop QC Management
              </h1>
              <p className="text-slate-400">
                Create, edit, and organize quality check reports.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportFilteredPDF}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/10 backdrop-blur-sm transition-all flex items-center gap-2"
              >
                <FileDown size={20} /> Export List
              </button>
              <button
                onClick={() => {
                  setCurrentReport(INITIAL_REPORT);
                  setInternalView("editor");
                }}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-50 text-white font-bold rounded-2xl shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2"
              >
                <Plus size={20} /> Add New Laptop
              </button>
            </div>
          </div>
        </div>

        {/* TOOLBAR & FILTERS */}
        <div className="bg-white/80 backdrop-blur p-4 rounded-3xl border border-slate-200 shadow-sm shrink-0 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-72">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm text-slate-700 placeholder-slate-400 focus:ring-2 ring-indigo-100"
                placeholder="Search laptop ID..."
              />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "grid"
                    ? "bg-white shadow text-indigo-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "list"
                    ? "bg-white shadow text-indigo-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <ListIcon size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <User size={14} />
              </div>
              <select
                value={filterTech}
                onChange={(e) => setFilterTech(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 appearance-none outline-none focus:ring-2 ring-indigo-50"
              >
                <option value="All">All Technicians</option>
                {settings?.teamMembers?.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
              />
            </div>

            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Package size={14} />
              </div>
              <select
                value={filterDealer}
                onChange={(e) => setFilterDealer(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 appearance-none outline-none focus:ring-2 ring-indigo-50"
              >
                <option value="All">All Dealers</option>
                {settings?.laptopDealers?.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
              />
            </div>

            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Zap size={14} />
              </div>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 appearance-none outline-none focus:ring-2 ring-indigo-50"
              >
                <option value="All">All Actions</option>
                <option value="Return to Dealers">Return to Dealers</option>
                <option value="Sent to Service Centre">
                  Sent to Service Centre
                </option>
                <option value="Parts Sent to Dealers">
                  Parts Sent to Dealers
                </option>
                <option value="Own Services">Own Services</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
              />
            </div>

            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Activity size={14} />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 appearance-none outline-none focus:ring-2 ring-indigo-50"
              >
                <option value="All">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Completed">Completed</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* REPORTS LIST */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col"
                >
                  {report.actionRequired && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10 shadow-sm">
                      ACTION
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 font-bold text-lg">
                      {report.deviceInfo.laptopNo.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">
                        {report.deviceInfo.laptopNo}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {new Date(report.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 flex-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">
                        Technician
                      </span>
                      <span className="font-bold text-slate-700">
                        {report.deviceInfo.technicianName || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">Dealer</span>
                      <span className="font-bold text-slate-700">
                        {report.deviceInfo.customerName || "N/A"}
                      </span>
                    </div>
                    {report.actionRequired && (
                      <div className="mt-3 pt-2 border-t border-slate-50">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Action Required
                        </span>
                        <div className="mt-1 text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-1.5 rounded-lg flex items-start gap-1">
                          <AlertTriangle
                            size={12}
                            className="mt-0.5 shrink-0"
                          />
                          {report.actionRequired}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress Section */}
                  <div className="mt-2 mb-4 pt-3 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Completion
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          getProgressColor(report.progress).split(" ")[0]
                        }`}
                      >
                        {report.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          getProgressColor(report.progress).split(" ")[1]
                        }`}
                        style={{ width: `${report.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => loadReport(report)}
                      className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-colors"
                    >
                      Edit Report
                    </button>
                    <button
                      onClick={() => deleteReport(report.id)}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {filteredReports.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400">
                  <p>No reports match your filters.</p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterTech("All");
                      setFilterDealer("All");
                      setFilterAction("All");
                      setFilterStatus("All");
                    }}
                    className="text-indigo-600 text-xs font-bold mt-2 hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-bold">Device No</th>
                      <th className="px-6 py-4 font-bold">Date</th>
                      <th className="px-6 py-4 font-bold">Dealer</th>
                      <th className="px-6 py-4 font-bold">Technician</th>
                      <th className="px-6 py-4 font-bold">Progress</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 font-bold text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {report.deviceInfo.laptopNo}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(report.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {report.deviceInfo.customerName}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {report.deviceInfo.technicianName}
                        </td>
                        <td className="px-6 py-4 w-32">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  getProgressColor(report.progress).split(
                                    " "
                                  )[1]
                                }`}
                                style={{ width: `${report.progress}%` }}
                              ></div>
                            </div>
                            <span
                              className={`text-xs font-bold ${
                                getProgressColor(report.progress).split(" ")[0]
                              }`}
                            >
                              {report.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {report.actionRequired ? (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap border border-red-200 flex items-center gap-1 w-fit uppercase">
                              <AlertTriangle size={10} />{" "}
                              {report.actionRequired}
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap border border-emerald-200 uppercase">
                              Pass
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => loadReport(report)}
                            className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg"
                          >
                            <FileText size={16} />
                          </button>
                          <button
                            onClick={() => deleteReport(report.id)}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. DATA MANAGEMENT TAB -> EDITOR VIEW
  return (
    <div className="h-full flex flex-col bg-slate-50 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] overflow-hidden">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setInternalView("list")}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 flex items-center gap-2 transition-colors"
          >
            <RotateCcw size={20} />{" "}
            <span className="text-sm font-bold hidden sm:inline">
              Back to List
            </span>
          </button>
          <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Checking Sheet{" "}
              <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-500 font-mono">
                {currentReport.deviceInfo.laptopNo || "New Device"}
              </span>
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    currentReport.progress < 50
                      ? "bg-red-500"
                      : currentReport.progress < 80
                      ? "bg-amber-500"
                      : currentReport.progress < 100
                      ? "bg-blue-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${currentReport.progress}%` }}
                ></div>
              </div>
              <span
                className={`text-xs font-bold ${
                  currentReport.progress === 100
                    ? "text-emerald-600"
                    : "text-slate-500"
                }`}
              >
                {currentReport.progress}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistory(true)}
            disabled={
              !currentReport.history || currentReport.history.length === 0
            }
            className="px-4 py-2 text-slate-500 hover:text-indigo-600 text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <History size={16} />{" "}
            <span className="hidden sm:inline">History</span>
          </button>
          <button
            onClick={() => setCurrentReport({ ...INITIAL_REPORT, id: "" })}
            className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-bold"
          >
            Reset
          </button>
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-900 shadow-lg"
          >
            <Download size={16} /> PDF
          </button>
        </div>
      </header>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 custom-scrollbar">
        <div
          id="report-container"
          className="max-w-4xl mx-auto space-y-8 bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100"
        >
          {/* SECTION A: DEVICE INFO */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 focus-within:ring-2 ring-indigo-100 transition-all">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                Laptop No / Serial
              </label>
              <div className="flex items-center gap-3">
                <Layout className="text-indigo-400" size={20} />
                <input
                  value={currentReport.deviceInfo.laptopNo}
                  onChange={(e) =>
                    setCurrentReport({
                      ...currentReport,
                      deviceInfo: {
                        ...currentReport.deviceInfo,
                        laptopNo: e.target.value,
                      },
                    })
                  }
                  className="bg-transparent w-full font-bold text-slate-700 outline-none text-lg"
                  placeholder="Enter ID..."
                />
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 focus-within:ring-2 ring-indigo-100 transition-all">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                Dealer
              </label>
              <div className="flex items-center gap-3">
                <User className="text-purple-400" size={20} />
                <div className="relative w-full">
                  <select
                    value={currentReport.deviceInfo.customerName}
                    onChange={(e) =>
                      setCurrentReport({
                        ...currentReport,
                        deviceInfo: {
                          ...currentReport.deviceInfo,
                          customerName: e.target.value,
                        },
                      })
                    }
                    className="bg-transparent w-full font-bold text-slate-700 outline-none text-lg appearance-none cursor-pointer pr-4"
                  >
                    <option value="">Select Dealer...</option>
                    {settings?.laptopDealers?.map((dealer) => (
                      <option key={dealer.id} value={dealer.name}>
                        {dealer.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown size={14} className="text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 focus-within:ring-2 ring-indigo-100 transition-all">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                Technician
              </label>
              <div className="flex items-center gap-3">
                <User className="text-emerald-400" size={20} />
                <div className="relative w-full">
                  <select
                    value={currentReport.deviceInfo.technicianName}
                    onChange={(e) =>
                      setCurrentReport({
                        ...currentReport,
                        deviceInfo: {
                          ...currentReport.deviceInfo,
                          technicianName: e.target.value,
                        },
                      })
                    }
                    className="bg-transparent w-full font-bold text-slate-700 outline-none text-lg appearance-none cursor-pointer pr-4"
                  >
                    <option value="">Select Tech...</option>
                    {settings?.teamMembers?.map((member) => (
                      <option key={member.id} value={member.name}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown size={14} className="text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* SECTION B: CHECKLIST */}
          <section className="space-y-8">
            {CHECKLIST_DATA.map((category) => (
              <div key={category.id}>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>{" "}
                  {category.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.items.map((item) => {
                    const status = currentReport.checklist[item.id];
                    return (
                      <div key={item.id} className="flex gap-2">
                        {/* Main Pass Button */}
                        <button
                          onClick={() => handleChecklistToggle(item.id, "pass")}
                          className={`flex-1 p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                            status === "pass"
                              ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200"
                              : status === "fail"
                              ? "bg-slate-50 border-slate-200 text-slate-400 opacity-50"
                              : "bg-slate-50 border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-xl ${
                                status === "pass"
                                  ? "bg-white/20"
                                  : "bg-white border border-slate-100"
                              }`}
                            >
                              {getSmartIcon(item.label)}
                            </div>
                            <span className="font-bold text-sm">
                              {item.label}
                            </span>
                          </div>
                          {status === "pass" && (
                            <Check
                              size={20}
                              className="animate-in zoom-in spin-in-90"
                            />
                          )}
                        </button>

                        {/* Fail Button */}
                        <button
                          onClick={() => handleChecklistToggle(item.id, "fail")}
                          className={`w-14 rounded-2xl flex items-center justify-center border transition-all ${
                            status === "fail"
                              ? "bg-red-50 border-red-500 text-white shadow-lg shadow-red-200"
                              : "bg-slate-50 border-slate-100 text-slate-300 hover:border-red-200 hover:text-red-400"
                          }`}
                        >
                          <AlertTriangle size={20} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>

          {/* SECTION C: BATTERY ANALYSIS */}
          <section className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Zap className="text-yellow-400 fill-current" /> Battery
                  Diagnostics
                </h3>
                <p className="text-slate-400 text-xs mt-1">Instrument Panel</p>
              </div>

              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Charge %
                  </label>
                  <input
                    value={currentReport.battery.chargePercent}
                    onChange={(e) =>
                      setCurrentReport({
                        ...currentReport,
                        battery: {
                          ...currentReport.battery,
                          chargePercent: e.target.value,
                        },
                      })
                    }
                    className="bg-transparent w-full font-mono text-xl font-bold outline-none text-center text-cyan-300"
                    placeholder="--"
                  />
                </div>
                <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Remaining
                  </label>
                  <input
                    value={currentReport.battery.remainingPercent}
                    onChange={(e) =>
                      setCurrentReport({
                        ...currentReport,
                        battery: {
                          ...currentReport.battery,
                          remainingPercent: e.target.value,
                        },
                      })
                    }
                    className="bg-transparent w-full font-mono text-xl font-bold outline-none text-center text-purple-300"
                    placeholder="--"
                  />
                </div>
                <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Duration
                  </label>
                  <input
                    value={currentReport.battery.duration}
                    onChange={(e) =>
                      setCurrentReport({
                        ...currentReport,
                        battery: {
                          ...currentReport.battery,
                          duration: e.target.value,
                        },
                      })
                    }
                    className="bg-transparent w-full font-mono text-xl font-bold outline-none text-center text-emerald-300"
                    placeholder="00:00"
                  />
                </div>
                <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm relative">
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Health
                  </label>
                  <select
                    value={currentReport.battery.health}
                    onChange={(e) =>
                      setCurrentReport({
                        ...currentReport,
                        battery: {
                          ...currentReport.battery,
                          health: e.target.value as any,
                        },
                      })
                    }
                    className="bg-transparent w-full font-bold outline-none text-center appearance-none text-white text-sm"
                  >
                    <option className="text-black">Excellent</option>
                    <option className="text-black">Good</option>
                    <option className="text-black">Fair</option>
                    <option className="text-black">Poor</option>
                    <option className="text-black">Replace</option>
                  </select>
                  <div
                    className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                      currentReport.battery.health === "Replace" ||
                      currentReport.battery.health === "Poor"
                        ? "bg-red-500"
                        : "bg-green-500"
                    }`}
                  ></div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION D: ACTION REQUIRED */}
          {Object.values(currentReport.checklist).includes("fail") && (
            <section className="bg-red-50 rounded-3xl p-6 border-2 border-red-100 animate-in slide-in-from-bottom-4">
              <h3 className="text-red-700 font-bold flex items-center gap-2 mb-4">
                <AlertTriangle size={20} /> Action Required
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  "Return to Dealers",
                  "Sent to Service Centre",
                  "Parts Sent to Dealers",
                  "Own Services",
                ].map((action) => (
                  <button
                    key={action}
                    onClick={() =>
                      setCurrentReport({
                        ...currentReport,
                        actionRequired: action,
                      })
                    }
                    className={`p-4 rounded-xl font-bold text-sm transition-all ${
                      currentReport.actionRequired === action
                        ? "bg-red-600 text-white shadow-lg shadow-red-200 scale-105"
                        : "bg-white text-red-400 hover:bg-red-100 border border-red-100"
                    }`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* SECTION E: FOOTER */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Technician Notes
            </label>
            <textarea
              value={currentReport.notes}
              onChange={(e) =>
                setCurrentReport({ ...currentReport, notes: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
              rows={4}
              placeholder="Additional observations..."
            />
          </div>

          {/* Signatures (Hidden usually, visible on print via CSS media query logic handles by html2pdf mostly but we structure it) */}
          <div className="hidden print-visible pt-8 flex justify-between">
            <div className="border-t border-slate-300 w-48 pt-2 text-center text-xs font-bold uppercase">
              Technician Signature
            </div>
            <div className="border-t border-slate-300 w-48 pt-2 text-center text-xs font-bold uppercase">
              QC Manager Signature
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING SAVE BUTTON FOOTER */}
      <div className="absolute bottom-6 left-0 right-0 px-4 md:px-8 z-40 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md p-2 rounded-2xl border-2 border-indigo-200 shadow-2xl">
            <button
              onClick={handleSaveReport}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.01] transition-all transform flex items-center justify-center gap-3 text-lg"
            >
              <Save size={24} /> Save Report & Finish
            </button>
          </div>
        </div>
      </div>

      {/* History Modal */}
      <HistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={currentReport.history || []}
      />
    </div>
  );
}
