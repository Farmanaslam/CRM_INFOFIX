import React, { useState, useEffect, useMemo } from "react";
import {
  PenTool,
  History,
  AlertTriangle,
  Search,
  User,
  Phone,
  MapPin,
  Check,
  ChevronDown,
  Activity,
  Monitor,
  Layers,
  Tag,
  DollarSign,
  X,
  Loader2,
  Smartphone,
  Laptop,
  Cctv,
  Keyboard,
  ChevronLeft,
  Sparkles,
  Zap,
  Building2,
  CalendarDays,
  ShieldCheck,
  Package,
} from "lucide-react";
import {
  Ticket,
  Customer,
  AppSettings,
  User as AppUser,
  TicketHistory,
} from "../types";
import { supabase } from "../supabaseClient";

// Helper to generate IDs
const generateId = (prefix: string, list: any[]) => {
  const safeList = list || [];
  const count = safeList.length + 1;
  const padded = count.toString().padStart(3, "0");
  return `${prefix}-${padded}`;
};

interface TicketFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  setCustomers: (c: Customer[]) => void;
  setTickets: (t: Ticket[]) => void;
  tickets: Ticket[];
  settings: AppSettings;
  currentUser: AppUser;
  editingTicket?: Ticket | null;
  onSuccess?: () => void;
}

