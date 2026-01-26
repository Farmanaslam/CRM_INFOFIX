import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  ShieldAlert,
  Save,
  Trash2,
  Plus,
  Edit2,
  Download,
  Users,
  Database,
  Store as StoreIcon,
  Smartphone,
  ListOrdered,
  AlertTriangle,
  Check,
  X,
  Clock,
  Briefcase,
  ChevronDown,
  Tag,
  Layout,
  Loader2,
  Laptop,
  Phone,
  MapPin,
  Mail,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Camera,
  ShieldCheck,
  Zap,
  UserCheck,
  UserCog,
  Wrench,
  Fingerprint,
  Crown,
  Layers,
  Building2,
  Navigation,
  Globe,
  Headphones,
  BriefcaseIcon,
  StickyNote,
  Upload,
  HardDrive,
  FileJson,
  FileCheck,
  Info,
  Cloud,
  CloudCheck,
  Terminal,
  Copy,
  Activity,
  FileText,
  SettingsIcon,
  UserIcon,
  FileUp,
  CheckCircle2,
} from "lucide-react";
import {
  User,
  Ticket,
  Role,
  SLAConfig,
  AppSettings,
  Store,
  OperationalZone,
  Dealer,
  Customer,
  Task,
  Report,
} from "../types";
import { supabase, isSupabaseConfigured, uploadFile } from "../supabaseClient";

interface SettingsProps {
  currentUser: User;
  tickets: Ticket[];
  onUpdateTickets: (tickets: Ticket[]) => void;
  customers: Customer[];
  onUpdateCustomers: (customers: Customer[]) => void;
  tasks: Task[];
  onUpdateTasks: (tasks: Task[]) => void;
  laptopReports: Report[];
  onUpdateLaptopReports: (reports: Report[]) => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  teamMembers: User[];
  zones: OperationalZone[];
  stores: Store[];
  onRefreshTeamData: () => void;
  workflowsLastFetched?: number;
  onWorkflowsRefresh: () => Promise<void>;
}

// --- SUB-COMPONENTS ---

const AccessDenied = ({ message }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <div className="bg-red-50 p-6 rounded-full mb-6">
      <ShieldAlert size={64} className="text-red-500" />
    </div>
    <h2 className="text-3xl font-bold text-slate-800 mb-4">Access Denied</h2>
    <p className="text-slate-500 max-w-md text-lg">
      {message ||
        "You do not have permission to view this page. Only administrators can modify application settings."}
    </p>
  </div>
);

