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
  Barcode,
  IndianRupee,
  Receipt,
  FileDigit,
  PauseCircle,
  ArrowLeftRight,
  Briefcase,
  Download,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Ticket,
  Customer,
  AppSettings,
  User as AppUser,
  TicketHistory,
  OperationalZone,
  Store,
} from "../types";
import { supabase } from "../supabaseClient";
import jsPDF from "jspdf";

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
  onRefresh?: () => Promise<void>;
  teamMembers: AppUser[];
  zones: OperationalZone[];
  stores: Store[];
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
  onRefresh,
  teamMembers,
  zones,
  stores=[],
}) => {
  // UI State
  const [activeTab, setActiveTab] = useState<"details" | "history">("details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferReason, setTransferReason] = useState("");
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
    store: "",

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

  const technicians = useMemo(() => {
    return (teamMembers || []).filter((member) => member.role === "TECHNICIAN");
  }, [teamMembers]);

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

  // Check if selected brand is a Service Brand
  const isServiceBrand = useMemo(() => {
    return settings.serviceBrands.some(
      (b) => b.name.toLowerCase() === formData.brand.trim().toLowerCase()
    );
  }, [formData.brand, settings.serviceBrands]);

  const selectedStoreZone = useMemo(() => {
    const store = stores?.find((s) => s.name === formData.store);
    if (!store) return null;
    return zones.find((z) => z.id === store.zoneId);
  }, [formData.store, stores, zones]);

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
  const isValidPhone = (phone: string) => {
    return /^\d{10}$/.test(phone);
  };

  const downloadHistoryPDF = () => {
    if (!editingTicket || !editingTicket.history) return;

    const doc = new jsPDF();

    // Header
    doc.setFillColor(79, 70, 229); // Indigo
    doc.rect(0, 0, 210, 24, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`Ticket History Log: ${editingTicket.ticketId}`, 10, 16);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 10, 290);

    let y = 40;

    [...editingTicket.history]
      .sort((a, b) => b.timestamp - a.timestamp)
      .forEach((h, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        // Draw timeline line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(15, y, 15, y + 20);
        doc.circle(15, y + 2, 2, "F");

        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(h.action, 25, y + 2);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(h.date, 160, y + 2, { align: "right" });

        doc.setTextColor(60, 60, 60);
        const details = doc.splitTextToSize(h.details, 150);
        doc.text(details, 25, y + 8);

        doc.setFont("helvetica", "boldOblique");
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `By: ${h.actorName} (${h.actorRole})`,
          25,
          y + 8 + details.length * 4 + 2
        );

        y += 20 + details.length * 4;
      });

    doc.save(`History_${editingTicket.ticketId}.pdf`);
  };

  const isStoreChanged =
    editingTicket && formData.store !== editingTicket.store;

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

    if (!isValidPhone(formData.mobile)) {
      setError("Please enter a valid 10-digit phone number.");
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

      const { data: lastTicket, error: lastErr } = await supabase
        .from("tickets")
        .select("id")
        .like("id", "TKT-IF-%")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (lastErr && lastErr.code !== "PGRST116") throw lastErr;

      // 🔹 Generate next TKT-IF ID
      let nextNumber = 1;

      if (lastTicket?.id) {
        const match = lastTicket.id.match(/TKT-IF-(\d+)/);
        if (match) nextNumber = parseInt(match[1], 10) + 1;
      }

      const ticketId = `TKT-IF-${nextNumber.toString().padStart(3, "0")}`;
      console.log("Generated Ticket ID:", ticketId);

      // 3️⃣ Create / Update Ticket
      if (editingTicket) {
        const { error: updateError } = await supabase
          .from("tickets")
          .update({
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
          })
          .eq("id", editingTicket.id);

        if (updateError) throw updateError;

        // ✅ UPDATE ONLY THE EDITED TICKET IN STATE
        setTickets((prev) =>
          prev.map((t) =>
            t.id === editingTicket.id
              ? {
                  ...t,
                  customer_id: customerId,
                  issueDescription: formData.issueDescription,
                  status: formData.status,
                  priority: formData.priority,
                  assignedToId: formData.assignedToId || "",
                  deviceType: formData.deviceType,
                  brand: formData.brand,
                  model: formData.model,
                  deviceDescription: formData.deviceDescription,
                  store: formData.store,
                  estimatedAmount: parseFloat(formData.estimatedAmount || "0"),
                  warranty: formData.warranty === "Yes",
                  billNumber: formData.billNumber || "",
                  scheduledDate: formData.scheduledDate || "",
                }
              : t
          )
        );

        if (onSuccess) onSuccess();
      } else {
        // Insert new ticket
        const { data: newTicket, error: insertError } = await supabase
          .from("tickets")
          .insert([
            {
              id: ticketId, // ✅ THIS IS THE ONLY ID
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
              user_id: currentUser.id,
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;

        // ✅ Call onRefresh to fetch fresh data from Supabase
        if (insertError) throw insertError;

        // ✅ Call onRefresh to fetch fresh data from Supabase
        if (onRefresh) {
          await onRefresh();
        }

        if (onSuccess) onSuccess();
      }

      onClose();
    } catch (err: any) {
      console.error("Error saving ticket:", err);
      setError(`Error saving ticket: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEventIcon = (action: string) => {
    if (action.includes("Resolved")) return <CheckCircle size={14} />;
    if (action.includes("Hold")) return <PauseCircle size={14} />;
    if (action.includes("Rejected")) return <XCircle size={14} />;
    if (action.includes("Transfer")) return <ArrowLeftRight size={14} />;
    return <History size={14} />;
  };

  const getEventColor = (action: string) => {
    if (action.includes("Resolved"))
      return "bg-emerald-50 border-emerald-200 text-emerald-700";
    if (action.includes("Hold"))
      return "bg-orange-50 border-orange-200 text-orange-700";
    if (action.includes("Rejected"))
      return "bg-red-50 border-red-200 text-red-700";
    if (action.includes("Transfer"))
      return "bg-purple-50 border-purple-200 text-purple-700";
    return "bg-slate-50 border-slate-200 text-slate-700";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={() => !isSubmitting && onClose()}
      />
      <div className="relative w-full max-w-7xl bg-slate-50 sm:rounded-[3rem] shadow-2xl flex flex-col h-full sm:h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        {/* HEADER */}
        <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-2xl ${
                editingTicket
                  ? "bg-amber-500 text-white"
                  : "bg-indigo-600 text-white"
              }`}
            >
              <Zap size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {editingTicket
                  ? `Edit ${editingTicket.ticketId}`
                  : "New Ticket"}
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                Zonal Service Entry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {editingTicket && (
              <div className="flex bg-slate-100 p-1 rounded-xl mr-4">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeTab === "details"
                      ? "bg-white shadow-sm text-slate-800"
                      : "text-slate-500"
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeTab === "history"
                      ? "bg-white shadow-sm text-slate-800"
                      : "text-slate-500"
                  }`}
                >
                  History
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-rose-500 transition-all shadow-sm"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          {activeTab === "details" ? (
            <>
              {error && (
                <div className="mb-8 p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-2xl text-rose-800 font-bold text-sm shadow-sm">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                    <User size={16} /> 01. Client Data
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none transition-all shadow-inner"
                        placeholder="client@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Name *
                      </label>
                      <input
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none transition-all shadow-inner"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Mobile *
                      </label>
                      <input
                        value={formData.mobile}
                        onChange={(e) =>
                          setFormData({ ...formData, mobile: e.target.value })
                        }
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none transition-all shadow-inner"
                        placeholder="+91..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Service Address
                      </label>
                      <textarea
                        rows={3}
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none transition-all shadow-inner resize-none"
                        placeholder="House No, Street, Landmark..."
                      />
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-8 space-y-8">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <h3 className="text-xs font-black text-emerald-600 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                      <Laptop size={16} /> 02. Asset Details
                    </h3>

                    {/* Device Type Buttons */}
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
                      {settings.deviceTypes.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, deviceType: d.name })
                          }
                          className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${
                            formData.deviceType === d.name
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-xl"
                              : "bg-white border-slate-100 text-slate-400"
                          }`}
                        >
                          {React.createElement(deviceIcons[d.name] || Zap, {
                            size: 22,
                          })}
                          <span className="text-[9px] font-black uppercase tracking-tighter text-center">
                            {d.name}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Asset Identifiers Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Brand
                        </label>
                        <div className="relative">
                          <Tag
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            size={16}
                          />
                          <input
                            list="brands"
                            value={formData.brand}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                brand: e.target.value,
                              })
                            }
                            className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none"
                            placeholder="Enter or Select"
                          />
                          <datalist id="brands">
                            {settings.serviceBrands.map((b) => (
                              <option key={b.id} value={b.name} />
                            ))}
                          </datalist>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Model No.
                        </label>
                        <div className="relative">
                          <Layers
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            size={16}
                          />
                          <input
                            value={formData.model}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                model: e.target.value,
                              })
                            }
                            className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none"
                            placeholder="Device Model"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Serial No.
                        </label>
                        <div className="relative">
                          <Barcode
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            size={16}
                          />
                          <input
                            value={formData.serial}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                serial: e.target.value,
                              })
                            }
                            className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none"
                            placeholder="Unique ID"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Warranty & Cost Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Warranty Status
                        </label>
                        <select
                          value={formData.warranty}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              warranty: e.target.value,
                            })
                          }
                          className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white outline-none cursor-pointer"
                        >
                          <option value="No">Out of Warranty</option>
                          <option value="Yes">Under Warranty</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Estimated Cost
                        </label>
                        <div className="relative">
                          <IndianRupee
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            size={16}
                          />
                          <input
                            type="number"
                            min="0"
                            value={formData.estimatedAmount}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                estimatedAmount: e.target.value,
                              })
                            }
                            className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Conditional Fields Row */}
                    {(formData.warranty === "Yes" || isServiceBrand) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 animate-in fade-in slide-in-from-top-2">
                        {formData.warranty === "Yes" && (
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                              Bill Number *
                            </label>
                            <div className="relative">
                              <Receipt
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                size={16}
                              />
                              <input
                                value={formData.billNumber}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    billNumber: e.target.value,
                                  })
                                }
                                className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none"
                                placeholder="Required for Warranty"
                              />
                            </div>
                          </div>
                        )}

                        {isServiceBrand && (
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                              Job ID *
                            </label>
                            <div className="relative">
                              <FileDigit
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                size={16}
                              />
                              <input
                                value={formData.jobId}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    jobId: e.target.value,
                                  })
                                }
                                className="w-full pl-10 pr-4 py-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-sm font-bold text-indigo-700 focus:bg-white outline-none"
                                placeholder="Brand Job ID"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Issue *
                      </label>
                      <textarea
                        rows={4}
                        value={formData.issueDescription}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            issueDescription: e.target.value,
                          })
                        }
                        className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-medium focus:bg-white outline-none shadow-inner"
                        placeholder="Fault details..."
                      />
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                    <h3 className="text-xs font-black text-amber-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                      <Building2 size={16} /> 03. Workflow
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Store *
                        </label>
                        <select
                          value={formData.store}
                          onChange={(e) =>
                            setFormData({ ...formData, store: e.target.value })
                          }
                          disabled={!isAdmin}
                          className={`w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none appearance-none ${
                            !isAdmin
                              ? "cursor-not-allowed opacity-70 text-slate-500"
                              : "cursor-pointer"
                          }`}
                        >
                          <option value="">Choose Store</option>
                         {stores?.length > 0 &&
  stores.map((s) => (
    <option key={s.id} value={s.name}>
      {s.name}
    </option>
  ))}
                        </select>
                      </div>

                      {/* Status */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Current Status
                        </label>
                        <div className="relative">
                          <Activity
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            size={18}
                          />
                          <select
                            value={formData.status}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                status: e.target.value,
                              })
                            }
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none appearance-none cursor-pointer text-slate-700"
                          >
                            {settings.ticketStatuses.map((s) => (
                              <option key={s.id} value={s.name}>
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
                          className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 focus:bg-white outline-none"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">Urgent</option>
                        </select>
                      </div>
                    </div>

                    {/* CONDITIONAL WORKFLOW FIELDS */}
                    {formData.status === "On Hold" && (
                      <div className="col-span-full md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest ml-1">
                            Hold Reason
                          </label>
                          <div className="relative">
                            <PauseCircle
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400"
                              size={18}
                            />
                            <select
                              value={formData.holdReason}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  holdReason: e.target.value,
                                })
                              }
                              className="w-full pl-12 pr-4 py-4 bg-orange-50 border border-orange-100 rounded-2xl text-sm font-bold text-orange-800 focus:bg-white outline-none appearance-none cursor-pointer"
                            >
                              <option value="">-- Select Reason --</option>
                              {settings.holdReasons.map((r) => (
                                <option key={r.id} value={r.name}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-400 pointer-events-none"
                              size={16}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.status === "In Progress" && (
                      <div className="col-span-full md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">
                            Progress Stage
                          </label>
                          <div className="relative">
                            <Loader2
                              className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400"
                              size={18}
                            />
                            <select
                              value={formData.progressReason}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  progressReason: e.target.value,
                                })
                              }
                              className="w-full pl-12 pr-4 py-4 bg-blue-50 border border-blue-100 rounded-2xl text-sm font-bold text-blue-800 focus:bg-white outline-none appearance-none cursor-pointer"
                            >
                              <option value="">-- Select Stage --</option>
                              {settings.progressReasons.map((r) => (
                                <option key={r.id} value={r.name}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none"
                              size={16}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">
                            Technical Note
                          </label>
                          <input
                            type="text"
                            value={formData.progressNote}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                progressNote: e.target.value,
                              })
                            }
                            placeholder="Current diagnostic status..."
                            className="w-full px-4 py-4 bg-blue-50 border border-blue-100 rounded-2xl text-sm font-bold text-blue-800 focus:bg-white outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {isStoreChanged && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <ArrowLeftRight size={12} /> Reason for Store Transfer
                          *
                        </label>
                        <textarea
                          value={transferReason}
                          onChange={(e) => setTransferReason(e.target.value)}
                          className="w-full px-4 py-3 bg-purple-50 border border-purple-100 rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-purple-500 outline-none transition-all shadow-inner resize-none h-20"
                          placeholder="Explain why this ticket is moving to a different store..."
                        />
                      </div>
                    )}

                    {/* Assign To Field */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Assign Technician
                      </label>
                      <div className="relative">
                        <Briefcase
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          size={18}
                        />
                        <select
                          value={formData.assignedToId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              assignedToId: e.target.value,
                            })
                          }
                          disabled={!isAdmin}
                          className={`w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none appearance-none text-slate-700 ${
                            !isAdmin
                              ? "cursor-not-allowed opacity-70"
                              : "cursor-pointer"
                          }`}
                        >
                          <option value="">-- Unassigned --</option>
                          {technicians.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.role})
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                          size={16}
                        />
                      </div>
                    </div>

                    {/* ONLY SHOW ZONE SELECTION INFO TO SUPER ADMIN */}
                    {currentUser.role === "SUPER_ADMIN" &&
                      selectedStoreZone && (
                        <div className="bg-slate-50 p-4 rounded-2xl border border-indigo-100 flex items-center gap-3 text-xs font-black text-indigo-600">
                          <Layers size={18} /> Zone: {selectedStoreZone.name}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* HISTORY TAB */
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 min-h-[400px]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <History size={20} className="text-indigo-600" />
                    Ticket History
                  </h3>
                  <p className="text-xs text-slate-500">
                    Timeline of all changes and transfers
                  </p>
                </div>
                <button
                  onClick={downloadHistoryPDF}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-black transition-colors"
                >
                  <Download size={16} /> Export PDF
                </button>
              </div>

              <div className="relative pl-6 border-l-2 border-slate-100 space-y-8">
                {editingTicket?.history &&
                  [...editingTicket.history]
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map((entry, idx) => (
                      <div key={idx} className="relative pl-6">
                        {/* Dot */}
                        <div
                          className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 flex items-center justify-center ${
                            entry.action.includes("Transfer")
                              ? "bg-purple-500"
                              : entry.action.includes("Resolved")
                              ? "bg-emerald-500"
                              : entry.action.includes("Hold")
                              ? "bg-orange-500"
                              : "bg-slate-300"
                          }`}
                        ></div>

                        <div
                          className={`p-4 rounded-xl border transition-colors ${getEventColor(
                            entry.action
                          )}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                              {getEventIcon(entry.action)}
                              {entry.action}
                            </span>
                            <span className="text-[10px] font-mono opacity-70">
                              {entry.date}
                            </span>
                          </div>
                          <p className="text-sm font-medium leading-relaxed opacity-90">
                            {entry.details}
                          </p>
                          <div className="mt-3 pt-2 border-t border-black/5 flex items-center gap-1.5 text-[10px] font-bold uppercase opacity-60">
                            <User size={10} /> {entry.actorName}{" "}
                            <span className="opacity-50">
                              ({entry.actorRole})
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                {(!editingTicket?.history ||
                  editingTicket.history.length === 0) && (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    No history records found.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-8 py-8 border-t border-slate-200 flex justify-end gap-4 bg-white shrink-0">
          <button
            onClick={onClose}
            className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] hover:text-rose-500 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-12 py-4 bg-slate-900 text-white font-black rounded-3xl shadow-2xl flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50 min-w-[220px]"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Check size={20} strokeWidth={4} />
            )}
            <span className="text-xs uppercase tracking-[0.2em]">
              {editingTicket ? "Update" : "Save"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