export const TicketFormModal: React.FC<TicketFormModalProps> = ({
  isOpen,
  onClose,
  customers = [],
  setCustomers,
  setTickets,
  tickets = [],
  settings,
  currentUser,
  editingTicket,
  onSuccess,
}) => {
  // UI State
  const [activeTab, setActiveTab] = useState<"details" | "history">("details");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const initialFormState = {
    email: "",
    name: "",
    mobile: "",
    address: "",
    deviceType: "Smartphone",
    brand: "",
    model: "",
    serial: "",
    chargerIncluded: "No",
    deviceDescription: "",
    issueDescription: "",
    store: settings?.stores?.[0]?.name || "",
    estimatedAmount: "",
    warranty: "No",
    billNumber: "",
    priority: "Medium",
    status: "New",
    holdReason: "",
    progressReason: "",
    progressNote: "",
    scheduledDate: "",
    assignedToId: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState<string | null>(null);

  const isAdmin =
    currentUser.role === "SUPER_ADMIN" ||
    currentUser.role === "ADMIN" ||
    currentUser.role === "MANAGER";

  // Quick Issue Chips
  const commonIssues = [
    "Broken Screen",
    "Battery Not Charging",
    "Water Damage",
    "Slow Performance",
    "Software Hanging",
    "Keypad Issue",
    "No Display",
    "WiFi Not Working",
  ];

  // Initialize form
  useEffect(() => {
    if (isOpen) {
      setActiveTab("details");
      setIsSubmitting(false);
      if (editingTicket) {
        setFormData({
          email: editingTicket.email,
          name: editingTicket.name,
          mobile: editingTicket.number,
          address: editingTicket.address,
          deviceType: editingTicket.deviceType,
          brand: editingTicket.brand || "",
          model: editingTicket.model || "",
          serial: editingTicket.serial || "",
          chargerIncluded: editingTicket.chargerIncluded ? "Yes" : "No",
          deviceDescription: editingTicket.deviceDescription || "",
          issueDescription: editingTicket.issueDescription,
          store: editingTicket.store,
          estimatedAmount: editingTicket.estimatedAmount?.toString() || "",
          warranty: editingTicket.warranty ? "Yes" : "No",
          billNumber: editingTicket.billNumber || "",
          priority: editingTicket.priority,
          status: editingTicket.status,
          holdReason: editingTicket.holdReason || "",
          progressReason: editingTicket.progressReason || "",
          progressNote: editingTicket.progressNote || "",
          scheduledDate: editingTicket.scheduledDate || "",
          assignedToId: editingTicket.assignedToId || "",
        });
      } else {
        setFormData(initialFormState);
      }
      setError(null);
    }
  }, [isOpen, editingTicket]);

  const selectedStoreZone = useMemo(() => {
    const store = settings.stores.find((s) => s.name === formData.store);
    if (!store) return null;
    return settings.zones.find((z) => z.id === store.zoneId);
  }, [formData.store, settings.stores, settings.zones]);

  const handleQuickIssue = (issue: string) => {
    setFormData((prev) => ({
      ...prev,
      issueDescription: prev.issueDescription
        ? `${prev.issueDescription}, ${issue}`
        : issue,
    }));
  };

  const createHistoryEntry = (
    action: string,
    details: string
  ): TicketHistory => ({
    id: Date.now().toString() + Math.random().toString().slice(2, 5),
    date: new Date().toLocaleString(),
    timestamp: Date.now(),
    actorName: currentUser.name,
    actorRole: currentUser.role,
    action,
    details,
  });

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (
      !formData.name ||
      !formData.mobile ||
      !formData.issueDescription ||
      !formData.store
    ) {
      setError("Please fill in all mandatory fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1️⃣ Check / Create Customer
      let customerId: string;

      const existingCustomer = customers.find(
        (c) => c.email === formData.email
      );

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer, error: custErr } = await supabase
          .from("customers")
          .insert([
            {
              name: formData.name,
              email: formData.email,
              mobile: formData.mobile,
              address: formData.address,
            },
          ])
          .select("id")
          .single();

        if (custErr) throw custErr;

        customerId = newCustomer.id;

        setCustomers([...customers, newCustomer as Customer]);
      }

      // 2️⃣ Create / Update Ticket
      // Create / Update Ticket
      if (editingTicket) {
        const { error: updateError } = await supabase
          .from("tickets")
          .update({
            customer_id: customerId,
            subject: formData.issueDescription,
            status: formData.status,
            priority: formData.priority,
            assigned_to: formData.assignedToId,
            device_type: formData.deviceType,
            device_brand: formData.brand,
            device_model: formData.model,
            device_description: formData.deviceDescription,
            store: formData.store,
            amount_estimate: parseFloat(formData.estimatedAmount || "0"),
            warranty: formData.warranty,
            bill_number: formData.billNumber,
            scheduled_date: formData.scheduledDate || null, // ✅ here
          })
          .eq("id", editingTicket.id);
        if (updateError) throw updateError;
      } else {
        const ticketId = generateId("TKT-IF", tickets);
       const { data: newTicket, error: insertError } = await supabase
  .from("tickets")
  .insert([
    {
      user_id: currentUser?.id,
      customer_id: customerId,
      subject: formData.issueDescription,
      status: formData.status,
      priority: formData.priority,
      assigned_to: formData.assignedToId || null,
      device_type: formData.deviceType,
      device_brand: formData.brand,
      device_model: formData.model,
      device_description: formData.deviceDescription,
      store: formData.store,
      amount_estimate: parseFloat(formData.estimatedAmount || "0"),
      warranty: formData.warranty === "Yes",
      bill_number: formData.billNumber || null,
      scheduled_date: formData.scheduledDate || null,
    },
  ])
  .select()
  .single();

if (insertError) throw insertError;

setTickets([...(tickets || []), newTicket as Ticket]);
        if (newTicket && Array.isArray(newTicket) && newTicket.length > 0) {
          setTickets([...(tickets || []), newTicket[0] as Ticket]);
        }
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Error saving ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deviceIcons: Record<string, any> = {
    Smartphone: Smartphone,
    Laptop: Laptop,
    Desktop: Monitor,
    CCTV: Cctv,
    Accessory: Keyboard,
    Other: Zap,
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 lg:p-6">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={() => !isSubmitting && onClose()}
      />

      <div className="relative w-full max-w-7xl bg-slate-50 sm:rounded-[3rem] shadow-2xl flex flex-col h-full sm:h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        {/* HEADER */}
        <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-2xl shadow-lg ${
                editingTicket
                  ? "bg-amber-500 text-white"
                  : "bg-indigo-600 text-white"
              }`}
            >
              {editingTicket ? <PenTool size={24} /> : <Zap size={24} />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {editingTicket
                  ? `Edit Ticket ${editingTicket.ticketId}`
                  : "Create New Service Ticket"}
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                Unified Dispatch Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {editingTicket && (
              <div className="bg-slate-100 rounded-2xl p-1 hidden md:flex border border-slate-200 shadow-inner">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`px-6 py-2 text-xs font-black uppercase rounded-xl transition-all ${
                    activeTab === "details"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`px-6 py-2 text-xs font-black uppercase rounded-xl transition-all ${
                    activeTab === "history"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  History
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-rose-500 transition-all hover:scale-110 active:scale-95 shadow-sm"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* MAIN SCROLLABLE FORM AREA */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          {error && (
            <div className="mb-8 p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-2xl flex items-center gap-4 animate-in slide-in-from-top-2 shadow-sm">
              <AlertTriangle className="text-rose-600 shrink-0" size={24} />
              <span className="text-rose-800 font-bold text-sm">{error}</span>
            </div>
          )}

          {activeTab === "history" && editingTicket ? (
            /* AUDIT LOG VIEW */
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
              <div className="space-y-0 border-l-4 border-slate-200 pl-8 ml-4 py-4">
                {(editingTicket.history || [])
                  .slice()
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((log, i) => (
                    <div key={i} className="relative pb-10 last:pb-0 group">
                      <div className="absolute -left-[42px] top-0 w-8 h-8 rounded-full bg-white border-4 border-indigo-500 shadow-sm z-10 flex items-center justify-center">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      </div>
                      <div className="bg-white border border-slate-200 p-6 rounded-3xl group-hover:border-indigo-300 group-hover:shadow-md transition-all">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-black text-slate-800 text-sm uppercase tracking-tight">
                            {log.action}
                          </span>
                          <time className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                            {log.date}
                          </time>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                          {log.details}
                        </p>
                        <div className="mt-4 flex items-center gap-2">
                          <div className="w-6 h-6 bg-slate-100 rounded text-[9px] flex items-center justify-center font-bold text-slate-600 uppercase">
                            {log.actorName.charAt(0)}
                          </div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {log.actorName} ({log.actorRole})
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            /* SINGLE PAGE FORM DETAILS */
            <div className="space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT COLUMN: CLIENT HUB (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm h-full">
                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                      <User size={16} /> 01. Client Data
                    </h3>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Email / Account ID
                        </label>
                        <div className="relative group">
                          <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"
                            size={18}
                          />
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/5 focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                            placeholder="client@example.com"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Full Client Name *
                        </label>
                        <div className="relative group">
                          <User
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"
                            size={18}
                          />
                          <input
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/5 focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                            placeholder="Enter display name"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Primary Mobile *
                        </label>
                        <div className="relative group">
                          <Phone
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"
                            size={18}
                          />
                          <input
                            type="tel"
                            value={formData.mobile}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                mobile: e.target.value,
                              })
                            }
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/5 focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                            placeholder="+91 XXXXX XXXXX"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Full Address
                        </label>
                        <div className="relative group">
                          <MapPin
                            className="absolute left-4 top-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors"
                            size={18}
                          />
                          <textarea
                            value={formData.address}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                address: e.target.value,
                              })
                            }
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/5 focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner h-24 resize-none"
                            placeholder="Client residency details"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: ASSET & LOGISTICS (8 cols) */}
                <div className="lg:col-span-8 space-y-8">
                  {/* ASSET SECTION */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <h3 className="text-xs font-black text-emerald-600 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                      <Laptop size={16} /> 02. Asset Assessment
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
                      {settings.deviceTypes.map((d) => {
                        const Icon = deviceIcons[d.name] || Zap;
                        const isSelected = formData.deviceType === d.name;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, deviceType: d.name })
                            }
                            className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-2 group ${
                              isSelected
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 scale-105 ring-4 ring-indigo-500/10"
                                : "bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-500"
                            }`}
                          >
                            <Icon
                              size={22}
                              className={
                                isSelected
                                  ? "animate-in zoom-in-75"
                                  : "group-hover:scale-110 transition-transform"
                              }
                            />
                            <span className="text-[9px] font-black uppercase tracking-tighter text-center leading-tight">
                              {d.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Brand / Make
                        </label>
                        <input
                          value={formData.brand}
                          onChange={(e) =>
                            setFormData({ ...formData, brand: e.target.value })
                          }
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                          placeholder="Samsung, HP, Apple..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Model String
                        </label>
                        <input
                          value={formData.model}
                          onChange={(e) =>
                            setFormData({ ...formData, model: e.target.value })
                          }
                          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                          placeholder="e.g. Inspiron 15"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Reported Technical Issue *
                      </label>
                      <div className="relative">
                        <textarea
                          rows={4}
                          value={formData.issueDescription}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              issueDescription: e.target.value,
                            })
                          }
                          className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner resize-none leading-relaxed"
                          placeholder="Detail the fault for the technician..."
                        />
                        <div className="absolute right-4 bottom-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-100">
                          <Sparkles size={12} className="text-indigo-500" />{" "}
                          Diagnosis Capture
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {commonIssues.map((issue) => (
                          <button
                            key={issue}
                            type="button"
                            onClick={() => handleQuickIssue(issue)}
                            className="px-3 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-full text-[10px] font-black text-slate-500 hover:text-indigo-600 transition-all uppercase tracking-wider shadow-sm"
                          >
                            + {issue}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* LOGISTICS & WORKFLOW */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                      <h3 className="text-xs font-black text-amber-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                        <Building2 size={16} /> 03. Operations
                      </h3>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Receiving Store *
                        </label>
                        <div className="relative">
                          <Building2
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                            size={18}
                          />
                          <select
                            value={formData.store}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                store: e.target.value,
                              })
                            }
                            className="w-full pl-12 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none appearance-none cursor-pointer transition-all shadow-inner"
                          >
                            {settings.stores.map((s) => (
                              <option key={s.id} value={s.name}>
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

                      {selectedStoreZone && (
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-1">
                          <div className="w-10 h-10 rounded-xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-sm">
                            <Layers size={18} />
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                              Sector Tracking
                            </p>
                            <p className="text-sm font-black text-slate-800">
                              {selectedStoreZone.name}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Priority
                          </label>
                          <select
                            value={formData.priority}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                priority: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:bg-white transition-all outline-none"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">Urgent</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            SLA Warranty
                          </label>
                          <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 h-[46px]">
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({ ...formData, warranty: "Yes" })
                              }
                              className={`flex-1 rounded-lg text-[9px] font-black uppercase transition-all ${
                                formData.warranty === "Yes"
                                  ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
                                  : "text-slate-400 hover:text-slate-600"
                              }`}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({ ...formData, warranty: "No" })
                              }
                              className={`flex-1 rounded-lg text-[9px] font-black uppercase transition-all ${
                                formData.warranty === "No"
                                  ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
                                  : "text-slate-400 hover:text-slate-600"
                              }`}
                            >
                              No
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                      <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                        <ShieldCheck size={16} /> 04. Admin Workflow
                      </h3>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Estimated Cost (₹)
                        </label>
                        <div className="relative group">
                          <DollarSign
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500"
                            size={18}
                          />
                          <input
                            type="number"
                            value={formData.estimatedAmount}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                estimatedAmount: e.target.value,
                              })
                            }
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-black text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="space-y-4 animate-in fade-in">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                              Process Status
                            </label>
                            <div className="relative">
                              <Activity
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                                size={16}
                              />
                              <select
                                value={formData.status}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    status: e.target.value,
                                  })
                                }
                                className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:bg-white"
                              >
                                {settings.ticketStatuses.map((s) => (
                                  <option key={s.id} value={s.name}>
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
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                              Assign Technician
                            </label>
                            <div className="relative">
                              <User
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                                size={16}
                              />
                              <select
                                value={formData.assignedToId}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    assignedToId: e.target.value,
                                  })
                                }
                                className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:bg-white"
                              >
                                <option value="">Unassigned</option>
                                {settings.teamMembers.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown
                                size={14}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-8 py-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0 bg-white">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Network Secure
              </span>
            </div>
            <div className="h-4 w-px bg-slate-200"></div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              INFOFIX V3.0-PRO
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] hover:text-rose-500 transition-all active:scale-95"
            >
              Abandon
            </button>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-12 py-4 bg-slate-900 text-white font-black rounded-3xl shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 min-w-[220px]"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Check size={20} strokeWidth={4} />
              )}
              <span className="text-xs uppercase tracking-[0.2em]">
                {editingTicket ? "Apply Corrections" : "Commit Dispatch"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
