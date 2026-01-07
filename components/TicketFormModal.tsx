import React, { useState, useEffect, useMemo } from "react";
import {
  PenTool,
  Search,
  User,
  Phone,
  MapPin,
  Check,
  ChevronDown,
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
  Sparkles,
  Zap,
  Building2,
  ShieldCheck,
} from "lucide-react";
import {
  Ticket,
  Customer,
  AppSettings,
  User as AppUser,
  TicketHistory,
} from "../types";
import { supabase } from "@/supabaseClient";

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
  const [activeTab, setActiveTab] = useState<"details" | "history">("details");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [technicians, setTechnicians] = useState<AppUser[]>([]);

  useEffect(() => {
    const fetchTechnicians = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, role")
        .eq("role", "TECHNICIAN");

      if (!error && data) setTechnicians(data);
    };

    fetchTechnicians();
  }, []);

  // --- FILTERED STORES LOGIC ---
  const availableStores = useMemo(() => {
    // Super Admin can see every store in the system
    if (currentUser.role === "SUPER_ADMIN") return settings.stores;
    // Everyone else only sees stores assigned to their specific zone
    return settings.stores.filter((s) => s.zoneId === currentUser.zoneId);
  }, [settings.stores, currentUser]);

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
    store: availableStores?.[0]?.name || "", // Default to first available store in their zone
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
  }, [isOpen, editingTicket, availableStores]);

  const selectedStoreZone = useMemo(() => {
    const store = settings.stores.find((s) => s.name === formData.store);
    return store ? settings.zones.find((z) => z.id === store.zoneId) : null;
  }, [formData.store, settings.stores, settings.zones]);

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

  {
    /*const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!formData.name || !formData.mobile || !formData.issueDescription || !formData.store) {
        setError('Mandatory fields missing.');
        return;
    }

    setIsSubmitting(true);
    try {
      const existingMatch = customers.find(c => c.email.toLowerCase() === formData.email.toLowerCase());
      let customerId = existingMatch?.id;

      if (!existingMatch && !editingTicket) {
        customerId = generateId('CUST', customers);
        setCustomers([...customers, { id: customerId, name: formData.name, email: formData.email, mobile: formData.mobile, address: formData.address }]);
      }

      const zoneId = selectedStoreZone?.id || currentUser.zoneId || 'global';

      if (editingTicket) {
        const historyLogs = editingTicket.status !== formData.status ? [createHistoryEntry("Status Updated", `To ${formData.status}`)] : [];
        const updated = tickets.map(t => t.id === editingTicket.id ? {
          ...t, ...formData, number: formData.mobile, zoneId, chargerIncluded: formData.chargerIncluded === 'Yes',
          estimatedAmount: formData.estimatedAmount ? parseFloat(formData.estimatedAmount) : undefined,
          warranty: formData.warranty === 'Yes',
          history: [...(t.history || []), ...historyLogs]
        } : t);
        setTickets(updated);
      } else {
        const ticketId = generateId('TKT-IF', tickets);
        const newTicket: Ticket = {
          id: Date.now().toString(), ticketId, customerId: customerId!, ...formData, number: formData.mobile, zoneId,
          chargerIncluded: formData.chargerIncluded === 'Yes',
          estimatedAmount: formData.estimatedAmount ? parseFloat(formData.estimatedAmount) : undefined,
          warranty: formData.warranty === 'Yes', date: new Date().toLocaleDateString(),
          history: [createHistoryEntry("Ticket Created", "Logged via portal.")]
        };
        setTickets([newTicket, ...tickets]);
      }
      onClose();
    } catch { setError('Sync Error.'); } finally { setIsSubmitting(false); }
  };*/
  }

  // Replace your existing generateId function with this
  const generateSequentialId = async (prefix: string) => {
    try {
      // Get all tickets and find the highest number
      const { data, error } = await supabase
        .from("tickets")
        .select("id, ticket_id")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Find the highest number in existing IDs
      let maxNumber = 0;

      data?.forEach((ticket) => {
        // First check ticket_id (custom ID)
        if (ticket.ticket_id) {
          const match = ticket.ticket_id.match(/-(\d+)$/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxNumber) maxNumber = num;
          }
        }
        // Then check id (old format)
        else if (ticket.id && typeof ticket.id === "string") {
          const match = ticket.id.match(/-(\d+)$/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxNumber) maxNumber = num;
          }
        }
      });

      // Start from 195 if no existing tickets with numbers
      if (maxNumber === 0) {
        maxNumber = 194; // Because your last ID was 194
      }

      const nextNumber = maxNumber + 1;
      const padded = nextNumber.toString().padStart(3, "0");
      return `${prefix}-${padded}`;
    } catch (error) {
      console.error("Error generating sequential ID:", error);
      // Fallback: use local count + 195
      const fallbackNumber = tickets.length + 195;
      const padded = fallbackNumber.toString().padStart(3, "0");
      return `${prefix}-${padded}`;
    }
  };
  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (
      !formData.name ||
      !formData.mobile ||
      !formData.issueDescription ||
      !formData.store
    ) {
      setError("Mandatory fields missing.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Find or create customer
      const existingMatch = customers.find(
        (c) => c.email.toLowerCase() === formData.email.toLowerCase()
      );
      let customerId = existingMatch?.id;

      if (!existingMatch && !editingTicket) {
        customerId = generateId("CUST", customers);
        setCustomers([
          ...customers,
          {
            id: customerId,
            name: formData.name,
            email: formData.email,
            mobile: formData.mobile,
            address: formData.address,
          },
        ]);
      }

      const zoneId = selectedStoreZone?.id || currentUser.zoneId || "global";
      const currentTimestamp = new Date().toISOString();

      if (editingTicket) {
        // UPDATE EXISTING TICKET - same as before
        const updateData: any = {
          subject: formData.issueDescription,
          status: formData.status,
          priority: formData.priority,
          device_type: formData.deviceType,
          device_brand: formData.brand || null,
          device_model: formData.model || null,
          assigned_to: formData.assignedToId || null,
          device_serial_number: formData.serial || null,
          device_description: formData.deviceDescription || null,
          charger_status:
            formData.chargerIncluded === "Yes" ? "INCLUDED" : "NOT_INCLUDED",
          store: formData.store,
          amount_estimate: formData.estimatedAmount || null,
          warranty: formData.warranty === "Yes" ? "YES" : "NO",
          bill_number: formData.billNumber || null,
          hold_reason: formData.holdReason || null,
          scheduled_date: formData.scheduledDate || null,
          internal_progress_reason: formData.progressReason || null,
          internal_progress_note: formData.progressNote || null,
          updated_at: currentTimestamp,
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          address: formData.address,
        };

        if (currentUser.id) {
          updateData.user_id = currentUser.id;
        }

        const { data, error: updateError } = await supabase
          .from("tickets")
          .update(updateData)
          .eq("id", editingTicket.id)
          .select();

        if (updateError) throw updateError;

        // Update local state
        const historyLogs =
          editingTicket.status !== formData.status
            ? [createHistoryEntry("Status Updated", `To ${formData.status}`)]
            : [];

        const updated = tickets.map((t) =>
          t.id === editingTicket.id
            ? {
                ...t,
                ...formData,
                number: formData.mobile,
                zoneId,
                chargerIncluded: formData.chargerIncluded === "Yes",
                estimatedAmount: formData.estimatedAmount
                  ? parseFloat(formData.estimatedAmount)
                  : undefined,
                warranty: formData.warranty === "Yes",
                history: [...(t.history || []), ...historyLogs],
              }
            : t
        );

        setTickets(updated);
      } else {
        // CREATE NEW TICKET - SIMPLIFIED VERSION
        // First, get the next ticket number
        let nextNumber = 195; // Default start

        try {
          const { data: existingTickets, error: fetchError } = await supabase
            .from("tickets")
            .select("id")
            .order("created_at", { ascending: false })
            .limit(10);

          if (!fetchError && existingTickets) {
            // Find highest number in existing IDs
            for (const ticket of existingTickets) {
              if (
                ticket.id &&
                typeof ticket.id === "string" &&
                ticket.id.includes("-")
              ) {
                const parts = ticket.id.split("-");
                const lastPart = parts[parts.length - 1];
                const num = parseInt(lastPart);
                if (!isNaN(num) && num > nextNumber) {
                  nextNumber = num;
                }
              }
            }
            nextNumber++; // Increment for new ticket
          }
        } catch (err) {
          console.log("Error fetching tickets for ID generation:", err);
        }

        const ticketId = `TKT-IF-${nextNumber.toString().padStart(3, "0")}`;

        console.log("Creating ticket with ID:", ticketId);

        // Simple data structure - only essential fields
        const newTicketData = {
          id: ticketId, // TEXT ID
          customer_id: customerId || "CUST-001", // Default if no customer
          subject: formData.issueDescription,
          status: formData.status,
          priority: formData.priority,
          device_type: formData.deviceType,
          store: formData.store,
          assigned_to: formData.assignedToId || null, // <-- new field
          created_at: currentTimestamp,
          // Optional fields
          name: formData.name || null,
          email: formData.email || null,
          mobile: formData.mobile || null,
          address: formData.address || null,
        };

        console.log("Ticket data to insert:", newTicketData);

        // Insert into Supabase
        const { data: insertedData, error: insertError } = await supabase
          .from("tickets")
          .insert([newTicketData])
          .select();

        if (insertError) {
          console.error("Supabase insert error:", insertError);
          throw insertError;
        }

        console.log("Ticket created successfully:", insertedData);

        // Update local state
        const newTicket: Ticket = {
          id: ticketId,
          ticketId: ticketId,
          customerId: customerId || "CUST-001",
          ...formData,
          number: formData.mobile,
          zoneId,
          chargerIncluded: formData.chargerIncluded === "Yes",
          estimatedAmount: formData.estimatedAmount
            ? parseFloat(formData.estimatedAmount)
            : undefined,
          warranty: formData.warranty === "Yes",
          date: new Date().toLocaleDateString(),
          history: [createHistoryEntry("Ticket Created", "Logged via portal.")],
        };

        setTickets([newTicket, ...tickets]);
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Error saving ticket:", error);
      setError(error.message || "Failed to save ticket. Please try again.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={() => !isSubmitting && onClose()}
      />
      <div className="relative w-full max-w-7xl bg-slate-50 sm:rounded-[3rem] shadow-2xl flex flex-col h-full sm:h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
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
          <button
            onClick={onClose}
            className="p-2.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-rose-500 transition-all shadow-sm"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Store *
                    </label>
                    <select
                      value={formData.store}
                      onChange={(e) =>
                        setFormData({ ...formData, store: e.target.value })
                      }
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none appearance-none cursor-pointer"
                    >
                      <option value="">Choose Store</option>
                      {availableStores.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value })
                      }
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 focus:bg-white outline-none"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Assign To
                  </label>
                  <select
                    value={formData.assignedToId || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, assignedToId: e.target.value })
                    }
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Choose Technician</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ONLY SHOW ZONE SELECTION INFO TO SUPER ADMIN */}
                {currentUser.role === "SUPER_ADMIN" && selectedStoreZone && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-indigo-100 flex items-center gap-3 text-xs font-black text-indigo-600">
                    <Layers size={18} /> Zone: {selectedStoreZone.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="px-8 py-8 border-t border-slate-200 flex justify-end gap-4 bg-white shrink-0">
          <button
            onClick={onClose}
            className="px-8 py-4 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] hover:text-rose-500 transition-all"
          >
            Abandon
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
              {editingTicket ? "Apply Correction" : "Commit Dispatch"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
