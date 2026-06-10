import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
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
  Eye,
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
  Store,
} from "../types";
import { supabase } from "@/supabaseClient";

// --- DATA -------------------------------------------------------------
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

// --- UTILS ------------------------------------------------------------
const getSmartIcon = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes("windows") || l.includes("os")) return <Disc size={16} />;
  if (l.includes("driver") || l.includes("bios") || l.includes("tpm"))
    return <Cpu size={16} />;
  if (l.includes("antivirus") || l.includes("bloatware"))
    return <ShieldCheck size={16} />;
  if (l.includes("wifi")) return <Wifi size={16} />;
  if (l.includes("bluetooth")) return <Wifi size={16} />;
  if (l.includes("speaker") || l.includes("audio")) return <Speaker size={16} />;
  if (l.includes("mic")) return <Mic size={16} />;
  if (l.includes("webcam") || l.includes("camera")) return <Camera size={16} />;
  if (l.includes("lid") || l.includes("sleep") || l.includes("sensor"))
    return <Layout size={16} />;
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
  if (l.includes("battery")) return <Battery size={16} />;
  if (l.includes("stress") || l.includes("ram") || l.includes("gpu"))
    return <Activity size={16} />;
  if (l.includes("fan") || l.includes("thermal")) return <Thermometer size={16} />;
  if (l.includes("hdd") || l.includes("ssd") || l.includes("storage"))
    return <HardDrive size={16} />;
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
  if (
    l.includes("clean") ||
    l.includes("wipe") ||
    l.includes("sticker") ||
    l.includes("lamination")
  )
    return <Sparkles size={16} />;
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

const createInitialReport = (): Report => ({
  id: "",
  date: new Date().toISOString(),
  deviceInfo: { laptopNo: "", customerName: "", technicianName: "", deviceModel: "" },
  checklist: {},
  battery: { chargePercent: "", remainingPercent: "", duration: "", health: "Good" },
  actionRequired: null,
  notes: "",
  status: "Draft",
  progress: 0,
  history: [],
});

interface LaptopReportsProps {
  activeTab: "dashboard" | "data";
  settings?: AppSettings;
  currentUser?: AppUser;
  reports?: Report[];
  setReports?: (reports: Report[]) => void;
  selectedZoneId: string;
  stores?: Store[];
}