// --- DEALER MANAGER COMPONENT ---
const DealerManager: React.FC<{
  dealers: Dealer[];
  onUpdate: (dealers: Dealer[]) => void;
  onWorkflowsRefresh: () => Promise<void>;
}> = ({ dealers, onUpdate, onWorkflowsRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
  const [formData, setFormData] = useState<Partial<Dealer>>({
    name: "",
    address: "",
    phone: "",
    serviceTeamPhone: "",
    officePhone: "",
    speciality: "",
    notes: "",
  });

  const handleOpen = (dealer?: Dealer) => {
    if (dealer) {
      setEditingDealer(dealer);
      setFormData({ ...dealer });
    } else {
      setEditingDealer(null);
      setFormData({
        name: "",
        address: "",
        phone: "",
        serviceTeamPhone: "",
        officePhone: "",
        speciality: "",
        notes: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) return;

    try {
      if (editingDealer) {
        console.log(`✏️ Updating laptop dealer: ${editingDealer.id}`);
        // Update existing dealer
        const { error } = await supabase
          .from("workflows")
          .update({
            name: formData.name,
            metadata: {
              address: formData.address,
              phone: formData.phone,
              serviceTeamPhone: formData.serviceTeamPhone,
              officePhone: formData.officePhone,
              speciality: formData.speciality,
              notes: formData.notes,
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingDealer.id);

        if (error) throw error;
        await onWorkflowsRefresh();
        console.log(`✅ Laptop dealer updated in database`);
      } else {
        console.log(`➕ Adding new laptop dealer: ${formData.name}`);
        // Insert new dealer
        const { data, error } = await supabase
          .from("workflows")
          .insert({
            category: "laptopDealers",
            name: formData.name,
            is_system: false,
            metadata: {
              address: formData.address,
              phone: formData.phone,
              serviceTeamPhone: formData.serviceTeamPhone,
              officePhone: formData.officePhone,
              speciality: formData.speciality,
              notes: formData.notes,
            },
            display_order: dealers.length + 1,
          })
          .select()
          .single();

        if (error) throw error;

        console.log(`✅ Laptop dealer added to database:`, data);

        await onWorkflowsRefresh();
      }

      setIsModalOpen(false);
      await onWorkflowsRefresh();
      // Note: Real-time subscription in App.tsx will handle syncing to other windows
    } catch (err: any) {
      console.error("❌ Error saving laptop dealer:", err);
      alert(`Failed to save dealer: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this dealer?")) return;

    try {
      console.log(`🗑️ Deleting laptop dealer: ${id}`);
      const { error } = await supabase.from("workflows").delete().eq("id", id);

      if (error) throw error;

      console.log(`✅ Laptop dealer deleted from database`);
      await onWorkflowsRefresh();
      // Note: Real-time subscription in App.tsx will handle syncing to other windows
    } catch (err: any) {
      console.error("❌ Error deleting laptop dealer:", err);
      alert(`Failed to delete dealer: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Building2 size={20} className="text-indigo-600" />
            Laptop Dealers
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Manage vendor relationships and contact points.
          </p>
        </div>
        <button
          onClick={() => handleOpen()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 font-bold text-sm shadow-lg shadow-indigo-100"
        >
          <Plus size={18} /> Add Dealer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dealers.map((dealer) => (
          <div
            key={dealer.id}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 group hover:border-indigo-300 transition-all relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                  <BriefcaseIcon size={24} />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-lg leading-tight">
                    {dealer.name}
                  </h4>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">
                    {dealer.speciality || "General Dealer"}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpen(dealer)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(dealer.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Phone size={10} className="text-indigo-500" /> Main Contact
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {dealer.phone || "N/A"}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Headphones size={10} className="text-emerald-500" />{" "}
                    Service Team
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {dealer.serviceTeamPhone || "N/A"}
                  </p>
                </div>
              </div>

              {dealer.address && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <MapPin size={10} className="text-rose-500" /> Business
                    Address
                  </p>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed">
                    {dealer.address}
                  </p>
                </div>
              )}

              {dealer.notes && (
                <div className="pt-2 border-t border-slate-50">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <StickyNote size={10} className="text-amber-500" /> Internal
                    Memo
                  </p>
                  <p className="text-xs text-slate-500 italic mt-1 line-clamp-2">
                    {dealer.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
        {dealers.length === 0 && (
          <div className="col-span-full py-12 bg-white border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400">
            <Building2 size={48} className="mb-4 opacity-20" />
            <p className="font-bold">No dealers added yet.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                    {editingDealer ? "Configure Dealer" : "New Dealer Entry"}
                  </h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Enterprise Vendor Protocol
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2.5 hover:bg-white rounded-full text-slate-400 transition-all border border-transparent hover:border-slate-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Dealer Business Name *
                  </label>
                  <input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-50/10 outline-none transition-all"
                    placeholder="e.g. ABC IT Solutions"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Speciality / Trade
                  </label>
                  <input
                    value={formData.speciality}
                    onChange={(e) =>
                      setFormData({ ...formData, speciality: e.target.value })
                    }
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-50/10 outline-none transition-all"
                    placeholder="e.g. Gaming Laptops, Spares"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Primary Number
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                      size={16}
                    />
                    <input
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                      placeholder="+91..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Service Team
                  </label>
                  <div className="relative">
                    <Headphones
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                      size={16}
                    />
                    <input
                      value={formData.serviceTeamPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          serviceTeamPhone: e.target.value,
                        })
                      }
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                      placeholder="Support line"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Office Line
                  </label>
                  <div className="relative">
                    <Building2
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                      size={16}
                    />
                    <input
                      value={formData.officePhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          officePhone: e.target.value,
                        })
                      }
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none"
                      placeholder="Fixed line"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Full Business Address
                </label>
                <div className="relative">
                  <MapPin
                    className="absolute left-4 top-4 text-slate-400"
                    size={18}
                  />
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-50/10 outline-none h-24 resize-none"
                    placeholder="Street, locality, landmark..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Dealer Notes & Terms
                </label>
                <div className="relative">
                  <StickyNote
                    className="absolute left-4 top-4 text-slate-400"
                    size={18}
                  />
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-50/10 outline-none h-32 resize-none"
                    placeholder="Add internal notes about pricing, credit terms, or history..."
                  />
                </div>
              </div>
            </div>

            <div className="px-8 py-6 border-t border-slate-100 bg-white flex gap-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} />{" "}
                {editingDealer ? "Update Profile" : "Initialize Dealer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  zone?: OperationalZone;
  onSave: (zone: OperationalZone, selectedStores: string[]) => void;
  allStores: Store[];
  allMembers: User[];
}

const ZoneModal: React.FC<ZoneModalProps> = ({
  isOpen,
  onClose,
  zone,
  onSave,
  allStores,
  allMembers,
}) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("indigo");
  const [headBranchId, setHeadBranchId] = useState("");
  const [address, setAddress] = useState("");
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"identity" | "hq" | "stores">(
    "identity",
  );

  useEffect(() => {
    if (isOpen) {
      if (zone) {
        setName(zone.name);
        setColor(zone.color || "indigo");
        setHeadBranchId(zone.headBranchId || "");
        setAddress(zone.address || "");
        // Initialize selectedStoreIds with stores already assigned to this zone
        const assignedStoreIds = allStores
          .filter((store) => store.zoneId === zone.id)
          .map((store) => store.id);
        setSelectedStoreIds(assignedStoreIds);
      } else {
        setName("");
        setColor("indigo");
        setHeadBranchId("");
        setAddress("");
        setSelectedStoreIds([]);
      }
      setActiveTab("identity");
    }
  }, [isOpen, zone, allStores]); // Add allStores to dependencies
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    // DON'T generate ID here - let Supabase handle it
    const newZone: OperationalZone = {
      // Don't include id for new zones
      ...(zone && { id: zone.id }),
      name,
      color,
      headBranchId: headBranchId || undefined,
      address: address || undefined,
    };

    onSave(newZone, selectedStoreIds);
    onClose();
  };
  const toggleStore = (storeId: string) => {
    if (selectedStoreIds.includes(storeId)) {
      setSelectedStoreIds(selectedStoreIds.filter((id) => id !== storeId));
    } else {
      setSelectedStoreIds([...selectedStoreIds, storeId]);
    }
  };

  const employeeCount = useMemo(() => {
    if (!zone) return 0;
    return allMembers.filter((m) => m.zoneId === zone.id).length;
  }, [zone, allMembers]);

  const COLORS = [
    { id: "indigo", hex: "bg-indigo-500" },
    { id: "emerald", hex: "bg-emerald-500" },
    { id: "rose", hex: "bg-rose-500" },
    { id: "amber", hex: "bg-amber-500" },
    { id: "purple", hex: "bg-purple-500" },
    { id: "blue", hex: "bg-blue-500" },
    { id: "slate", hex: "bg-slate-500" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh] overflow-hidden border border-white/20">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg bg-${color}-500 transition-colors duration-300`}
            >
              <Layers size={24} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-xl tracking-tight leading-none mb-1">
                {zone ? "Edit Sector" : "New Sector"}
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Operational Configuration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-rose-500 transition-all active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-8 pt-6 pb-2">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(["identity", "hq", "stores"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab
                    ? "bg-white shadow-sm text-slate-800"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab === "identity"
                  ? "Identity"
                  : tab === "hq"
                    ? "Headquarters"
                    : "Assignments"}
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form
          id="zone-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-4 space-y-6"
        >
          {activeTab === "identity" && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">
                  Zone Designation
                </label>
                <div className="relative group">
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. North Region"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:ring-4 ring-indigo-500/5 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">
                  Visual Theme
                </label>
                <div className="flex flex-wrap gap-3">
                  {COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.id)}
                      className={`w-10 h-10 rounded-full ${
                        c.hex
                      } flex items-center justify-center transition-all ${
                        color === c.id
                          ? "ring-4 ring-offset-2 ring-slate-200 scale-110 shadow-lg"
                          : "opacity-70 hover:opacity-100 hover:scale-105"
                      }`}
                    >
                      {color === c.id && (
                        <Check
                          size={16}
                          className="text-white"
                          strokeWidth={3}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {zone && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">
                    Current Workforce
                  </span>
                  <span className="text-lg font-black text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                    {employeeCount}
                  </span>
                </div>
              )}
            </div>
          )}

          {activeTab === "hq" && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">
                  Head Branch
                </label>
                <div className="relative">
                  <Building2
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    value={headBranchId}
                    onChange={(e) => setHeadBranchId(e.target.value)}
                    className="w-full pl-10 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none appearance-none cursor-pointer focus:bg-white focus:border-indigo-500 transition-all"
                  >
                    <option value="">-- No HQ Assigned --</option>
                    {allStores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">
                  HQ Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter full operational address..."
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:ring-4 ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all resize-none h-32"
                />
              </div>
            </div>
          )}

          {activeTab === "stores" && (
            <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Select Linked Stores
                </label>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">
                  {selectedStoreIds.length} Selected
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {allStores.map((store) => {
                  const isSelected = selectedStoreIds.includes(store.id);
                  const isAssignedOther =
                    store.zoneId && store.zoneId !== zone?.id && !isSelected; // Visual cue if store belongs elsewhere

                  return (
                    <div
                      key={store.id}
                      onClick={() => toggleStore(store.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                          : "bg-white border-slate-100 hover:border-indigo-300 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-1.5 rounded-lg ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          <StoreIcon size={14} />
                        </div>
                        <div>
                          <p
                            className={`text-xs font-bold ${
                              isSelected ? "text-white" : "text-slate-800"
                            }`}
                          >
                            {store.name}
                          </p>
                          {isAssignedOther && (
                            <p className="text-[9px] text-amber-500 font-medium">
                              Currently in another zone
                            </p>
                          )}
                        </div>
                      </div>
                      {isSelected ? (
                        <CheckCircle2 size={18} className="text-white" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-200"></div>
                      )}
                    </div>
                  );
                })}
                {allStores.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No stores available. Add stores first.
                  </div>
                )}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors uppercase tracking-wider"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="zone-form"
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
          >
            <Save size={16} /> Save Sector
          </button>
        </div>
      </div>
    </div>
  );
};

// --- ZONE MANAGER COMPONENT ---
const ZoneManager: React.FC<{
  zones: OperationalZone[];
  stores: Store[];
  teamMembers: User[];
  onUpdate: (zones: OperationalZone[], stores: Store[]) => void;
}> = ({ zones, stores, teamMembers, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<OperationalZone | undefined>(
    undefined,
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSaveZone = async (
    newZone: OperationalZone,
    selectedStoreIds: string[],
  ) => {
    try {
      const { data: savedZone, error: zoneError } = await supabase
        .from("operational_zones")
        .upsert({
          // Only include id if it exists (for updates)
          ...(newZone.id && { id: newZone.id }),
          name: newZone.name,
          color: newZone.color,
          address: newZone.address,
          head_branch_id: newZone.headBranchId || null,
        })
        .select()
        .single();

      if (zoneError) throw zoneError;

      const zoneId = savedZone.id;

      for (const store of stores) {
        const shouldBeAssigned = selectedStoreIds.includes(store.id);
        const currentZoneId = store.zoneId;

        if (
          (shouldBeAssigned && currentZoneId !== zoneId) ||
          (!shouldBeAssigned && currentZoneId === zoneId)
        ) {
          await supabase
            .from("stores")
            .update({
              zone_id: shouldBeAssigned ? zoneId : null,
            })
            .eq("id", store.id);
        }
      }

      let updatedZones = [...zones];
      const existingIdx = zones.findIndex((z) => z.id === zoneId);

      if (existingIdx > -1) {
        // Update existing zone
        updatedZones[existingIdx] = {
          ...savedZone,
          id: savedZone.id,
          headBranchId: savedZone.head_branch_id || undefined,
        };
      } else {
        // Add new zone
        updatedZones.push({
          ...savedZone,
          id: savedZone.id,
          headBranchId: savedZone.head_branch_id || undefined,
        });
      }

      // Update stores with new zone assignments
      const updatedStores = stores.map((store) => {
        if (selectedStoreIds.includes(store.id)) {
          return { ...store, zoneId: zoneId };
        }
        // If store was previously assigned to this zone but now unselected, remove zone
        if (store.zoneId === zoneId && !selectedStoreIds.includes(store.id)) {
          return { ...store, zoneId: undefined };
        }
        return store;
      });

      onUpdate(updatedZones, updatedStores);
      alert("Zone saved successfully!");
    } catch (error: any) {
      console.error("Error saving zone:", error);
      alert(`Failed to save zone: ${error.message}`);
    }
  };

  const handleDeleteZone = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("operational_zones")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      await supabase
        .from("stores")
        .update({ zone_id: null })
        .eq("zone_id", deleteId);

      const updatedStores = stores.map((s) =>
        s.zoneId === deleteId ? { ...s, zoneId: undefined } : s,
      );
      const updatedZones = zones.filter((z) => z.id !== deleteId);

      onUpdate(updatedZones, updatedStores);
      setDeleteId(null);
      alert("Zone deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting zone:", error);
      alert(`Failed to delete zone: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
            <Globe size={32} className="text-cyan-100" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight leading-none">
              Operational Sectors
            </h2>
            <p className="text-cyan-100 text-sm font-medium mt-1.5 opacity-90">
              Manage geographical or functional divisions.
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingZone(undefined);
            setIsModalOpen(true);
          }}
          className="relative z-10 px-6 py-3.5 bg-white text-cyan-700 font-black rounded-2xl shadow-lg hover:bg-cyan-50 transition-all flex items-center gap-2 active:scale-95 text-xs uppercase tracking-widest group"
        >
          <Plus
            size={16}
            className="group-hover:rotate-90 transition-transform"
          />{" "}
          Add Sector
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {zones.map((zone) => {
          const storeCount = stores.filter((s) => s.zoneId === zone.id).length;
          const memberCount = teamMembers.filter(
            (m) => m.zoneId === zone.id,
          ).length;
          const headBranchName =
            stores.find((s) => s.id === zone.headBranchId)?.name ||
            "Unassigned";

          // Color Mapping
          const colorMap: Record<string, string> = {
            indigo: "bg-indigo-500",
            emerald: "bg-emerald-500",
            rose: "bg-rose-500",
            amber: "bg-amber-500",
            purple: "bg-purple-500",
            blue: "bg-blue-500",
            slate: "bg-slate-500",
          };
          const bgClass = colorMap[zone.color] || "bg-slate-500";
          const textClass = zone.color
            ? `text-${zone.color}-600`
            : "text-slate-600";

          return (
            <div
              key={zone.id}
              className="bg-white rounded-[2rem] border border-slate-200 p-6 flex flex-col hover:border-cyan-300 hover:shadow-lg transition-all relative overflow-hidden group h-full"
            >
              <div
                className={`absolute left-0 top-0 bottom-0 w-2 ${bgClass}`}
              ></div>

              <div className="pl-4 flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">
                    {zone.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Building2 size={12} className="text-slate-400" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      HQ: {headBranchName}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 translate-x-0 z-10 relative">
                  <button
                    onClick={() => {
                      setEditingZone(zone);
                      setIsModalOpen(true);
                    }}
                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-cyan-600 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(zone.id);
                    }}
                    className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {zone.address && (
                <div className="pl-4 mb-6">
                  <div className="flex items-start gap-2 text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <MapPin
                      size={14}
                      className="mt-0.5 shrink-0 text-slate-400"
                    />
                    <p className="text-xs font-medium leading-relaxed line-clamp-2">
                      {zone.address}
                    </p>
                  </div>
                </div>
              )}

              <div className="pl-4 mt-auto grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <StoreIcon size={10} /> Stores Linked
                  </p>
                  <p className={`text-2xl font-black ${textClass}`}>
                    {storeCount}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Users size={10} /> Workforce
                  </p>
                  <p className={`text-2xl font-black ${textClass}`}>
                    {memberCount}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {zones.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-[2rem]">
            <Globe size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest">
              No Sectors Defined
            </p>
            <p className="text-xs mt-1">
              Create a zone to organize your stores and staff.
            </p>
          </div>
        )}
      </div>

      <ZoneModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        zone={editingZone}
        onSave={handleSaveZone}
        allStores={stores}
        allMembers={teamMembers}
      />

      <DeleteConfirmModal
        isOpen={!!deleteId}
        title="Delete Operational Sector?"
        message="Stores and staff assigned to this zone will become unassigned. This action cannot be undone."
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteZone}
      />
    </div>
  );
};

const DeleteConfirmModal: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ isOpen, title, message, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
          <Trash2 size={24} />
        </div>
        <h3 className="text-lg font-black text-slate-800 text-center mb-2">
          {title}
        </h3>
        <p className="text-xs font-medium text-slate-500 text-center mb-6 leading-relaxed">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-red-200 transition-colors"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
};

interface SimpleListManagerProps {
  title: string;
  items: { id: string; name: string; isSystem?: boolean }[];
  onAdd: (name: string) => void;
  onEdit: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  placeholder: string;
  dependencyCheck?: (name: string) => boolean;
  onWorkflowsRefresh: () => Promise<void>;
}

const SimpleListManager: React.FC<SimpleListManagerProps> = ({
  title,
  items,
  onAdd,
  onEdit,
  onDelete,
  placeholder,
  dependencyCheck,
  onWorkflowsRefresh,
}) => {
  const [newItemName, setNewItemName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newItemName.trim()) return;

    if (
      items.some(
        (i) => i.name.toLowerCase() === newItemName.trim().toLowerCase(),
      )
    ) {
      setError("Item already exists");
      return;
    }

    await onAdd(newItemName.trim());
    await onWorkflowsRefresh(); // 🔥 KEY LINE

    setNewItemName("");
    setError(null);
  };

  const startEdit = (item: { id: string; name: string }) => {
    setEditingId(item.id);
    setEditValue(item.name);
    setError(null);
  };

  const saveEdit = async (id: string) => {
    if (!editValue.trim()) return;

    await onEdit(id, editValue.trim());
    await onWorkflowsRefresh(); // 🔥

    setEditingId(null);
  };

  const attemptDelete = async (item) => {
    if (item.isSystem) {
      setError("Cannot delete system default items");
      return;
    }

    if (dependencyCheck && dependencyCheck(item.name)) {
      setError(`Cannot delete "${item.name}" because it is currently in use.`);
      return;
    }

    await onDelete(item.id);
    await onWorkflowsRefresh(); // 🔥

    setError(null);
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
        <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
        {title}
      </h3>

      {error && (
        <div className="mb-3 p-2.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg flex items-center gap-2">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
        />
        <button
          onClick={handleAdd}
          className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar min-h-[150px]">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg group border border-transparent hover:border-slate-200 transition-colors"
          >
            {editingId === item.id ? (
              <div className="flex flex-1 items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={() => saveEdit(item.id)}
                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="p-1 text-red-500 hover:bg-red-100 rounded"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <span className="text-slate-700 font-medium text-sm">
                  {item.name}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(item)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => attemptDelete(item)}
                    className={`p-1.5 rounded ${
                      item.isSystem
                        ? "text-slate-300 cursor-not-allowed"
                        : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                    }`}
                    disabled={item.isSystem}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-slate-400 text-xs text-center py-4 italic">
            No items added yet.
          </p>
        )}
      </div>
    </div>
  );
};

const StoreManager: React.FC<{
  stores: Store[];
  zones: OperationalZone[];
  onUpdate: (stores: Store[]) => void;
}> = ({ stores, zones, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);

    const storeData = {
      // DON'T include id field when creating new store - let Supabase generate it
      name: data.name as string,
      address: data.address as string,
      phone: data.phone as string,
      zone_id: (data.zoneId as string) || null,
    };

    try {
      if (editingStore) {
        // For updates, include the id
        const { error } = await supabase
          .from("stores")
          .update(storeData)
          .eq("id", editingStore.id);

        if (error) throw error;

        const updatedStore: Store = {
          id: editingStore.id,
          name: data.name as string,
          address: data.address as string,
          phone: data.phone as string,
          zoneId: (data.zoneId as string) || undefined,
        };

        onUpdate(
          stores.map((s) => (s.id === editingStore.id ? updatedStore : s)),
        );
      } else {
        // For new stores, DON'T include id - let Supabase generate it
        const { data: newStoreData, error } = await supabase
          .from("stores")
          .insert(storeData)
          .select() // Make sure to select the returned data
          .single();

        if (error) throw error;

        // Use the ID that Supabase generated
        const newStore: Store = {
          id: newStoreData.id, // This is the UUID from Supabase
          name: newStoreData.name,
          address: newStoreData.address,
          phone: newStoreData.phone,
          zoneId: newStoreData.zone_id || undefined,
        };

        onUpdate([...stores, newStore]);
      }

      setIsModalOpen(false);
      setEditingStore(null);
      alert(
        editingStore
          ? "Store updated successfully!"
          : "Store created successfully!",
      );
    } catch (error: any) {
      console.error("Error saving store:", error);
      alert(`Failed to save store: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("stores")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      onUpdate(stores.filter((s) => s.id !== deleteId));
      setDeleteId(null);
      alert("Store deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting store:", error);
      alert(`Failed to delete store: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-[2.5rem] p-8 text-white shadow-xl flex justify-between items-center relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black tracking-tight">
            Store Locations
          </h2>
          <p className="text-emerald-100 text-sm font-medium mt-1">
            Manage physical branches and contact info.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingStore(null);
            setIsModalOpen(true);
          }}
          className="relative z-10 px-6 py-3 bg-white text-emerald-700 font-black rounded-2xl shadow-lg hover:bg-emerald-50 transition-all flex items-center gap-2 active:scale-95 text-xs uppercase tracking-widest"
        >
          <Plus size={16} /> Add Store
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => {
          const zoneName =
            zones.find((z) => z.id === store.zoneId)?.name || "Unassigned";
          return (
            <div
              key={store.id}
              className="bg-white rounded-[2rem] border border-slate-200 p-6 hover:shadow-xl hover:border-emerald-300 transition-all group relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                  <StoreIcon size={24} />
                </div>
                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200">
                  {zoneName}
                </span>
              </div>

              <h3 className="font-bold text-slate-800 text-lg mb-1">
                {store.name}
              </h3>
              <div className="space-y-2 mt-4 text-xs font-medium text-slate-500">
                <p className="flex items-start gap-2">
                  <MapPin
                    size={14}
                    className="shrink-0 mt-0.5 text-slate-400"
                  />
                  <span className="line-clamp-2">
                    {store.address || "No address provided"}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={14} className="shrink-0 text-slate-400" />
                  {store.phone || "No phone"}
                </p>
              </div>

              <div className="absolute top-6 right-6 flex gap-1 translate-x-0 z-10">
                <button
                  onClick={() => {
                    setEditingStore(store);
                    setIsModalOpen(true);
                  }}
                  className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-emerald-600 shadow-sm"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(store.id);
                  }}
                  className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-red-600 shadow-sm"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 flex flex-col">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-2xl text-slate-800">
                {editingStore ? "Edit Store" : "New Store"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-full text-slate-400"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                  Store Name
                </label>
                <input
                  name="name"
                  defaultValue={editingStore?.name}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g. Downtown Branch"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                  Zone Assignment
                </label>
                <select
                  name="zoneId"
                  defaultValue={editingStore?.zoneId}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="">-- Select Zone --</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                  Phone Contact
                </label>
                <input
                  name="phone"
                  defaultValue={editingStore?.phone}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="+91..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                  Address
                </label>
                <textarea
                  name="address"
                  defaultValue={editingStore?.address}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                  placeholder="Full location details..."
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition-all shadow-lg active:scale-95 text-xs uppercase tracking-widest mt-4"
              >
                Save Location
              </button>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deleteId}
        title="Delete Store Location?"
        message="This will remove the store from the system. Associated history will remain."
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

// --- REDESIGNED TEAM MEMBER MODAL ---
interface TeamMemberModalProps {
  member?: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: User) => void;
  currentUser: User;
  zones: OperationalZone[];
  allStores: Store[];
}

// --- TEAM MANAGER (FULL IMPLEMENTATION) ---
const TeamManager: React.FC<{
  members: User[];
  zones: OperationalZone[];
  stores: Store[];
  tickets: Ticket[];
  onUpdate: (members: User[]) => void;
  currentUser: User;
}> = ({ members, zones, stores, tickets, onUpdate, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editingMember) {
      setPhotoUrl(editingMember.photo || "");
    } else {
      setPhotoUrl("");
    }
  }, [editingMember]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image too large. Please select under 2MB.");
      return;
    }

    setIsUploading(true);
    // Use Supabase Storage via helper
    const url = await uploadFile(file, "avatars");

    if (url) {
      setPhotoUrl(url);
    } else {
      // Fallback to Base64 if storage fails
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    setIsUploading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);

    const userData = {
      name: data.name as string,
      email: data.email as string,
      role: data.role as Role,
      zone_id: data.zoneId as string,
      store_id: data.storeId as string,
      mobile: data.mobile as string,
      photo: photoUrl,
      address: data.address as string,
      experience: data.experience as string,
    };

    try {
      if (editingMember) {
        const { error } = await supabase
          .from("users")
          .update(userData)
          .eq("id", editingMember.id);

        if (error) throw error;

        // Update password if provided
        if (data.password && data.password.toString().trim() !== "") {
          const { error: authError } = await supabase.auth.updateUser({
            password: data.password as string,
          });
          if (authError) {
            console.error("Password update failed:", authError);
          }
        }
      } else {
        // Create new user with auth
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: data.email as string,
            password: (data.password as string) || "123456",
            options: {
              data: {
                name: data.name,
                role: data.role,
              },
            },
          },
        );

        if (authError) throw authError;

        // Insert into users table
        const { error: dbError } = await supabase.from("users").insert({
          auth_id: authData.user?.id,
          ...userData,
          email: data.email as string,
        });

        if (dbError) throw dbError;
      }

      // Close modal FIRST
      setIsModalOpen(false);
      setEditingMember(null);

      // Refresh data from Supabase
      onUpdate(members); // This will trigger parent to refresh from Supabase

      alert(
        editingMember
          ? "Team member updated successfully!"
          : "Team member created successfully!",
      );
    } catch (err: any) {
      console.error("Error saving team member:", err);
      alert(`Failed to save team member: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      onUpdate(members.filter((m) => m.id !== deleteId));
      setDeleteId(null);
      alert("Team member deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting team member:", error);
      alert(`Failed to delete team member: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const isSuperAdminLocked = (memberRole: string) => {
    return currentUser.role === "ADMIN" && memberRole === "SUPER_ADMIN";
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "ADMIN":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "MANAGER":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl flex justify-between items-center relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black tracking-tight">Team & Access</h2>
          <p className="text-indigo-200 text-sm font-medium mt-1">
            Manage personnel, roles, and assignments.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingMember(null);
            setIsModalOpen(true);
          }}
          className="relative z-10 px-6 py-3 bg-white text-indigo-900 font-black rounded-2xl shadow-lg hover:bg-indigo-50 transition-all flex items-center gap-2 active:scale-95 text-xs uppercase tracking-widest"
        >
          <Plus size={16} /> Add Member
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => {
          const activeTickets = tickets.filter(
            (t) => t.assignedToId === member.id && t.status !== "Resolved",
          ).length;
          return (
            <div
              key={member.id}
              className="bg-white rounded-[2rem] border border-slate-200 p-6 hover:shadow-xl hover:border-indigo-300 transition-all group relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-xl text-slate-400 shadow-inner overflow-hidden border border-slate-200">
                  {member.photo ? (
                    <img
                      src={member.photo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    member.name.charAt(0)
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getRoleColor(
                    member.role,
                  )}`}
                >
                  {member.role.replace("_", " ")}
                </span>
              </div>

              <h3 className="font-bold text-slate-800 text-lg">
                {member.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium mb-4">
                {member.email}
              </p>

              <div className="space-y-2 mb-4">
                {member.zoneId && (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <Layers size={14} className="text-indigo-500" />
                    {zones.find((z) => z.id === member.zoneId)?.name ||
                      "Unknown Zone"}
                  </div>
                )}
                {member.storeId && (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <StoreIcon size={14} className="text-emerald-500" />
                    {stores.find((s) => s.id === member.storeId)?.name ||
                      "Unknown Store"}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {activeTickets} Active Jobs
                </span>
                <div className="flex gap-1 z-10 relative">
                  <button
                    title={
                      isSuperAdminLocked(member.role)
                        ? "Admins cannot modify Super Admins"
                        : "Edit user"
                    }
                    onClick={() => {
                      setEditingMember(member);
                      setIsModalOpen(true);
                    }}
                    disabled={isSuperAdminLocked(member.role)}
                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  {currentUser.id !== member.id && (
                    <button
                      title={
                        isSuperAdminLocked(member.role)
                          ? "Admins cannot modify Super Admins"
                          : "Edit user"
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(member.id);
                      }}
                      disabled={isSuperAdminLocked(member.role)}
                      className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-2xl text-slate-800">
                {editingMember ? "Edit Profile" : "New Member"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-full text-slate-400"
              >
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={handleSave}
              className="p-8 space-y-5 overflow-y-auto custom-scrollbar"
            >
              {/* Profile Photo Upload */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="text-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-2">
                    Profile Photo
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 hover:bg-black transition-all"
                  >
                    {isUploading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Camera size={14} />
                    )}
                    {photoUrl ? "Change Photo" : "Upload Photo"}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                  Full Name
                </label>
                <input
                  name="name"
                  defaultValue={editingMember?.name}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  defaultValue={editingMember?.email}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="john@company.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                    Role
                  </label>
                  <select
                    name="role"
                    defaultValue={editingMember?.role || "TECHNICIAN"}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="TECHNICIAN">Technician</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                    Mobile
                  </label>
                  <input
                    name="mobile"
                    defaultValue={editingMember?.mobile}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="+91..."
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                  Operational Zone
                </label>
                <select
                  name="zoneId"
                  defaultValue={editingMember?.zoneId}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="">Global / None</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                  Primary Store
                </label>
                <select
                  name="storeId"
                  defaultValue={editingMember?.storeId}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="">None</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              {!editingMember && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">
                    Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Default: 123456"
                  />
                </div>
              )}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all shadow-lg active:scale-95 text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  {editingMember ? "Save Changes" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deleteId}
        title="Delete Team Member?"
        message="This action will remove the user's access. Their history will be preserved."
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

// --- MAIN SETTINGS COMPONENT ---

export default function Settings({
  currentUser,
  tickets,
  onUpdateTickets,
  customers,
  onUpdateCustomers,
  tasks,
  onUpdateTasks,
  laptopReports,
  onUpdateLaptopReports,
  settings,
  onUpdateSettings,
  teamMembers,
  zones,
  stores,
  onRefreshTeamData,
  workflowsLastFetched,
  onWorkflowsRefresh,
}: SettingsProps) {
  console.log("🔍 Settings component render:", {
    deviceTypes: settings.deviceTypes?.length,
    ticketStatuses: settings.ticketStatuses?.length,
    priorities: settings.priorities?.length,
    serviceBrands: settings.serviceBrands?.length,
    holdReasons: settings.holdReasons?.length,
    progressReasons: settings.progressReasons?.length,
    laptopDealers: settings.laptopDealers?.length,
    workflowsLastFetched,
  });
  const [activeSection, setActiveSection] = useState<string>("team");

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<User | undefined>(
    undefined,
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";

  const handleZoneUpdate = async (
    updatedZones: OperationalZone[],
    updatedStores: Store[],
  ) => {
    for (const z of updatedZones) {
      await supabase.from("operational_zones").upsert({
        id: z.id,
        name: z.name,
        color: z.color,
        address: z.address,
        head_branch_id: z.headBranchId ?? null,
      });
    }
    for (const s of updatedStores) {
      await supabase
        .from("stores")
        .update({ zone_id: s.zoneId ?? null })
        .eq("id", s.id);
    }
    onRefreshTeamData();
  };

  const handleStoreUpdate = async (updatedStores: Store[]) => {
    for (const store of updatedStores) {
      await supabase.from("stores").upsert({
        id: store.id,
        name: store.name,
        address: store.address,
        phone: store.phone,
        zone_id: store.zoneId ?? null,
      });
    }
    onRefreshTeamData();
  };

  // --- CLOUD SYNC ENGINE ---
  const handleForceSync = async () => {
    if (!isSupabaseConfigured || !supabase) {
      alert("Supabase Cloud is not configured in this environment.");
      return;
    }

    if (
      !window.confirm(
        "You are about to force-sync all local data to the Supabase Cloud. This will overwrite existing cloud data for current keys. Proceed?",
      )
    )
      return;

    setIsSyncing(true);
    try {
      const collections = [
        { key: "settings", data: settings, zone: "global" },
        { key: "customers", data: customers, zone: "global" },
        { key: "tickets", data: tickets, zone: "global" },
        { key: "tasks", data: tasks, zone: "global" },
        { key: "laptop_reports", data: laptopReports, zone: "global" },
      ];

      for (const col of collections) {
        const { error } = await supabase.from("app_data").upsert(
          {
            key: col.key,
            data: col.data,
            zone_id: col.zone,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key,zone_id" },
        );

        if (error) throw error;
      }

      alert("Cloud Database Synchronized Successfully.");
    } catch (err: any) {
      alert(`Cloud Sync Failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const createListHandlers = (
    listKey: keyof AppSettings,
    dependencyKey?: keyof Ticket,
  ) => {
    // CRITICAL: Read from settings prop at render time, not closure time
    const getCurrentList = () => settings[listKey] as any[];

    return {
      // Use getter to always get fresh data
      get items() {
        return getCurrentList();
      },

      onAdd: async (name: string) => {
        try {
          console.log(`➕ Adding workflow item: ${listKey} - ${name}`);
          const { data, error } = await supabase
            .from("workflows")
            .insert({
              category: listKey,
              name: name,
              is_system: false,
              display_order: getCurrentList().length + 1,
            })
            .select()
            .single();

          if (error) throw error;

          console.log(`✅ Workflow item added to database:`, data);
        } catch (err: any) {
          console.error("❌ Error adding workflow item:", err);
          alert(`Failed to add item: ${err.message}`);
        }
      },

      onEdit: async (id: string, newName: string) => {
        const oldItem = getCurrentList().find((i) => i.id === id);

        try {
          console.log(
            `✏️ Editing workflow item: ${listKey} - ${id} -> ${newName}`,
          );
          const { error } = await supabase
            .from("workflows")
            .update({ name: newName, updated_at: new Date().toISOString() })
            .eq("id", id);

          if (error) throw error;

          console.log(`✅ Workflow item updated in database`);

          if (oldItem && dependencyKey) {
            const updatedTickets = tickets.map((t) =>
              t[dependencyKey] === oldItem.name
                ? { ...t, [dependencyKey]: newName }
                : t,
            );
            onUpdateTickets(updatedTickets);
          }
        } catch (err: any) {
          console.error("❌ Error updating workflow item:", err);
          alert(`Failed to update item: ${err.message}`);
        }
      },

      onDelete: async (id: string) => {
        try {
          console.log(`🗑️ Deleting workflow item: ${listKey} - ${id}`);
          const { error } = await supabase
            .from("workflows")
            .delete()
            .eq("id", id);

          if (error) throw error;

          console.log(`✅ Workflow item deleted from database`);
        } catch (err: any) {
          console.error("❌ Error deleting workflow item:", err);
          alert(`Failed to delete item: ${err.message}`);
        }
      },

      dependencyCheck: (name: string) =>
        dependencyKey ? tickets.some((t) => t[dependencyKey] === name) : false,
    };
  };
  const handleSaveMember = async (member: User) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: member.email.toLowerCase(),
        password: member.password,
        options: {
          data: {
            name: member.name,
            role: member.role,
          },
        },
      });

      if (authError) throw authError;
      const { error: dbError } = await supabase.from("users").insert({
        auth_id: authData.user?.id,
        email: member.email.toLowerCase(),
        role: member.role,
        mobile: member.mobile,
        address: member.address,
        zone_id: member.zoneId,
        store_id: member.storeId,
        photo: member.photo,
        experience: member.experience,
      });

      if (dbError) throw dbError;

      alert("Staff account created successfully. They can now log in.");
    } catch (err: any) {
      console.error("Error creating staff:", err);
      alert(`Failed to create staff: ${err.message}`);
    }
    setIsTeamModalOpen(false);
  };

  const handleSlaUpdate = (key: keyof SLAConfig, value: number) => {
    const updatedSettings = {
      ...settings,
      sla: { ...settings.sla, [key]: value },
    };
  };

  const handleExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: "3.1.0",
      settings,
      tickets,
      customers,
      tasks,
      laptopReports,
    };
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute(
      "download",
      `infofix_vault_${new Date().toISOString().slice(0, 10)}.json`,
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Capture the input element to access it safely in the callback
    const inputElement = e.target;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);

        // Selective restore with validation
        if (json.settings) onUpdateSettings(json.settings);
        if (json.tickets) onUpdateTickets(json.tickets);
        if (json.customers) onUpdateCustomers(json.customers);
        if (json.tasks) onUpdateTasks(json.tasks);
        if (json.laptopReports) onUpdateLaptopReports(json.laptopReports);

        alert("Data snapshot restored successfully. System state updated.");
        // Reset file input
        inputElement.value = "";
      } catch (err) {
        alert(
          "Failed to parse backup file. Please ensure it is a valid JSON export.",
        );
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const navGroups = [
    {
      title: "General",
      items: [
        { id: "team", label: "Team", icon: Users },
        { id: "zones", label: "Zones", icon: Layers },
        { id: "stores", label: "Stores", icon: StoreIcon },
      ],
    },
    {
      title: "Configuration",
      items: [
        { id: "workflow", label: "Workflow", icon: ListOrdered },
        { id: "devices", label: "Devices", icon: Smartphone },
        { id: "brands", label: "Brands", icon: Tag },
      ],
    },
    {
      title: "Modules",
      items: [
        { id: "laptop", label: "Laptop QC", icon: Laptop },
        { id: "sla", label: "SLA Limits", icon: Clock },
      ],
    },
    {
      title: "System",
      items: [
        { id: "cloud", label: "Cloud Sync", icon: Cloud },
        { id: "data", label: "Data", icon: Database },
      ],
    },
  ];

  if (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "ADMIN")
    return <AccessDenied />;
  const activeTitle = navGroups
    .flatMap((g) => g.items)
    .find((i) => i.id === activeSection)?.label;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[calc(100vh-140px)]">
      {/* SIDEBAR */}
      <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4">
        <div className="lg:hidden overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar flex gap-2">
          {navGroups
            .flatMap((g) => g.items)
            .map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold border transition-all ${
                  activeSection === item.id
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-600"
                }`}
              >
                {item.label}
              </button>
            ))}
        </div>
        <div className="hidden lg:block bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden h-full sticky top-6">
          <div className="p-8 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 flex items-center gap-3 text-lg">
              <UserCog size={24} className="text-indigo-600" /> Settings
            </h2>
          </div>
          <nav className="p-4 space-y-8 overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar">
            {navGroups.map((group, idx) => (
              <div key={idx}>
                <h3 className="px-4 mb-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-xs font-bold rounded-2xl transition-all ${
                        activeSection === item.id
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <item.icon size={18} /> {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 lg:p-10 overflow-y-auto custom-scrollbar">
        {activeSection === "team" && (
          <TeamManager
            members={teamMembers}
            zones={zones}
            stores={stores}
            tickets={tickets}
            onUpdate={onRefreshTeamData}
            currentUser={currentUser}
          />
        )}
        {activeSection === "zones" && (
          <>
            <ZoneManager
              zones={zones}
              stores={stores}
              teamMembers={teamMembers}
              onUpdate={handleZoneUpdate}
            />
          </>
        )}

        {activeSection === "stores" && (
          <StoreManager
            stores={stores}
            zones={zones}
            onUpdate={handleStoreUpdate}
          />
        )}

        {activeSection === "workflow" && (
          <div className="grid gap-6 md:grid-cols-2">
            <SimpleListManager
              title="Ticket Statuses"
              {...createListHandlers("ticketStatuses", "status")}
              onWorkflowsRefresh={onWorkflowsRefresh}
            />
            <SimpleListManager
              title="Priorities"
              {...createListHandlers("priorities", "priority")}
              onWorkflowsRefresh={onWorkflowsRefresh}
            />
            <SimpleListManager
              title="Hold Reasons"
              {...createListHandlers("holdReasons")}
              onWorkflowsRefresh={onWorkflowsRefresh}
            />
            <SimpleListManager
              title="Progress Reasons"
              {...createListHandlers("progressReasons")}
              onWorkflowsRefresh={onWorkflowsRefresh}
            />
          </div>
        )}

        {activeSection === "devices" && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <SimpleListManager
              title="Device Types"
              {...createListHandlers("deviceTypes", "deviceType")}
              onWorkflowsRefresh={onWorkflowsRefresh}
            />
          </div>
        )}
        {activeSection === "brands" && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <SimpleListManager
              title="Service Brands"
              {...createListHandlers("serviceBrands", "brand")}
              onWorkflowsRefresh={onWorkflowsRefresh}
            />
          </div>
        )}
        {activeSection === "laptop" && (
          <DealerManager
            dealers={settings.laptopDealers}
            onUpdate={() => {}}
            onWorkflowsRefresh={onWorkflowsRefresh}
          />
        )}

        {activeSection === "sla" && (
          <div className="max-w-xl mx-auto bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Clock size={20} /> SLA Thresholds (Days)
            </h3>
            <div className="space-y-4">
              {["high", "medium", "low"].map((p) => (
                <div
                  key={p}
                  className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-100"
                >
                  <span className="capitalize font-bold text-slate-600">
                    {p} Priority
                  </span>
                  <input
                    type="number"
                    value={settings.sla[p as keyof SLAConfig]}
                    onChange={(e) =>
                      handleSlaUpdate(
                        p as keyof SLAConfig,
                        parseInt(e.target.value),
                      )
                    }
                    className="w-20 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold outline-none focus:ring-2 ring-indigo-500/20"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "cloud" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
              <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
                    <Cloud size={32} className="text-indigo-300" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">
                      Cloud Synchronization
                    </h2>
                    <p className="text-indigo-200 text-sm font-medium mt-1">
                      Data persistence & cross-device availability
                    </p>
                  </div>
                </div>
                <div
                  className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg backdrop-blur-md ${
                    isSupabaseConfigured
                      ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                      : "bg-amber-500/20 border-amber-500/30 text-amber-300"
                  }`}
                >
                  {isSupabaseConfigured ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    <AlertTriangle size={14} strokeWidth={3} />
                  )}
                  {isSupabaseConfigured
                    ? "System Online"
                    : "Local Storage Only"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sync Control */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-all">
                <div>
                  <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2">
                    <RefreshCw size={20} className="text-indigo-600" /> Manual
                    Sync Trigger
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-8 font-medium">
                    Push all local changes to the cloud database immediately.
                    This ensures all devices have the latest operational data.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    onClick={handleForceSync}
                    disabled={isSyncing}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
                  >
                    {isSyncing ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <RefreshCw
                        size={20}
                        className="group-hover:rotate-180 transition-transform duration-700"
                      />
                    )}
                    {isSyncing ? "Synchronizing..." : "Execute Sync Now"}
                  </button>
                  {!isSupabaseConfigured && (
                    <div className="p-4 bg-amber-50 text-amber-800 text-xs font-bold rounded-xl border border-amber-100 flex items-start gap-2 leading-relaxed">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <p>
                        Supabase is not configured. Data is currently stored in
                        your browser's local storage. Configure credentials in
                        code to enable cloud features.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Payload Stats */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-indigo-300 transition-all">
                <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                  <Database size={20} className="text-slate-400" /> Data Payload
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      label: "Service Tickets",
                      count: tickets.length,
                      color: "indigo",
                      icon: FileText,
                    },
                    {
                      label: "Customer Profiles",
                      count: customers.length,
                      color: "purple",
                      icon: Users,
                    },
                    {
                      label: "Task Entries",
                      count: tasks.length,
                      color: "emerald",
                      icon: ListOrdered,
                    },
                    {
                      label: "QC Reports",
                      count: laptopReports.length,
                      color: "blue",
                      icon: Laptop,
                    },
                    {
                      label: "Config Settings",
                      count: "Active",
                      color: "slate",
                      icon: SettingsIcon,
                    },
                    {
                      label: "Team Accounts",
                      count: settings.teamMembers.length,
                      color: "amber",
                      icon: UserIcon,
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center hover:bg-white hover:shadow-md hover:scale-105 transition-all cursor-default group"
                    >
                      <div
                        className={`mb-2 p-2 rounded-lg bg-${item.color}-100 text-${item.color}-600 opacity-80 group-hover:opacity-100 transition-opacity`}
                      >
                        {item.icon ? (
                          <item.icon size={16} />
                        ) : (
                          <Database size={16} />
                        )}
                      </div>
                      <span
                        className={`text-2xl font-black text-${item.color}-600 tabular-nums`}
                      >
                        {item.count}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "data" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
              <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
                    <HardDrive size={32} className="text-emerald-300" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">
                      Data Management
                    </h2>
                    <p className="text-emerald-200 text-sm font-medium mt-1">
                      Backup & Restoration Controls
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Data Actions */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Export Card */}
              <div
                onClick={handleExportBackup}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                  <Database size={140} className="text-indigo-600" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Download size={28} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">
                      System Snapshot
                    </h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xs">
                      Generate a complete JSON backup of all tickets, customers,
                      settings, and reports.
                    </p>
                  </div>
                  <div className="mt-8 flex items-center gap-3">
                    <span className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-100">
                      JSON Format
                    </span>
                    <span className="px-4 py-2 bg-indigo-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      Download
                    </span>
                  </div>
                </div>
              </div>

              {/* Import Card */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                <input
                  type="file"
                  accept=".json"
                  className="absolute inset-0 opacity-0 cursor-pointer z-20"
                  onChange={handleImportData}
                />
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                  <FileUp size={140} className="text-emerald-600" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Upload size={28} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">
                      Restore Data
                    </h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xs">
                      Upload a previously saved backup file to restore your
                      workspace state.
                    </p>
                  </div>
                  <div className="mt-8 flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
                      <AlertTriangle size={12} className="text-amber-500" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-700">
                        Overwrites Data
                      </span>
                    </div>
                    <span className="px-4 py-2 bg-emerald-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      Select File
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
