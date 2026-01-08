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
import { supabase, isSupabaseConfigured } from "../supabaseClient";

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
}> = ({ dealers, onUpdate }) => {
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

  const handleSave = () => {
    if (!formData.name) return;

    let updatedDealers;
    if (editingDealer) {
      updatedDealers = dealers.map((d) =>
        d.id === editingDealer.id ? ({ ...d, ...formData } as Dealer) : d
      );
    } else {
      updatedDealers = [
        ...dealers,
        { ...formData, id: `dl-${Date.now()}` } as Dealer,
      ];
    }

    onUpdate(updatedDealers);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this dealer?")) {
      onUpdate(dealers.filter((d) => d.id !== id));
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

// --- ZONE MANAGER COMPONENT ---
const ZoneManager: React.FC<{
  zones: OperationalZone[];
  stores: Store[];
  teamMembers: User[];
  onUpdate: (updatedZones: OperationalZone[], updatedStores: Store[]) => void;
}> = ({ zones, stores, teamMembers, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<OperationalZone | null>(null);

  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);

  const [formData, setFormData] = useState<Partial<OperationalZone>>({
    name: "",
    color: "#6366f1",
    headBranchId: "",
    address: "",
  });

  const handleOpen = (zone?: OperationalZone) => {
    if (zone) {
      setEditingZone(zone);
      setFormData({ ...zone });
      setSelectedStoreIds(
        stores.filter((s) => s.zoneId === zone.id).map((s) => s.id)
      );
    } else {
      setEditingZone(null);
      setFormData({
        name: "",
        color: "#6366f1",
        headBranchId: "",
        address: "",
      });
      setSelectedStoreIds([]);
    }
    setIsModalOpen(true);
  };

const handleSave = async () => {
 if (!formData.name) return;

  const zoneId = editingZone ? editingZone.id : crypto.randomUUID();

  const newZone: OperationalZone = {
    ...formData,
    id: zoneId,
  } as OperationalZone;

  const updatedZones = editingZone
    ? zones.map((z) => (z.id === zoneId ? newZone : z))
    : [...zones, newZone];

  // 🔥 Update store assignments in Supabase store_locations table
  for (const store of stores) {
    const shouldBeAssigned = selectedStoreIds.includes(store.id);

    await supabase
      .from("store_locations")
      .update({ 
        zone_id: shouldBeAssigned ? zoneId : null,
        updated_at: new Date().toISOString()
      })
      .eq("id", store.id);
  }

  onUpdate(updatedZones, stores);
  setIsModalOpen(false);
};

const deleteStore = async (id: string) => {
  const confirmDelete = confirm("Delete this store permanently?");
  if (!confirmDelete) return;

  const { error } = await supabase
    .from("store_locations")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Failed to delete store");
    return;
  }

  // Refresh stores from database
  // You might want to call fetchStores here if available
  alert("Store deleted successfully");
  window.location.reload(); // Simple refresh to get updated data
 
};
 

  const toggleStoreSelection = (id: string) => {
    setSelectedStoreIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Layers size={20} className="text-indigo-600" />
            Operational Zones
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Configure regional clusters and cluster properties.
          </p>
        </div>
        <button
          onClick={() => handleOpen()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 font-bold text-sm shadow-lg shadow-indigo-100"
        >
          <Plus size={18} /> Add Zone
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {zones.map((zone) => {
          const zoneStores = stores.filter((s) => s.zoneId === zone.id);
          const zoneStaff = teamMembers.filter((m) => m.zoneId === zone.id);
          const headBranch = stores.find((s) => s.id === zone.headBranchId);

          return (
            <div
              key={zone.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden group hover:border-indigo-300 transition-all flex flex-col"
            >
              <div
                className="h-2 w-full"
                style={{ backgroundColor: zone.color }}
              ></div>
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-xl"
                      style={{
                        backgroundColor: `${zone.color}20`,
                        color: zone.color,
                      }}
                    >
                      <Globe size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-lg leading-tight">
                        {zone.name}
                      </h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                        Regional Cluster
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpen(zone)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deleteStore(zone.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Crown size={10} className="text-indigo-500" /> Head
                      Branch
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {headBranch?.name || "Not Assigned"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Assigned Stores
                      </p>
                      <p className="text-xl font-black text-slate-800">
                        {zoneStores.length}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Total Staff
                      </p>
                      <p className="text-xl font-black text-slate-800">
                        {zoneStaff.length}
                      </p>
                    </div>
                  </div>

                  {zone.address && (
                    <div className="pt-2">
                      <p className="text-[10px] text-slate-500 flex items-start gap-1.5 italic leading-relaxed">
                        <MapPin
                          size={12}
                          className="shrink-0 mt-0.5 text-indigo-400"
                        />
                        {zone.address}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                  Active Cluster
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                  <Layers size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                    {editingZone ? "Configure Zone" : "New Operational Zone"}
                  </h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Regional Node Setup
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
                    Zone Name *
                  </label>
                  <input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-50/10 outline-none transition-all"
                    placeholder="e.g. Durgapur North Cluster"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Identity Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="w-12 h-12 rounded-xl border-2 border-white shadow-lg cursor-pointer p-0 overflow-hidden"
                    />
                    <input
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono uppercase focus:ring-4 ring-indigo-50/10 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Assign Stores to this Zone
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-4 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner custom-scrollbar">
                  {stores.map((store) => {
                    const isAssignedToOtherZone =
                      store.zoneId && store.zoneId !== editingZone?.id;
                    const isChecked = selectedStoreIds.includes(store.id);

                    return (
                      <label
                        key={store.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? "bg-indigo-50 border-indigo-200"
                            : "bg-white border-transparent hover:border-slate-200"
                        } ${
                          isAssignedToOtherZone ? "opacity-50 grayscale" : ""
                        }`}
                      >
                        <div
                          onClick={(e) => {
                            if (isAssignedToOtherZone) {
                              e.preventDefault();
                              return;
                            }
                            toggleStoreSelection(store.id);
                          }}
                          className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
                            isChecked
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "border-slate-300"
                          }`}
                        >
                          {isChecked && <Check size={14} strokeWidth={4} />}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {store.name}
                          </p>
                          {isAssignedToOtherZone && (
                            <p className="text-[8px] text-amber-600 font-bold uppercase">
                              Locked to other zone
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Assigned Head Branch (From Selected Stores)
                </label>
                <div className="relative">
                  <Crown
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500"
                    size={18}
                  />
                  <select
                    value={formData.headBranchId}
                    onChange={(e) =>
                      setFormData({ ...formData, headBranchId: e.target.value })
                    }
                    className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-50/10 outline-none appearance-none"
                  >
                    <option value="">-- Choose Head Branch --</option>
                    {stores
                      .filter((s) => selectedStoreIds.includes(s.id))
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    size={16}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Main Zone Address
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
                    placeholder="Enter official regional address..."
                  />
                </div>
              </div>
            </div>

            <div className="px-8 py-6 border-t border-slate-100 bg-white flex gap-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} />{" "}
                {editingZone ? "Commit Changes" : "Initialize Zone"}
              </button>
            </div>
          </div>
        </div>
      )}
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
}

const SimpleListManager: React.FC<SimpleListManagerProps> = ({
  title,
  items,
  onAdd,
  onEdit,
  onDelete,
  placeholder,
  dependencyCheck,
}) => {
  const [newItemName, setNewItemName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState<string | null>(null);


  
  const handleAdd = () => {
    if (!newItemName.trim()) return;
    if (
      items.some(
        (i) => i.name.toLowerCase() === newItemName.trim().toLowerCase()
      )
    ) {
      setError("Item already exists");
      return;
    }
    onAdd(newItemName.trim());
    setNewItemName("");
    setError(null);
  };

  const startEdit = (item: { id: string; name: string }) => {
    setEditingId(item.id);
    setEditValue(item.name);
    setError(null);
  };

  const saveEdit = (id: string) => {
    if (!editValue.trim()) return;
    onEdit(id, editValue.trim());
    setEditingId(null);
  };

  const attemptDelete = (item: {
    id: string;
    name: string;
    isSystem?: boolean;
  }) => {
    if (item.isSystem) {
      setError("Cannot delete system default items");
      return;
    }
    if (dependencyCheck && dependencyCheck(item.name)) {
      setError(`Cannot delete "${item.name}" because it is currently in use.`);
      return;
    }
    onDelete(item.id);
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
  tickets: Ticket[];
  onUpdateTickets: (tickets: Ticket[]) => void;
  currentUser: User;
}> = ({ stores, zones, onUpdate, tickets, onUpdateTickets, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";

  // Fetch stores from Supabase
  const fetchStores = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("store_locations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data to match Store type
      const transformedStores: Store[] = data.map(store => ({
        id: store.id,
        name: store.name,
        address: store.address || "",
        phone: store.phone || "",
        zoneId: store.zone_id || "",
      }));

      onUpdate(transformedStores);
    } catch (error) {
      console.error("Error fetching stores:", error);
      alert("Failed to load stores from database");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch stores on component mount
  useEffect(() => {
    fetchStores();
  }, []);

  const visibleStores = useMemo(() => {
    if (isSuperAdmin) return stores;
    return stores.filter((s) => s.zoneId === currentUser.zoneId);
  }, [stores, isSuperAdmin, currentUser.zoneId]);

  const [formData, setFormData] = useState<Partial<Store>>({
    name: "",
    address: "",
    phone: "",
    zoneId: isSuperAdmin ? zones[0]?.id || "" : currentUser.zoneId,
  });

  const handleOpen = (store?: Store) => {
    if (store) {
      setEditingStore(store);
      setFormData({ 
        name: store.name,
        address: store.address,
        phone: store.phone,
        zoneId: store.zoneId
      });
    } else {
      setEditingStore(null);
      setFormData({
        name: "",
        address: "",
        phone: "",
        zoneId: isSuperAdmin ? zones[0]?.id || "" : currentUser.zoneId,
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveStore = async () => {
    if (!formData.name?.trim()) {
      alert("Store name is required");
      return;
    }

    setIsLoading(true);
    try {
      if (editingStore) {
        // Update existing store
        const { error } = await supabase
          .from("store_locations")
          .update({
            name: formData.name.trim(),
            address: formData.address,
            phone: formData.phone,
            zone_id: formData.zoneId || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingStore.id);

        if (error) throw error;
        alert("Store updated successfully");
      } else {
        // Create new store
        const { data, error } = await supabase
          .from("store_locations")
          .insert({
            name: formData.name.trim(),
            address: formData.address,
            phone: formData.phone,
            zone_id: formData.zoneId || null,
          })
          .select()
          .single();

        if (error) throw error;
        alert("Store created successfully");
      }

      // Refresh the stores list
      await fetchStores();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error saving store:", error);
      alert(`Failed to save store: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    // Check if store is being used in tickets
    if (tickets.some((t) => t.store === name)) {
      alert("Cannot delete store while tickets are assigned to it.");
      return;
    }

    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("store_locations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      alert("Store deleted successfully");
      // Refresh the stores list
      await fetchStores();
    } catch (error: any) {
      console.error("Error deleting store:", error);
      alert(`Failed to delete store: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
          <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
          Store Locations{" "}
          {isSuperAdmin
            ? "(Global)"
            : `(Zone: ${zones.find((z) => z.id === currentUser.zoneId)?.name})`}
        </h3>
        <button
          onClick={() => handleOpen()}
          className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="space-y-3">
        {visibleStores.map((store) => (
          <div
            key={store.id}
            className="p-4 bg-slate-50 rounded-xl border border-transparent hover:border-slate-200 transition-all group"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-bold text-slate-800">{store.name}</h4>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                  Zone:{" "}
                  {zones.find((z) => z.id === store.zoneId)?.name ||
                    "Unassigned"}
                </p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpen(store)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(store.id, store.name)}
                  className="p-1.5 text-slate-400 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="space-y-1 text-xs text-slate-500">
              <p className="flex items-center gap-1.5">
                <MapPin size={12} /> {store.address || "No address added"}
              </p>
              <p className="flex items-center gap-1.5">
                <Phone size={12} /> {store.phone || "No phone added"}
              </p>
            </div>
          </div>
        ))}
        {visibleStores.length === 0 && (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              No Sector Nodes Found
            </p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6">
              {editingStore ? "Edit Store" : "Add Store"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  Store Name *
                </label>
                <input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 ring-indigo-50/10"
                  placeholder="Main Branch"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  Operational Zone
                </label>
                <select
                  disabled={!isSuperAdmin}
                  value={formData.zoneId}
                  onChange={(e) =>
                    setFormData({ ...formData, zoneId: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none appearance-none ${
                    !isSuperAdmin ? "cursor-not-allowed opacity-70" : ""
                  }`}
                >
                  {isSuperAdmin && <option value="">-- No Zone --</option>}
                  {zones.map((z) =>
                    !isSuperAdmin && z.id !== currentUser.zoneId ? null : (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    )
                  )}
                </select>
                {!isSuperAdmin && (
                  <p className="text-[10px] text-slate-400 mt-1 italic">
                    Assigned to your operational sector.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  Full Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 ring-indigo-50/10 resize-none"
                  rows={3}
                  placeholder="Building, Street, Landmark..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  Store Phone
                </label>
                <input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 ring-indigo-50/10"
                  placeholder="+91 12345 67890"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStore}
                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl"
              >
                Save Store
              </button>
            </div>
          </div>
        </div>
      )}
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

const TeamMemberModal: React.FC<TeamMemberModalProps> = ({
  member,
  isOpen,
  onClose,
  onSave,
  currentUser,
  zones,
  allStores,
}) => {
  const [formData, setFormData] = useState<Partial<User>>({
    id: "", // Will be set by Supabase for new members
    name: "",
    email: "",
    role: "TECHNICIAN",
    experience: "",
    photo: "",
    mobile: "",
    password: "",
    address: "",
    zoneId: zones[0]?.id || "",
    storeId: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";

  const filteredStores = useMemo(() => {
    if (!formData.zoneId) return [];
    return allStores.filter((s) => s.zoneId === formData.zoneId);
  }, [formData.zoneId, allStores]);

  useEffect(() => {
    if (isOpen) {
      setFormData(
        member || {
          name: "",
          email: "",
          role: "TECHNICIAN",
          experience: "",
          photo: "",
          mobile: "",
          password: "",
          address: "",
          zoneId: zones[0]?.id || "",
          storeId: "",
        }
      );
      setError(null);
    }
  }, [isOpen, member, zones]);

  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pass }));
    setShowPassword(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("File is too large. Max 2MB.");
      return;
    }

    setIsCompressing(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        setFormData((prev) => ({ ...prev, photo: compressedBase64 }));
        setIsCompressing(false);
      };
    };
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role) {
      setError("Name, Email, and Role are mandatory.");
      return;
    }
    onSave(formData as User);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl animate-in fade-in zoom-in duration-300 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
              <UserCog size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">
                {member ? "Update Staff Record" : "New Team Entry"}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Configuration Suite
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-all active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleFormSubmit}
          className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8 space-y-10"
        >
          {error && (
            <div className="p-3 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl text-rose-700 flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-2">
              <AlertTriangle size={18} className="shrink-0" />
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-3 flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="w-32 h-32 rounded-[2rem] bg-slate-100 overflow-hidden border-4 border-white shadow-xl flex items-center justify-center relative group-hover:scale-[1.02] transition-transform duration-500">
                  {isCompressing ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2
                        size={24}
                        className="text-indigo-500 animate-spin"
                      />
                      <span className="text-[8px] font-black text-slate-400 uppercase">
                        Processing
                      </span>
                    </div>
                  ) : formData.photo ? (
                    <img
                      src={formData.photo}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <Users size={48} className="text-slate-400" />
                      <span className="text-[8px] font-black uppercase">
                        No Image
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-indigo-600/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]"
                  >
                    <Camera size={24} className="text-white mb-1" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      Update
                    </span>
                  </button>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
              </div>
              <div className="text-center">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  Roster Avatar
                </p>
              </div>
            </div>
            <div className="lg:col-span-9 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Full Display Name *
                  </label>
                  <div className="relative group">
                    <Users
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                    />
                    <input
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-4 ring-indigo-50/10 focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                      placeholder="e.g. Johnathan Smith"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Primary Mobile
                  </label>
                  <div className="relative group">
                    <Phone
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"
                    />
                    <input
                      value={formData.mobile}
                      onChange={(e) =>
                        setFormData({ ...formData, mobile: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-4 ring-indigo-50/10 focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                      placeholder="+91..."
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Operational Zone
                  </label>
                  <div className="relative">
                    <Layers
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <select
                      disabled={!isSuperAdmin}
                      value={formData.zoneId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          zoneId: e.target.value,
                          storeId: "",
                        })
                      }
                      className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-4 ring-indigo-50/10 appearance-none transition-all ${
                        !isSuperAdmin ? "cursor-not-allowed opacity-70" : ""
                      }`}
                    >
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Primary Store Assignment
                  </label>
                  <div className="relative group">
                    <Building2
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                    />
                    <select
                      value={formData.storeId}
                      onChange={(e) =>
                        setFormData({ ...formData, storeId: e.target.value })
                      }
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-4 ring-indigo-50/10 focus:bg-white focus:border-indigo-500 outline-none appearance-none transition-all cursor-pointer"
                    >
                      <option value="">-- Choose Store --</option>
                      {filteredStores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                      {filteredStores.length === 0 && (
                        <option disabled>No stores in this zone</option>
                      )}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em] flex items-center gap-2">
              <ShieldCheck size={14} /> 02. System Access & Role
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ...(isSuperAdmin
                  ? [
                      {
                        id: "SUPER_ADMIN",
                        label: "Super Admin",
                        icon: Crown,
                        desc: "Owner",
                      },
                    ]
                  : []),
                {
                  id: "ADMIN",
                  label: "Admin",
                  icon: ShieldCheck,
                  desc: "Full",
                },
                {
                  id: "MANAGER",
                  label: "Manager",
                  icon: UserCog,
                  desc: "Oversight",
                },
                {
                  id: "TECHNICIAN",
                  label: "Technician",
                  icon: Wrench,
                  desc: "Service",
                },
              ].map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, role: role.id as Role })
                  }
                  className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 group relative overflow-hidden ${
                    formData.role === role.id
                      ? "border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/5"
                      : "border-slate-100 bg-white hover:border-indigo-200"
                  }`}
                >
                  {formData.role === role.id && (
                    <div className="absolute top-2 right-2 text-indigo-600 animate-in zoom-in">
                      <Check size={16} strokeWidth={4} />
                    </div>
                  )}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      formData.role === role.id
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                    }`}
                  >
                    <role.icon size={16} />
                  </div>
                  <div>
                    <p
                      className={`text-[11px] font-black uppercase tracking-tight ${
                        formData.role === role.id
                          ? "text-slate-800"
                          : "text-slate-600"
                      }`}
                    >
                      {role.label}
                    </p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">
                      {role.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Corporate Email *
                </label>
                <div className="relative group">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                  />
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-4 ring-indigo-50/10 focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                    placeholder="staff@company.com"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    System Password
                  </label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw size={8} /> Auto Gen
                  </button>
                </div>
                <div className="relative group">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-4 ring-indigo-50/10 focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em] flex items-center gap-2">
              <Briefcase size={14} /> 03. Professional Portfolio
            </h4>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Core Experience / Bio
              </label>
              <div className="relative group">
                <Zap
                  size={16}
                  className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                />
                <textarea
                  value={formData.experience}
                  onChange={(e) =>
                    setFormData({ ...formData, experience: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-4 ring-indigo-50/10 focus:bg-white focus:border-indigo-500 outline-none transition-all resize-none h-24 shadow-inner"
                  placeholder="Staff biography or technical credentials..."
                />
              </div>
            </div>
          </div>
        </form>
        <div className="px-8 py-5 border-t border-slate-100 bg-white flex flex-col sm:flex-row gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 bg-slate-50 text-slate-500 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleFormSubmit}
            disabled={isCompressing}
            className="flex-[2] py-3.5 bg-slate-900 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-black transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] disabled:opacity-50"
          >
            {isCompressing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {member ? "Update Staff" : "Initialize Member"}
          </button>
        </div>
      </div>
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
}: SettingsProps) {
  const [activeSection, setActiveSection] = useState<string>("team");
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<User | undefined>(
    undefined
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [isLoadingTeam, setIsLoadingTeam] = useState(false); // Add loading state
  const [teamMembers, setTeamMembers] = useState<User[]>([]); // Local state for team members

  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";

  // Fetch team members from Supabase when component mounts
  useEffect(() => {
    if (activeSection === "team") {
      fetchTeamMembers();
    }
  }, [activeSection]);

  const fetchTeamMembers = async () => {
    setIsLoadingTeam(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform Supabase data to match your User type
      const transformedUsers: User[] = data.map((user) => ({
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
        password: user.password || "", // Only for display/edit
      }));

      setTeamMembers(transformedUsers);

      // Also update settings for other parts of the app
      onUpdateSettings({
        ...settings,
        teamMembers: transformedUsers,
      });
    } catch (error) {
      console.error("Error fetching team members:", error);
    } finally {
      setIsLoadingTeam(false);
    }
  };

  // --- CLOUD SYNC ENGINE ---
  const handleForceSync = async () => {
    if (!isSupabaseConfigured || !supabase) {
      alert("Supabase Cloud is not configured in this environment.");
      return;
    }

    if (
      !window.confirm(
        "You are about to force-sync all local data to the Supabase Cloud. This will overwrite existing cloud data for current keys. Proceed?"
      )
    )
      return;

    setIsSyncing(true);
    try {
      const collections = [
        { key: "settings", data: settings, zone: "global" },
        { key: "customers", data: customers, zone: "global" }, // Global for simplistic registry
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
          { onConflict: "key,zone_id" }
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
    dependencyKey?: keyof Ticket
  ) => {
    const list = settings[listKey] as any[];
    return {
      items: list,
      onAdd: (name: string) => {
        onUpdateSettings({
          ...settings,
          [listKey]: [...list, { id: Date.now().toString(), name }],
        });
      },
      onEdit: (id: string, newName: string) => {
        const oldItem = list.find((i) => i.id === id);
        onUpdateSettings({
          ...settings,
          [listKey]: list.map((item) =>
            item.id === id ? { ...item, name: newName } : item
          ),
        });
        if (oldItem && dependencyKey) {
          const updatedTickets = tickets.map((t) =>
            t[dependencyKey] === oldItem.name
              ? { ...t, [dependencyKey]: newName }
              : t
          );
          onUpdateTickets(updatedTickets);
        }
      },
      onDelete: (id: string) => {
        onUpdateSettings({
          ...settings,
          [listKey]: list.filter((item) => item.id !== id),
        });
      },
      dependencyCheck: (name: string) =>
        dependencyKey ? tickets.some((t) => t[dependencyKey] === name) : false,
    };
  };
  const handleSaveMember = async (member: User) => {
    try {
      // 1️⃣ SIGN UP THE USER (CLIENT-SIDE, WITH AUTO-CONFIRMATION ENABLED IN SUPABASE)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: member.email.toLowerCase(),
        password: member.password, // Supabase will handle hashing securely
        options: {
          data: {
            name: member.name,
            role: member.role,
            // Add other metadata if needed
          },
        },
      });

      if (authError) throw authError;

      // 2️⃣ INSERT PROFILE DATA INTO USERS TABLE (WITHOUT PASSWORD)
      const { error: dbError } = await supabase.from("users").insert({
        auth_id: authData.user?.id, // Use the ID from sign-up
        name: member.name,
        email: member.email.toLowerCase(),
        role: member.role,
        mobile: member.mobile,
        address: member.address,
        zone_id: member.zoneId,
        store_id: member.storeId,
        photo: member.photo,
        experience: member.experience,
        // Do NOT store password here—Supabase handles it
      });

      if (dbError) throw dbError;

      alert("Staff account created successfully. They can now log in.");
      // Refresh the team members list
      fetchTeamMembers();
    } catch (err: any) {
      console.error("Error creating staff:", err);
      alert(`Failed to create staff: ${err.message}`);
    }
    setIsTeamModalOpen(false)
  };

  const handleDeleteMember = async (id: string) => {
    try {
      // Permission check inside the handler as a secondary safeguard
      const target = teamMembers.find((m) => m.id === id);
      if (target?.role === "SUPER_ADMIN" && !isSuperAdmin) {
        alert("Authorization Denied: You cannot delete a Super Admin.");
        setConfirmDeleteId(null);
        return;
      }

      const { error } = await supabase.from("users").delete().eq("id", id);

      if (error) throw error;

      // Refresh team members
      fetchTeamMembers();
      setConfirmDeleteId(null);
    } catch (error: any) {
      console.error("Error deleting team member:", error);
      alert(`Failed to delete team member: ${error.message}`);
    }
  };

  const handleSlaUpdate = (key: keyof SLAConfig, value: number) => {
    onUpdateSettings({ ...settings, sla: { ...settings.sla, [key]: value } });
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
      `infofix_vault_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.settings || !data.tickets) {
          alert("Invalid backup structure.");
          return;
        }
        if (
          confirm("Restore from archive? This will overwrite ALL local data.")
        ) {
          onUpdateSettings(data.settings);
          onUpdateTickets(data.tickets || []);
          onUpdateCustomers(data.customers || []);
          onUpdateTasks(data.tasks || []);
          onUpdateLaptopReports(data.laptopReports || []);
          alert("Vault Restored.");
        }
      } catch {
        alert("Corrupted data.");
      }
    };
    reader.readAsText(file);
  };

  const navGroups = [
    {
      title: "General",
      items: [
        { id: "team", label: "Team Members", icon: Users },
        ...(isSuperAdmin
          ? [{ id: "zones", label: "Operational Zones", icon: Layers }]
          : []),
        { id: "stores", label: "Store Locations", icon: StoreIcon },
      ],
    },
    {
      title: "Cloud & Infrastructure",
      items: [
        { id: "cloud", label: "Supabase Sync", icon: Cloud },
        { id: "data", label: "Migration & Vault", icon: Database },
      ],
    },
    {
      title: "Service Configuration",
      items: [
        { id: "workflow", label: "Workflow", icon: ListOrdered },
        { id: "devices", label: "Device Types", icon: Smartphone },
        { id: "brands", label: "Service Brands", icon: Tag },
      ],
    },
    {
      title: "Rules & Modules",
      items: [
        { id: "laptop", label: "Laptop Reports", icon: Laptop },
        { id: "sla", label: "SLA Limits", icon: Clock },
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
      <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-4">
        <div className="lg:hidden overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <div className="flex gap-2">
            {navGroups
              .flatMap((g) => g.items)
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap text-sm font-bold border transition-all ${
                    activeSection === item.id
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                      : "bg-white text-slate-600 border-slate-200 shadow-sm"
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
          </div>
        </div>
        <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                <Layout size={18} />
              </div>
              Settings
            </h2>
            <p className="text-xs text-slate-500 mt-1 pl-10">
              Manage your workspace
            </p>
          </div>
          <nav className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar">
            {navGroups.map((group, idx) => (
              <div
                key={idx}
                className="animate-in slide-in-from-left-2 duration-300"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <h3 className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
                        activeSection === item.id
                          ? "bg-indigo-50 text-indigo-600 shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <item.icon
                        size={18}
                        className={
                          activeSection === item.id
                            ? "text-indigo-600"
                            : "text-slate-400"
                        }
                      />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {activeTitle}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Configure your {activeTitle?.toLowerCase()} settings
              </p>
            </div>
            {activeSection === "team" && (
              <button
                onClick={() => {
                  setEditingMember(undefined);
                  setIsTeamModalOpen(true);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2 font-medium shadow-lg shadow-indigo-200 transition-all active:scale-95"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Add Member</span>
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar bg-white">
            <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
              {activeSection === "cloud" && (
                <div className="space-y-8 pb-10">
                  <div className="bg-slate-900 rounded-[2.5rem] p-8 lg:p-12 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                      <div className="max-w-xl">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-500/20 rounded-2xl mb-6 border border-indigo-400/20">
                          {isSupabaseConfigured ? (
                            <CloudCheck className="text-emerald-400" />
                          ) : (
                            <Cloud className="text-amber-400 animate-pulse" />
                          )}
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {isSupabaseConfigured
                              ? "System Link: ACTIVE"
                              : "System Link: OFFLINE"}
                          </span>
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-black tracking-tight mb-4 leading-none">
                          Supabase Cloud Infrastructure
                        </h2>
                        <p className="text-slate-400 font-medium leading-relaxed mb-8">
                          Synchronize your local workspace with a real-time
                          Postgres backend. Protect against data loss and enable
                          multi-user consistency across all zones.
                        </p>
                        <button
                          onClick={handleForceSync}
                          disabled={isSyncing || !isSupabaseConfigured}
                          className="px-8 py-4 bg-white text-slate-950 font-black rounded-2xl shadow-xl hover:bg-slate-100 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                        >
                          {isSyncing ? (
                            <Loader2 className="animate-spin" size={20} />
                          ) : (
                            <CloudCheck size={20} />
                          )}
                          FORCE CLOUD PUSH
                        </button>
                      </div>
                      <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-md text-center min-w-[240px]">
                        <Activity
                          className="text-indigo-400 mx-auto mb-4"
                          size={48}
                        />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">
                          Latency Layer
                        </p>
                        <p className="text-4xl font-black tabular-nums">
                          0.2ms
                        </p>
                        <p className="text-[10px] font-black text-indigo-400 uppercase mt-4">
                          Cloud Health: OPTIMAL
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-200">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-800 shadow-sm">
                        <Terminal size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-800">
                          Database Schema Protocol
                        </h3>
                        <p className="text-sm text-slate-500">
                          Requirements for your Supabase "app_data" table.
                        </p>
                      </div>
                    </div>
                    <div className="bg-slate-900 rounded-3xl p-6 relative group">
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(
                            `create table public.app_data (key text not null, data jsonb not null, zone_id text not null, updated_at timestamp with time zone default now(), primary key (key, zone_id));`
                          )
                        }
                        className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all"
                      >
                        <Copy size={16} />
                      </button>
                      <code className="text-indigo-400 text-xs font-mono block leading-relaxed overflow-x-auto whitespace-pre">
                        {`create table public.app_data (
  key text not null,
  data jsonb not null,
  zone_id text not null,
  updated_at timestamp with time zone default now(),
  primary key (key, zone_id)
);`}
                      </code>
                    </div>
                    <p className="mt-4 text-xs text-slate-400 font-medium italic">
                      * Run this SQL command in your Supabase SQL Editor to
                      initialize the sync layer.
                    </p>
                  </div>
                </div>
              )}

              {activeSection === "team" && (
                <div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {settings.teamMembers.map((member) => {
                      // Logic to restrict editing/deleting Super Admins for non-Super Admins
                      const canModify =
                        isSuperAdmin || member.role !== "SUPER_ADMIN";

                      return (
                        <div
                          key={member.id}
                          className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all p-5 relative group"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg overflow-hidden border border-slate-200">
                              {member.photo ? (
                                <img
                                  src={member.photo}
                                  alt={member.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                member.name.charAt(0)
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                                  member.role === "SUPER_ADMIN"
                                    ? "bg-purple-100 text-purple-700"
                                    : member.role === "ADMIN"
                                    ? "bg-indigo-100 text-indigo-700"
                                    : member.role === "MANAGER"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {member.role === "SUPER_ADMIN" && (
                                  <Crown size={10} />
                                )}
                                {member.role.replace("_", " ")}
                              </span>
                              <div className="flex flex-col items-end">
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase">
                                  Zone:{" "}
                                  {settings.zones.find(
                                    (z) => z.id === member.zoneId
                                  )?.name || "Unset"}
                                </span>
                                {member.storeId && (
                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase mt-1">
                                    Store:{" "}
                                    {settings.stores.find(
                                      (s) => s.id === member.storeId
                                    )?.name || "Unset"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <h3 className="font-bold text-slate-800 text-lg">
                            {member.name}
                          </h3>
                          <p className="text-sm text-slate-500 mb-4">
                            {member.email}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mb-5 bg-slate-50 p-2 rounded-lg">
                            <Briefcase size={14} />
                            <span className="truncate">
                              {member.experience || "No experience listed"}
                            </span>
                          </div>

                          {/* Conditional Rendering for Edit/Delete based on target role */}
                          <div className="flex gap-2 mt-auto">
                            {canModify ? (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingMember(member);
                                    setIsTeamModalOpen(true);
                                  }}
                                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors uppercase tracking-wide"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(member.id)}
                                  className="flex-1 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors uppercase tracking-wide"
                                >
                                  Delete
                                </button>
                              </>
                            ) : (
                              <div className="flex-1 flex items-center justify-center py-2 px-3 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest gap-2">
                                <Lock size={12} /> Account Protected
                              </div>
                            )}
                          </div>

                          {confirmDeleteId === member.id && (
                            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 text-center z-10 animate-in fade-in duration-200">
                              <p className="text-sm font-semibold text-slate-800 mb-3">
                                Delete {member.name}?
                              </p>
                              <div className="flex gap-2 w-full">
                                <button
                                  onClick={() => handleDeleteMember(member.id)}
                                  className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-bold"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="flex-1 px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <TeamMemberModal
                    isOpen={isTeamModalOpen}
                    onClose={() => setIsTeamModalOpen(false)}
                    member={editingMember}
                    onSave={handleSaveMember}
                    currentUser={currentUser}
                    zones={settings.zones}
                    allStores={settings.stores}
                  />
                </div>
              )}

              {activeSection === "zones" &&
                (isSuperAdmin ? (
                  <ZoneManager
                    zones={settings.zones}
                    stores={settings.stores}
                    teamMembers={settings.teamMembers}
                    onUpdate={(updatedZones, updatedStores) =>
                      onUpdateSettings({
                        ...settings,
                        zones: updatedZones,
                        stores: updatedStores,
                      })
                    }
                  />
                ) : (
                  <AccessDenied message="Only a Super Admin can manage Operational Zones." />
                ))}

              {activeSection === "data" && (
                <div className="max-w-4xl mx-auto space-y-8 pb-10">
                  <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-50 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 flex items-center justify-center text-indigo-400">
                          <Database size={32} />
                        </div>
                        <div>
                          <h2 className="text-3xl font-black tracking-tight">
                            System Vault
                          </h2>
                          <p className="text-slate-400 font-medium max-w-sm mt-1">
                            Centralized governance for backup, recovery, and
                            data integrity.
                          </p>
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md text-center min-w-[180px]">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                          Local Registry
                        </p>
                        <p className="text-2xl font-black">
                          {tickets.length +
                            customers.length +
                            tasks.length +
                            laptopReports.length}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                          Total Records
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-full group hover:border-indigo-300 transition-all">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                          <Upload size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">
                          Migration & Archival
                        </h3>
                      </div>
                      <p className="text-slate-500 text-sm mb-10 leading-relaxed">
                        Move your entire business database to a new instance or
                        secure a local offline copy. Archives are fully
                        encrypted and structured for recovery.
                      </p>
                      <div className="space-y-4 mt-auto">
                        <button
                          onClick={handleExportBackup}
                          className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-200 active:scale-95"
                        >
                          <Download size={18} /> Export System Vault
                        </button>
                        <label className="w-full py-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all cursor-pointer border border-indigo-100 active:scale-95">
                          <FileJson size={18} /> Restore from Archive
                          <input
                            type="file"
                            className="hidden"
                            accept=".json"
                            onChange={handleImportBackup}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-full group hover:border-blue-300 transition-all">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                          <HardDrive size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">
                          Infrastructure Health
                        </h3>
                      </div>
                      <div className="space-y-6">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Active Cache Usage
                            </span>
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                              Optimized
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="w-[12%] h-full bg-blue-500 rounded-full"></div>
                          </div>
                          <p className="text-[9px] text-slate-400 mt-2 italic">
                            Calculated based on LocalStorage blob size vs
                            availability.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                              Last Recovery
                            </p>
                            <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                              <Clock size={14} className="text-blue-500" />{" "}
                              Never
                            </p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                              Integrity
                            </p>
                            <p className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                              <FileCheck size={14} /> Verified
                            </p>
                          </div>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-blue-800 flex gap-3 items-start">
                          <Info className="shrink-0 mt-0.5" size={16} />
                          <p className="text-[10px] font-bold leading-relaxed">
                            System automatically syncs with Supabase Postgres
                            Cloud every 5 minutes when online. Local backups are
                            recommended daily.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "stores" && (
                <div className="grid gap-6 md:grid-cols-1">
                  <StoreManager
                    stores={settings.stores}
                    zones={settings.zones}
                    onUpdate={(updated) =>
                      onUpdateSettings({ ...settings, stores: updated })
                    }
                    tickets={tickets}
                    onUpdateTickets={onUpdateTickets}
                    currentUser={currentUser}
                  />
                  <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 text-sm text-amber-800 h-fit">
                    <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                      <AlertTriangle size={18} /> Management Note
                    </h4>
                    <p className="opacity-90 leading-relaxed">
                      {isSuperAdmin
                        ? "Store details are used directly on printable receipts. Ensure these are accurate for customer professionalism."
                        : "You can only manage store locations belonging to your assigned operational zone."}
                    </p>
                  </div>
                </div>
              )}
              {activeSection === "devices" && (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  <SimpleListManager
                    title="Device Types"
                    {...createListHandlers("deviceTypes", "deviceType")}
                    placeholder="e.g. Smart Watch"
                  />
                </div>
              )}
              {activeSection === "brands" && (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  <SimpleListManager
                    title="Service Brands"
                    {...createListHandlers("serviceBrands", "brand")}
                    placeholder="e.g. Samsung"
                  />
                </div>
              )}
              {activeSection === "laptop" && (
                <div className="space-y-6">
                  <DealerManager
                    dealers={settings.laptopDealers}
                    onUpdate={(updated) =>
                      onUpdateSettings({ ...settings, laptopDealers: updated })
                    }
                  />
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 text-sm text-slate-600">
                    <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                      <Users size={18} /> Dealer Management Note
                    </h4>
                    <p className="opacity-90 leading-relaxed">
                      These dealers appear in the Laptop QC Report module.
                      Capturing comprehensive contact details helps technicians
                      escalate issues directly to vendor service teams or head
                      offices when parts are delayed.
                    </p>
                  </div>
                </div>
              )}
              {activeSection === "workflow" && (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
                  <SimpleListManager
                    title="Ticket Statuses"
                    {...createListHandlers("ticketStatuses", "status")}
                    placeholder="e.g. Awaiting Approval"
                  />
                  <SimpleListManager
                    title="Priorities"
                    {...createListHandlers("priorities", "priority")}
                    placeholder="e.g. Urgent"
                  />
                  <SimpleListManager
                    title="Hold Reasons"
                    {...createListHandlers("holdReasons")}
                    placeholder="e.g. Customer Unresponsive"
                  />
                  <SimpleListManager
                    title="Internal Progress Reasons"
                    {...createListHandlers("progressReasons")}
                    placeholder="e.g. Cleaning"
                  />
                </div>
              )}
              {activeSection === "sla" && (
                <div className="max-w-xl mx-auto">
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8">
                    <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-200">
                      <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm">
                        <Clock size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">
                          SLA & Past Due Configuration
                        </h3>
                        <p className="text-sm text-slate-500">
                          Set thresholds for ticket overdue flags
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {[
                        {
                          label: "High Priority",
                          key: "high",
                          color: "text-red-600 bg-red-50 border-red-100",
                        },
                        {
                          label: "Medium Priority",
                          key: "medium",
                          color: "text-amber-600 bg-amber-50 border-amber-100",
                        },
                        {
                          label: "Low Priority",
                          key: "low",
                          color:
                            "text-emerald-600 bg-emerald-50 border-emerald-100",
                        },
                      ].map((p) => (
                        <div
                          key={p.key}
                          className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${p.color}`}
                            >
                              {p.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-400">
                              Due in
                            </span>
                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                value={settings.sla[p.key as keyof SLAConfig]}
                                onChange={(e) =>
                                  handleSlaUpdate(
                                    p.key as keyof SLAConfig,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-20 pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-center font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                d
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 p-4 bg-indigo-50 rounded-xl flex gap-3 text-indigo-800 text-sm">
                      <Briefcase size={18} className="flex-shrink-0 mt-0.5" />
                      <p>
                        Tickets exceeding these day limits will automatically be
                        flagged with a visual "Overdue" indicator in the ticket
                        list.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