// --- HISTORY MODAL (unchanged) -----------------------------------------
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
    doc.setTextColor(67, 56, 202);
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
      const splitDetails = doc.splitTextToSize(item.details, 140);
      doc.text(splitDetails, 45, y + 6);
      const detailsHeight = splitDetails.length * 5;
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`User: ${item.actor.toUpperCase()}`, 45, y + 6 + detailsHeight + 2);
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
              <div className="absolute left-[34px] top-4 bottom-4 w-0.5 bg-slate-200"></div>
              {sortedHistory.map((item) => {
                const isCreated = item.action.includes("Created");
                return (
                  <div key={item.id} className="relative pl-10 group">
                    <div
                      className={`absolute left-[14px] top-4 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10 ${isCreated ? "bg-emerald-500" : "bg-indigo-500"
                        }`}
                    ></div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={`font-bold text-sm ${isCreated ? "text-emerald-700" : "text-slate-800"
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

// --- MAIN COMPONENT ---------------------------------------------------
export default function LaptopReports({
  activeTab,
  settings,
  currentUser,
  reports = [],
  setReports,
  selectedZoneId,
  stores = [],
}: LaptopReportsProps) {
  const isTechnician = currentUser?.role === "TECHNICIAN";
  const technicianName = currentUser?.name || "";
  const [internalView, setInternalView] = useState<"list" | "editor">("list");
  const [currentReport, setCurrentReport] = useState<Report>({
    ...createInitialReport(),
    deviceInfo: {
      ...createInitialReport().deviceInfo,
      technicianName: isTechnician ? technicianName : "",
    },
  });
  const [showHistory, setShowHistory] = useState(false);
  const [laptopNoError, setLaptopNoError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTech, setFilterTech] = useState(isTechnician ? technicianName : "All");
  const [filterDealer, setFilterDealer] = useState("All");
  const [filterAction, setFilterAction] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const scrollPositionRef = useRef(0);
  const isReturningToListRef = useRef(false);
  const lastEditedReportIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeTab === "data") setInternalView("list");
  }, [activeTab]);

  useLayoutEffect(() => {
    if (internalView === "list" && isReturningToListRef.current) {
      const reportId = lastEditedReportIdRef.current;
      requestAnimationFrame(() => {
        if (reportId) {
          const el = document.getElementById(`report-card-${reportId}`);
          if (el) {
            el.scrollIntoView({ behavior: "auto", block: "center" });
          } else {
            window.scrollTo({ top: scrollPositionRef.current, behavior: "auto" });
          }
        }
        isReturningToListRef.current = false;
      });
    }
  }, [internalView]);
  const visibleReports = useMemo(() => {
    if (!isTechnician) return reports;
    let currentStoreId: string | undefined = currentUser?.storeId;
    if (!currentStoreId && settings?.teamMembers) {
      const techMember = settings.teamMembers.find(m => m.name === technicianName && m.role === "TECHNICIAN");
      currentStoreId = techMember?.storeId;
    }

    if (!currentStoreId) {
      return reports.filter((report) => report.deviceInfo.technicianName === technicianName);
    }
    const sameStoreTechNames = settings?.teamMembers
      ?.filter(m => m.role === "TECHNICIAN" && m.storeId === currentStoreId)
      .map(m => m.name) ?? [];

    if (sameStoreTechNames.length === 0) {
      return reports.filter((report) => report.deviceInfo.technicianName === technicianName);
    }
    return reports.filter((report) => sameStoreTechNames.includes(report.deviceInfo.technicianName));
  }, [reports, isTechnician, technicianName, currentUser?.storeId, settings?.teamMembers]);

  const zoneFilteredReports = useMemo(() => {
    if (selectedZoneId === "all") return visibleReports;
    return visibleReports.filter((r) => r.zoneId === selectedZoneId);
  }, [visibleReports, selectedZoneId]);

  const dashboardData = useMemo(() => {
    const dealerStats: Record<string, { total: number; issues: number; passRate: number }> = {};
    const techStats: Record<string, { total: number; avgProgress: number }> = {};
    let totalIssues = 0;
    zoneFilteredReports.forEach((r) => {
      const dealer = r.deviceInfo.customerName || "Unknown Dealer";
      const tech = r.deviceInfo.technicianName || "Unassigned";
      const hasIssue = !!r.actionRequired;
      if (!dealerStats[dealer]) dealerStats[dealer] = { total: 0, issues: 0, passRate: 0 };
      dealerStats[dealer].total += 1;
      if (hasIssue) {
        dealerStats[dealer].issues += 1;
        totalIssues += 1;
      }
      if (!techStats[tech]) techStats[tech] = { total: 0, avgProgress: 0 };
      techStats[tech].total += 1;
      techStats[tech].avgProgress += r.progress;
    });
    const dealerList = Object.keys(dealerStats)
      .map((name) => ({
        name,
        total: dealerStats[name].total,
        issues: dealerStats[name].issues,
        passed: dealerStats[name].total - dealerStats[name].issues,
        defectRate: Math.round((dealerStats[name].issues / dealerStats[name].total) * 100),
        passRate: Math.round(((dealerStats[name].total - dealerStats[name].issues) / dealerStats[name].total) * 100),
      }))
      .sort((a, b) => b.issues - a.issues);
    const techList = Object.keys(techStats)
      .map((name) => ({
        name,
        total: techStats[name].total,
        efficiency: Math.round(techStats[name].avgProgress / techStats[name].total),
      }))
      .sort((a, b) => b.total - a.total);
    return { dealerList, techList, totalReports: zoneFilteredReports.length, totalIssues };
  }, [zoneFilteredReports]);

  const filteredReports = useMemo(() => {
    return zoneFilteredReports.filter((r) => {
      const matchesSearch = r.deviceInfo.laptopNo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTech = filterTech === "All" || r.deviceInfo.technicianName === filterTech;
      const matchesDealer = filterDealer === "All" || r.deviceInfo.customerName === filterDealer;
      const matchesAction = filterAction === "All" || r.actionRequired === filterAction;
      const matchesStatus = filterStatus === "All" || r.status === filterStatus;
      let matchesDate = true;
      if (filterDateFrom || filterDateTo) {
        const reportDateOnly = new Date(r.date).toLocaleDateString('en-CA');
        if (filterDateFrom && reportDateOnly < filterDateFrom) {
          matchesDate = false;
        }
        if (matchesDate && filterDateTo && reportDateOnly > filterDateTo) {
          matchesDate = false;
        }
      }
      return matchesSearch && matchesTech && matchesDealer && matchesAction && matchesStatus && matchesDate;
    });
  }, [zoneFilteredReports, searchTerm, filterTech, filterDealer, filterAction, filterStatus, filterDateFrom, filterDateTo]);

  const handleChecklistToggle = (itemId: string, status: "pass" | "fail") => {
    setCurrentReport((prev) => {
      const newVal = prev.checklist[itemId] === status ? null : status;
      const newChecklist = { ...prev.checklist, [itemId]: newVal };
      const totalItems = CHECKLIST_DATA.reduce((acc, cat) => acc + cat.items.length, 0);
      const checkedItems = Object.values(newChecklist).filter((v) => v !== null).length;
      const progress = Math.round((checkedItems / totalItems) * 100);
      if (progress === 100 && prev.progress < 100) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
      const hasFailures = Object.values(newChecklist).includes("fail");
      const actionRequired = hasFailures ? prev.actionRequired || "Return to Dealers" : null;
      return { ...prev, checklist: newChecklist, progress, actionRequired };
    });
  };
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 21;

  // Reset page on filter change - add to existing useEffects area:
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterTech, filterDealer, filterAction, filterStatus, filterDateFrom, filterDateTo]);

  const totalPages = Math.ceil(filteredReports.length / PAGE_SIZE);
  const pagedReports = filteredReports.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
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

  const fetchReportsFromSupabase = async (zoneId?: string) => {
    if (!supabase) return [];
    try {
      let query = supabase.from("laptop_reports").select("*").order("created_at", { ascending: false });
      if (zoneId && zoneId !== "all") query = query.eq("zone_id", zoneId);
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

  const deleteReportFromSupabase = async (id: string) => {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from("laptop_reports").delete().eq("id", id);
      return !error;
    } catch {
      return false;
    }
  };

  const handleSaveReport = async () => {
    if (!currentReport.deviceInfo.laptopNo) return alert("Laptop No is required");
    if (laptopNoError) return alert("Cannot save: " + laptopNoError);
    const reportId = currentReport.id || `report-${Date.now()}`;
    const original = reports.find((r) => r.id === reportId);
    let reportToSave: Report;
    const getTechnicianZoneId = (): string | undefined => {
      if (!currentReport.deviceInfo.technicianName) return undefined;
      const technician = settings?.teamMembers?.find((m) => m.name === currentReport.deviceInfo.technicianName);
      if (!technician) return undefined;
      if (technician.zoneId) return technician.zoneId;
      if (technician.storeId && stores && stores.length > 0) {
        const techStore = stores.find((s) => s.id === technician.storeId);
        if (techStore?.zoneId) return techStore.zoneId;
      }
      if (currentUser?.name === technician.name) {
        if (currentUser.zoneId) return currentUser.zoneId;
        if (currentUser.storeId && stores && stores.length > 0) {
          const userStore = stores.find((s) => s.id === currentUser.storeId);
          if (userStore?.zoneId) return userStore.zoneId;
        }
      }
      return undefined;
    };
    if (original) {
      const changes: string[] = [];
      if (original.progress !== currentReport.progress) changes.push(`Progress: ${original.progress}% → ${currentReport.progress}%`);
      if (original.status !== currentReport.status) changes.push(`Status: ${original.status} → ${currentReport.status}`);
      if (original.actionRequired !== currentReport.actionRequired) changes.push(`Action: ${original.actionRequired || "None"} → ${currentReport.actionRequired || "None"}`);
      if (original.notes !== currentReport.notes) {
        const originalNote = original.notes || "No notes";
        const newNote = currentReport.notes || "No notes";
        const truncateNote = (note: string) => (note.length > 50 ? note.substring(0, 47) + "..." : note);
        if (originalNote === "No notes" && newNote !== "No notes") changes.push(`Notes added: "${truncateNote(newNote)}"`);
        else if (originalNote !== "No notes" && newNote === "No notes") changes.push(`Notes removed`);
        else changes.push(`Notes updated: "${truncateNote(originalNote)}" → "${truncateNote(newNote)}"`);
      }
      if (original.deviceInfo.customerName !== currentReport.deviceInfo.customerName) {
        const originalDealer = original.deviceInfo.customerName || "Unassigned";
        const newDealer = currentReport.deviceInfo.customerName || "Unassigned";
        changes.push(`Dealer: ${originalDealer} → ${newDealer}`);
      }
      if (original.deviceInfo.technicianName !== currentReport.deviceInfo.technicianName) {
        const originalTech = original.deviceInfo.technicianName || "Unassigned";
        const newTech = currentReport.deviceInfo.technicianName || "Unassigned";
        changes.push(`Technician: ${originalTech} → ${newTech}`);
      }
      if (original.battery.health !== currentReport.battery.health) {
        changes.push(`Battery Health: ${original.battery.health} → ${currentReport.battery.health}`);
      }
      const details = changes.length > 0 ? changes.join(", ") : "Report updated with no visible changes";
      const historyEntry: ReportHistory = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        date: new Date().toLocaleString(),
        actor: currentUser?.name || "Unknown User",
        action: changes.length > 0 ? "Report Updated" : "Report Saved",
        details: details,
      };
      const technicianZoneId = getTechnicianZoneId();
      reportToSave = {
        ...currentReport,
        id: reportId,
        date: original.date,  // ← LOCK to original creation date
        history: [...(currentReport.history || []), historyEntry],
        status: currentReport.progress === 100 ? "Completed" : currentReport.status,
        zoneId: technicianZoneId || currentReport.zoneId,
      };
    } else {
      const details = `New report created. Progress: ${currentReport.progress}%. Status: ${currentReport.status || "Draft"}. Dealer: ${currentReport.deviceInfo.customerName || "Unassigned"}, Technician: ${currentReport.deviceInfo.technicianName || "Unassigned"}`;
      const historyEntry: ReportHistory = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        date: new Date().toLocaleString(),
        actor: currentUser?.name || "Unknown User",
        action: "Report Created",
        details: details,
      };
      const technicianZoneId = getTechnicianZoneId();
      reportToSave = {
        ...currentReport,
        id: reportId,
        history: [historyEntry],
        status: currentReport.progress === 100 ? "Completed" : "Draft",
        zoneId: technicianZoneId || currentReport.zoneId || (selectedZoneId !== "all" ? selectedZoneId : undefined),
      };
    }
    const savedReport = await saveReportToSupabase(reportToSave);
    if (savedReport) {
      if (setReports) {
        const existingIndex = reports.findIndex((r) => r.id === reportToSave.id);
        let updatedReports: Report[];
        if (existingIndex >= 0) {
          updatedReports = [...reports];
          updatedReports[existingIndex] = reportToSave;
        } else {
          updatedReports = [reportToSave, ...reports];
        }
        setReports(updatedReports);
      }
      setCurrentReport({
        ...createInitialReport(),
        deviceInfo: { ...createInitialReport().deviceInfo, technicianName: isTechnician ? technicianName : "" },
      });
      isReturningToListRef.current = true;
      setInternalView("list");
      alert("Report saved successfully!");
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
    doc.setFillColor(67, 56, 202);
    doc.rect(0, 0, pageWidth, 25, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Laptop QC Summary Report", 15, 15);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 70, 10);
    doc.text(
      `Tech: ${filterTech} | Dealer: ${filterDealer} | Status: ${filterStatus} | Date: ${filterDateFrom || "Any"} – ${filterDateTo || "Any"}`,
      15, 21
    );
    let y = 35;
    const headers = ["Device No", "Model/Brand", "Date", "Dealer", "Technician", "Progress", "Status", "Action Req.", "Tech Notes"];
    const colWidths = [26, 26, 24, 35, 35, 18, 18, 40, 45];
    const totalWidth = colWidths.reduce((a, b) => a + b, 0);
    const startX = (pageWidth - totalWidth) / 2;
    doc.setFillColor(241, 245, 249);
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
    filteredReports.forEach((report, index) => {
      if (y > 185) { doc.addPage("l"); y = 25; }
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(startX, y - 5, totalWidth, 8, "F");
      }
      currentX = startX;
      doc.text(report.deviceInfo.laptopNo, currentX + 2, y);
      currentX += colWidths[0];
      doc.text(report.deviceInfo.deviceModel || "N/A", currentX + 2, y, { maxWidth: colWidths[1] - 4 });
      currentX += colWidths[1];
      doc.text(new Date(report.date).toLocaleDateString(), currentX + 2, y);
      currentX += colWidths[2];
      doc.text(report.deviceInfo.customerName || "N/A", currentX + 2, y, { maxWidth: colWidths[3] - 4 });
      currentX += colWidths[3];
      doc.text(report.deviceInfo.technicianName || "N/A", currentX + 2, y, { maxWidth: colWidths[4] - 4 });
      currentX += colWidths[4];
      doc.text(`${report.progress}%`, currentX + 2, y);
      currentX += colWidths[5];
      doc.text(report.status, currentX + 2, y);
      currentX += colWidths[6];
      doc.text(report.actionRequired || "None", currentX + 2, y, { maxWidth: colWidths[7] - 4 });
      currentX += colWidths[7];
      const notesText = report.notes && report.notes.trim() !== "" ? report.notes.trim() : "No notes";
      doc.text(notesText, currentX + 2, y, { maxWidth: colWidths[8] - 4 });
      y += 8;
    });
    if (y > 180) doc.addPage("l");
    y += 10;
    doc.setDrawColor(200);
    doc.line(startX, y, startX + totalWidth, y);
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text(`Total Records in this view: ${filteredReports.length}`, startX, y);
    doc.save(`QC_Summary_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExportExcel = () => {
    import("xlsx")
      .then((XLSX) => {
        const headers = [
          "Device No", "Model/Brand", "Date", "Dealer", "Technician",
          "Progress (%)", "Status", "Action Required", "Battery Health",
          "Battery Charge %", "Battery Remaining %", "Battery Duration", "Tech Notes"
        ];
        const rows = filteredReports.map((r) => [
          r.deviceInfo.laptopNo,
          r.deviceInfo.deviceModel || "",
          new Date(r.date).toLocaleDateString("en-IN"),
          r.deviceInfo.customerName || "",
          r.deviceInfo.technicianName || "",
          r.progress,
          r.status,
          r.actionRequired || "None",
          r.battery?.health || "",
          r.battery?.chargePercent || "",
          r.battery?.remainingPercent || "",
          r.battery?.duration || "",
          r.notes || "",
        ]);
        const wsData = [headers, ...rows];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws["!cols"] = [
          { wch: 14 }, { wch: 22 }, { wch: 12 }, { wch: 20 }, { wch: 18 },
          { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 14 },
          { wch: 16 }, { wch: 14 }, { wch: 30 }
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "QC Summary");
        XLSX.writeFile(wb, `QC_Summary_${new Date().toISOString().slice(0, 10)}.xlsx`);
      })
      .catch(() => alert("Excel export failed. Ensure 'xlsx' package is installed."));
  };

  const loadReport = (report: Report) => {
    lastEditedReportIdRef.current = report.id;
    if (isTechnician && report.deviceInfo.technicianName !== technicianName) {
      alert("You can only view your own reports");
      return;
    }
    // Save current scroll position before switching
    scrollPositionRef.current = window.scrollY;
    isReturningToListRef.current = true;
    setCurrentReport({ ...report, history: report.history || [] });
    setInternalView("editor");
  };

  const deleteReport = async (id: string) => {
    const reportToDelete = reports.find((r) => r.id === id);
    if (isTechnician && reportToDelete?.deviceInfo.technicianName !== technicianName) {
      alert("You can only delete your own reports");
      return;
    }
    if (!confirm("Delete this report?")) return;
    const success = await deleteReportFromSupabase(id);
    if (success && setReports) setReports(reports.filter((r) => r.id !== id));
    else if (!success) alert("Failed to delete report. Please try again.");
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterTech("All");
    setFilterDealer("All");
    setFilterAction("All");
    setFilterStatus("All");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  // ========================= DASHBOARD VIEW =============================
  if (activeTab === "dashboard") {
    return (
      <div className="h-full overflow-y-auto p-6 md:p-8 bg-slate-50 space-y-12 custom-scrollbar">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 size={24} className="text-indigo-600" />
              Performance Analytics
            </h1>
            <p className="text-slate-500 text-sm">Quality control metrics and efficiency tracking.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-xs font-bold text-slate-500 shadow-sm">
            Total Records: {dashboardData.totalReports}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-300 transition-colors">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Reports</p>
              <h3 className="text-3xl font-black text-slate-800">{dashboardData.totalReports}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Processed Laptops</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClipboardCheck size={24} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-red-300 transition-colors">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Failed Reports</p>
              <h3 className="text-3xl font-black text-slate-800">{dashboardData.totalIssues}</h3>
              <p className="text-[10px] text-red-400 mt-1 font-bold">Issues Found</p>
            </div>
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-emerald-300 transition-colors">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Passed Reports</p>
              <h3 className="text-3xl font-black text-emerald-600">{dashboardData.totalReports - dashboardData.totalIssues}</h3>
              <p className="text-[10px] text-emerald-500 mt-1 font-bold">Quality Assured</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>
        <div className="border-2 border-indigo-200/60 rounded-3xl p-6 bg-white shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <AlertOctagon size={20} className="text-red-500" /> Dealer Quality Control
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardData.dealerList.map((dealer, idx) => (
              <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg truncate max-w-[150px]" title={dealer.name}>{dealer.name}</h4>
                    <span className="text-xs text-slate-400 font-medium">Dealer Partner</span>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${dealer.defectRate > 20 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {dealer.defectRate > 20 ? "High Defects" : "Good Quality"}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                    <span className="block text-xs font-bold text-slate-400 uppercase">Total</span>
                    <span className="block text-lg font-black text-slate-700">{dealer.total}</span>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                    <span className="block text-xs font-bold text-emerald-600 uppercase">Pass</span>
                    <span className="block text-lg font-black text-emerald-700">{dealer.passed}</span>
                  </div>
                  <div className="bg-red-50 p-2 rounded-lg border border-red-100">
                    <span className="block text-xs font-bold text-red-600 uppercase">Fail</span>
                    <span className="block text-lg font-black text-red-700">{dealer.issues}</span>
                  </div>
                </div>
                <div className="w-full bg-red-100 h-2 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: `${dealer.passRate}%` }}></div>
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
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Wrench size={20} className="text-blue-500" /> Technician Efficiency
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardData.techList.map((tech, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg border border-blue-100">
                    {tech.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700 text-lg">{tech.name}</h4>
                    <p className="text-xs text-slate-400">QC Specialist</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase">Reports Done</span>
                    <span className="text-2xl font-black text-slate-800">{tech.total}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-400 uppercase">Avg Efficiency</span>
                    <span className={`text-2xl font-black ${tech.efficiency >= 90 ? "text-emerald-600" : "text-blue-600"}`}>
                      {tech.efficiency}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                  <div className={`h-full rounded-full ${tech.efficiency >= 90 ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${Math.min(tech.efficiency, 100)}%` }}></div>
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

  // ========================= DATA LIST VIEW (REDESIGNED - COMPACT & FULL PAGE SCROLL) =========================
  if (internalView === "list") {
    return (
      <div className="min-h-screen bg-slate-50 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Header Card - Compact */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 p-2.5 rounded-xl">
                <ClipboardCheck className="text-indigo-600" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Laptop QC Management</h1>
                <p className="text-xs text-slate-500">Create, edit and organize quality check reports</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2"
              >
                <FileDown size={16} /> Excel
              </button>
              <button
                onClick={handleExportFilteredPDF}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2"
              >
                <FileDown size={16} /> PDF
              </button>
              <button
                onClick={() => {
                  scrollPositionRef.current = window.scrollY;
                  isReturningToListRef.current = true;
                  setCurrentReport({
                    ...createInitialReport(),
                    deviceInfo: { ...createInitialReport().deviceInfo, technicianName: isTechnician ? technicianName : "" },
                  });
                  setInternalView("editor");
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2"
              >
                <Plus size={16} /> Add New
              </button>
            </div>
          </div>

          {/* Search + View Toggle Row */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm text-slate-700 placeholder-slate-400 focus:ring-2 ring-indigo-100"
                placeholder="Search by laptop ID..."
              />
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white shadow text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
              >
                <ListIcon size={18} />
              </button>
            </div>
          </div>

          {/* Filters Row - Compact Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filters</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {[filterTech !== "All", filterDealer !== "All", filterAction !== "All", filterStatus !== "All", filterDateFrom, filterDateTo].filter(Boolean).length} active
                </span>
              </div>
              <button onClick={clearAllFilters} className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1">
                <RotateCcw size={12} /> Clear all
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Technician</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><User size={14} /></div>
                  <select
                    value={filterTech}
                    onChange={(e) => setFilterTech(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 appearance-none outline-none focus:ring-2 ring-indigo-100"
                  >
                    {isTechnician ? (
                      <>
                        <option value={technicianName}>{technicianName} (You)</option>
                        {(() => {
                          let currentStoreId: string | undefined = currentUser?.storeId;
                          if (!currentStoreId && settings?.teamMembers) {
                            const techMember = settings.teamMembers.find(m => m.name === technicianName && m.role === "TECHNICIAN");
                            currentStoreId = techMember?.storeId;
                          }
                          if (!currentStoreId) return null;
                          const sameStoreTechs = settings?.teamMembers?.filter(
                            m => m.role === "TECHNICIAN" && m.storeId === currentStoreId && m.name !== technicianName
                          ) ?? [];
                          return sameStoreTechs.map(m => (
                            <option key={m.id} value={m.name}>{m.name}</option>
                          ));
                        })()}
                      </>
                    ) : (
                      <>
                        <option value="All">All Technicians</option>
                        {settings?.teamMembers?.filter((m) => m.role === "TECHNICIAN").map((m) => (
                          <option key={m.id} value={m.name}>{m.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Dealer</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Package size={14} /></div>
                  <select
                    value={filterDealer}
                    onChange={(e) => setFilterDealer(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 appearance-none outline-none focus:ring-2 ring-indigo-100"
                  >
                    <option value="All">All Dealers</option>
                    {settings?.laptopDealers?.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Action</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Zap size={14} /></div>
                  <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 appearance-none outline-none focus:ring-2 ring-indigo-100"
                  >
                    <option value="All">All Actions</option>
                    <option value="Return to Dealers">Return to Dealers</option>
                    <option value="Sent to Service Centre">Sent to Service Centre</option>
                    <option value="Parts Sent to Dealers">Parts Sent to Dealers</option>
                    <option value="Own Services">Own Services</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Activity size={14} /></div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 appearance-none outline-none focus:ring-2 ring-indigo-100"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">From Date</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 ring-indigo-100"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">To Date</label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 ring-indigo-100"
                />
              </div>
            </div>
          </div>

          {/* Reports List - Grid/Table */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pagedReports.map((report) => (
                <div key={report.id} id={`report-card-${report.id}`} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col">
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
                      <h3 className="font-bold text-slate-800">{report.deviceInfo.laptopNo}</h3>
                      <p className="text-xs text-slate-500">{new Date(report.date).toLocaleDateString("en-GB")}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4 flex-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">Technician</span>
                      <span className="font-bold text-slate-700">{report.deviceInfo.technicianName || "N/A"}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">Dealer</span>
                      <span className="font-bold text-slate-700">{report.deviceInfo.customerName || "N/A"}</span>
                    </div>
                    {report.actionRequired && (
                      <div className="mt-3 pt-2 border-t border-slate-50">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Action Required</span>
                        <div className="mt-1 text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-1.5 rounded-lg flex items-start gap-1">
                          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                          {report.actionRequired}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 mb-4 pt-3 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completion</span>
                      <span className={`text-xs font-bold ${getProgressColor(report.progress).split(" ")[0]}`}>{report.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${getProgressColor(report.progress).split(" ")[1]}`} style={{ width: `${report.progress}%` }}></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => loadReport(report)} className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-colors">Edit Report</button>
                    <button onClick={() => deleteReport(report.id)} className="px-3 py-2 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
              {filteredReports.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400">
                  <p>No reports match your filters.</p>
                  <button onClick={clearAllFilters} className="text-indigo-600 text-xs font-bold mt-2 hover:underline">Clear all filters</button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                      <th className="px-6 py-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pagedReports.map((report) => (
                      <tr key={report.id} id={`report-card-${report.id}`} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-bold text-slate-800">{report.deviceInfo.laptopNo}</td>
                        <td className="px-6 py-4 text-slate-500">{new Date(report.date).toLocaleDateString("en-GB")}</td>
                        <td className="px-6 py-4 text-slate-600">{report.deviceInfo.customerName}</td>
                        <td className="px-6 py-4 text-slate-600">{report.deviceInfo.technicianName}</td>
                        <td className="px-6 py-4 w-32">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className={`h-full rounded-full ${getProgressColor(report.progress).split(" ")[1]}`} style={{ width: `${report.progress}%` }}></div>
                            </div>
                            <span className={`text-xs font-bold ${getProgressColor(report.progress).split(" ")[0]}`}>{report.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {report.actionRequired ? (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap border border-red-200 flex items-center gap-1 w-fit uppercase">
                              <AlertTriangle size={10} /> {report.actionRequired}
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap border border-emerald-200 uppercase">Pass</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <button onClick={() => loadReport(report)} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg"><FileText size={16} /></button>
                          <button onClick={() => deleteReport(report.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

              </div>

            </div>
          )}
          {/* Pagination - shared for both views */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm px-4">
              <span className="text-xs text-slate-400 font-medium mr-2">
                Page {currentPage} of {totalPages} ({filteredReports.length} reports)
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                ← Prev
              </button>
              {(() => {
                const pages: (number | string)[] = [];
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (currentPage > 3) pages.push("...");
                  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                    pages.push(i);
                  }
                  if (currentPage < totalPages - 2) pages.push("...");
                  pages.push(totalPages);
                }
                return pages.map((page, idx) =>
                  page === "..." ? (
                    <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-slate-400 font-bold text-sm">…</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page as number)}
                      className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${currentPage === page
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      {page}
                    </button>
                  )
                );
              })()}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========================= EDITOR VIEW =============================
  return (
    <div className="h-full flex flex-col bg-slate-50 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] overflow-hidden">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => setInternalView("list")} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 flex items-center gap-2 transition-colors">
            <RotateCcw size={20} /> <span className="text-sm font-bold hidden sm:inline">Back to List</span>
          </button>
          <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Checking Sheet <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-500 font-mono">{currentReport.deviceInfo.laptopNo || "New Device"}</span>
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 ${currentReport.progress < 50 ? "bg-red-500" : currentReport.progress < 80 ? "bg-amber-500" : currentReport.progress < 100 ? "bg-blue-500" : "bg-emerald-500"}`} style={{ width: `${currentReport.progress}%` }}></div>
              </div>
              <span className={`text-xs font-bold ${currentReport.progress === 100 ? "text-emerald-600" : "text-slate-500"}`}>{currentReport.progress}%</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowHistory(true)} disabled={!currentReport.history || currentReport.history.length === 0} className="px-4 py-2 text-slate-500 hover:text-indigo-600 text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <History size={16} /> <span className="hidden sm:inline">History</span>
          </button>
          <button onClick={() => setCurrentReport({ ...createInitialReport(), id: "" })} className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-bold">Reset</button>
          <button onClick={handleDownloadPDF} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-900 shadow-lg">
            <Download size={16} /> PDF
          </button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 custom-scrollbar">
        <div id="report-container" className="max-w-4xl mx-auto space-y-8 bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 focus-within:ring-2 ring-indigo-100 transition-all">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Laptop No / Serial</label>
              <div className="flex items-center gap-3">
                <Layout className="text-indigo-400" size={20} />
                <div className="w-full relative">
                  <input
                    value={currentReport.deviceInfo.laptopNo}
                    onChange={(e) => {
                      const val = e.target.value;
                      const duplicate = reports.find(
                        (r) => r.deviceInfo.laptopNo.trim().toLowerCase() === val.trim().toLowerCase() && r.id !== currentReport.id
                      );
                      setLaptopNoError(duplicate ? `Already exists (${duplicate.deviceInfo.technicianName || "Unknown"}, ${new Date(duplicate.date).toLocaleDateString("en-GB")})` : null);
                      setCurrentReport({ ...currentReport, deviceInfo: { ...currentReport.deviceInfo, laptopNo: val } });
                    }}
                    className={`bg-transparent w-full font-bold text-slate-700 outline-none text-lg ${laptopNoError ? "text-red-600" : ""}`}
                    placeholder="Enter ID..."
                  />
                  {laptopNoError && (
                    <div className="absolute left-0 top-full mt-1 z-50 bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg whitespace-nowrap flex items-center gap-2">
                      <AlertTriangle size={12} /> {laptopNoError}
                    </div>
                  )}
                </div>              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 focus-within:ring-2 ring-indigo-100 transition-all">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Device Model / Brand</label>
              <div className="flex items-center gap-3">
                <Box className="text-blue-400" size={20} />
                <input value={currentReport.deviceInfo.deviceModel || ""} onChange={(e) => setCurrentReport({ ...currentReport, deviceInfo: { ...currentReport.deviceInfo, deviceModel: e.target.value } })} className="bg-transparent w-full font-bold text-slate-700 outline-none text-lg" placeholder="e.g. HP, Dell, Lenovo..." />
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 focus-within:ring-2 ring-indigo-100 transition-all">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Dealer</label>
              <div className="flex items-center gap-3">
                <User className="text-purple-400" size={20} />
                <div className="relative w-full">
                  <select value={currentReport.deviceInfo.customerName} onChange={(e) => setCurrentReport({ ...currentReport, deviceInfo: { ...currentReport.deviceInfo, customerName: e.target.value } })} className="bg-transparent w-full font-bold text-slate-700 outline-none text-lg appearance-none cursor-pointer pr-4">
                    <option value="">Select Dealer...</option>
                    {settings?.laptopDealers?.map((dealer) => <option key={dealer.id} value={dealer.name}>{dealer.name}</option>)}
                  </select>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronDown size={14} className="text-slate-400" /></div>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 focus-within:ring-2 ring-indigo-100 transition-all">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Technician</label>
              <div className="flex items-center gap-3">
                <User className="text-emerald-400" size={20} />
                {isTechnician ? (
                  <div className="w-full font-bold text-slate-700 text-lg">{technicianName} (You)</div>
                ) : (
                  <div className="relative w-full">
                    <select value={currentReport.deviceInfo.technicianName} onChange={(e) => {
                      const oldTech = currentReport.deviceInfo.technicianName;
                      const newTech = e.target.value;
                      const historyEntry: ReportHistory = { id: Date.now().toString(), timestamp: Date.now(), date: new Date().toLocaleString(), actor: currentUser?.name || "Unknown User", action: "Technician Assigned", details: `Technician changed from ${oldTech || "Unassigned"} to ${newTech || "Unassigned"}` };
                      setCurrentReport({ ...currentReport, deviceInfo: { ...currentReport.deviceInfo, technicianName: newTech }, history: [...(currentReport.history || []), historyEntry] });
                    }} className="bg-transparent w-full font-bold text-slate-700 outline-none text-lg appearance-none cursor-pointer pr-4">
                      <option value="">Select Tech...</option>
                      {settings?.teamMembers?.filter((m) => m.role === "TECHNICIAN").map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                    </select>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronDown size={14} className="text-slate-400" /></div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <hr className="border-slate-100" />

          <section className="space-y-8">
            {CHECKLIST_DATA.map((category) => (
              <div key={category.id}>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div> {category.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.items.map((item) => {
                    const status = currentReport.checklist[item.id];
                    return (
                      <div key={item.id} className="flex gap-2">
                        <button onClick={() => handleChecklistToggle(item.id, "pass")} className={`flex-1 p-4 rounded-2xl border transition-all flex items-center justify-between group ${status === "pass" ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200" : status === "fail" ? "bg-slate-50 border-slate-200 text-slate-400 opacity-50" : "bg-slate-50 border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-white"}`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${status === "pass" ? "bg-white/20" : "bg-white border border-slate-100"}`}>{getSmartIcon(item.label)}</div>
                            <span className="font-bold text-sm">{item.label}</span>
                          </div>
                          {status === "pass" && <Check size={20} className="animate-in zoom-in spin-in-90" />}
                        </button>
                        <button onClick={() => handleChecklistToggle(item.id, "fail")} className={`w-14 rounded-2xl flex items-center justify-center border transition-all ${status === "fail" ? "bg-red-50 border-red-500 text-white shadow-lg shadow-red-200" : "bg-slate-50 border-slate-100 text-slate-300 hover:border-red-200 hover:text-red-400"}`}>
                          <AlertTriangle size={20} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>

          <section className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold flex items-center gap-2"><Zap className="text-yellow-400 fill-current" /> Battery Diagnostics</h3>
                <p className="text-slate-400 text-xs mt-1">Instrument Panel</p>
              </div>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Charge %</label>
                  <input value={currentReport.battery.chargePercent} onChange={(e) => setCurrentReport({ ...currentReport, battery: { ...currentReport.battery, chargePercent: e.target.value } })} className="bg-transparent w-full font-mono text-xl font-bold outline-none text-center text-cyan-300" placeholder="--" />
                </div>
                <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Remaining</label>
                  <input value={currentReport.battery.remainingPercent} onChange={(e) => setCurrentReport({ ...currentReport, battery: { ...currentReport.battery, remainingPercent: e.target.value } })} className="bg-transparent w-full font-mono text-xl font-bold outline-none text-center text-purple-300" placeholder="--" />
                </div>
                <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Duration</label>
                  <input value={currentReport.battery.duration} onChange={(e) => setCurrentReport({ ...currentReport, battery: { ...currentReport.battery, duration: e.target.value } })} className="bg-transparent w-full font-mono text-xl font-bold outline-none text-center text-emerald-300" placeholder="00:00" />
                </div>
                <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm relative">
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Health</label>
                  <select value={currentReport.battery.health} onChange={(e) => setCurrentReport({ ...currentReport, battery: { ...currentReport.battery, health: e.target.value as any } })} className="bg-transparent w-full font-bold outline-none text-center appearance-none text-white text-sm">
                    <option className="text-black">Excellent</option><option className="text-black">Good</option><option className="text-black">Fair</option><option className="text-black">Poor</option><option className="text-black">Replace</option>
                  </select>
                  <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${currentReport.battery.health === "Replace" || currentReport.battery.health === "Poor" ? "bg-red-500" : "bg-green-500"}`}></div>
                </div>
              </div>
            </div>
          </section>

          {Object.values(currentReport.checklist).includes("fail") && (
            <section className="bg-red-50 rounded-3xl p-6 border-2 border-red-100 animate-in slide-in-from-bottom-4">
              <h3 className="text-red-700 font-bold flex items-center gap-2 mb-4"><AlertTriangle size={20} /> Action Required</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["Return to Dealers", "Sent to Service Centre", "Parts Sent to Dealers", "Own Services"].map((action) => (
                  <button key={action} onClick={() => setCurrentReport({ ...currentReport, actionRequired: action })} className={`p-4 rounded-xl font-bold text-sm transition-all ${currentReport.actionRequired === action ? "bg-red-600 text-white shadow-lg shadow-red-200 scale-105" : "bg-white text-red-400 hover:bg-red-100 border border-red-100"}`}>
                    {action}
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Technician Notes</label>
            <textarea value={currentReport.notes} onChange={(e) => setCurrentReport({ ...currentReport, notes: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-100 outline-none resize-none" rows={4} placeholder="Add recheck date & technician name..." />
          </div>

          <div className="hidden print-visible pt-8 flex justify-between">
            <div className="border-t border-slate-300 w-48 pt-2 text-center text-xs font-bold uppercase">Technician Signature</div>
            <div className="border-t border-slate-300 w-48 pt-2 text-center text-xs font-bold uppercase">QC Manager Signature</div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 px-4 md:px-8 z-40 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md p-2 rounded-2xl border-2 border-indigo-200 shadow-2xl">
            <button onClick={handleSaveReport} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.01] transition-all transform flex items-center justify-center gap-3 text-lg">
              <Save size={24} /> Save Report & Finish
            </button>
          </div>
        </div>
      </div>

      <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} history={currentReport.history || []} />
    </div>
  );
}