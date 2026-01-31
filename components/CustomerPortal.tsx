import React, { useState, useMemo, useEffect } from "react";
import { Ticket, User, AppSettings, TicketHistory } from "../types";
import {
  Plus,
  Search,
  MapPin,
  Wrench,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Smartphone,
  Laptop,
  Monitor,
  ArrowRight,
  LayoutGrid,
  List as ListIcon,
  Filter,
  ChevronRight,
  Calendar,
  Activity,
  PauseCircle,
  History,
  GitCommit,
  X,
  User as UserIcon,
} from "lucide-react";
import { supabase } from "@/supabaseClient";

interface CustomerPortalProps {
  currentUser: User;
  tickets: Ticket[];
  setTickets: (tickets: Ticket[]) => void;
  settings: AppSettings;
}

// --- TIMELINE COMPONENT ---
// UPDATE the TicketTimeline component in CustomerPortal.tsx

const TicketTimeline: React.FC<{ ticket: Ticket }> = ({ ticket }) => {
  const timelineEvents = useMemo(() => {
    let events = ticket.history || [];

    if (events.length === 0) {
      events = [
        {
          id: "init",
          date: ticket.date,
          timestamp: new Date(ticket.date).getTime(),
          actorName: "System",
          actorRole: "System",
          action: "Ticket Created",
          details: "Service request received.",
        },
      ];
    }

    return [...events].sort((a, b) => b.timestamp - a.timestamp);
  }, [ticket]);

  const getEventIcon = (action: string) => {
    if (action.includes("Resolved"))
      return <CheckCircle size={14} className="text-emerald-600" />;
    if (action.includes("Hold"))
      return <PauseCircle size={14} className="text-orange-600" />;
    if (action.includes("Created"))
      return <Plus size={14} className="text-blue-600" />;
    if (action.includes("Rejected"))
      return <XCircle size={14} className="text-red-600" />;
    return <GitCommit size={14} className="text-indigo-600" />;
  };

  const getEventColor = (action: string) => {
    if (action.includes("Resolved")) return "bg-emerald-100 border-emerald-200";
    if (action.includes("Hold")) return "bg-orange-100 border-orange-200";
    if (action.includes("Rejected")) return "bg-red-100 border-red-200";
    return "bg-indigo-50 border-indigo-200";
  };

  return (
    <div className="mt-6 relative pl-4 border-l-2 border-slate-100 space-y-8">
      {timelineEvents.map((event, index) => (
        <div
          key={event.id}
          className="relative pl-6 animate-in slide-in-from-bottom-4 fade-in duration-500 fill-mode-both"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div
            className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center bg-white z-10 ring-1 ring-slate-200`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                event.action.includes("Resolved")
                  ? "bg-emerald-500"
                  : event.action.includes("Hold")
                    ? "bg-orange-500"
                    : event.action.includes("Rejected")
                      ? "bg-red-500"
                      : "bg-indigo-500"
              }`}
            ></div>
          </div>

          <div
            className={`p-4 rounded-xl border ${getEventColor(
              event.action,
            )} relative group hover:shadow-md transition-shadow`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                {getEventIcon(event.action)}
                {event.action}
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-white/50 px-2 py-0.5 rounded-full">
                {event.date}
              </span>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              {event.details}
            </p>

            {event.action.includes("Rejected") && (
              <div className="mt-3 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 whitespace-pre-line">
                <span className="font-bold block mb-1">
                  Reason for Rejection
                </span>
                {event.details}
              </div>
            )}

            {event.action.includes("Hold") && (
              <div className="mt-2 text-xs text-orange-700 bg-orange-50/50 p-2 rounded-lg italic border border-orange-100/50">
                Checking current status...
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default function CustomerPortal({
  currentUser,
  tickets,
  setTickets,
  settings,
}: CustomerPortalProps) {
  // --- STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const [deviceType, setDeviceType] = useState("Laptop");
  const [issue, setIssue] = useState("");
  const [store, setStore] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  // --- FILTERING LOGIC ---
  const myTickets = useMemo(() => {
    return tickets
      .filter((t) => t.email.toLowerCase() === currentUser.email.toLowerCase())
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [tickets, currentUser.email]);

  const filteredTickets = useMemo(() => {
    return myTickets.filter((ticket) => {
      const matchesSearch =
        ticket.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.deviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.issueDescription
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || ticket.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [myTickets, searchTerm, statusFilter]);

  // --- STATS ---
  const stats = {
    total: myTickets.length,
    active: myTickets.filter(
      (t) => t.status !== "Resolved" && t.status !== "Rejected",
    ).length,
    resolved: myTickets.filter((t) => t.status === "Resolved").length,
  };
  // ✅ FIXED: Sequential ID generator matching staff-side logic
  const getNextTicketIdForCustomer = async (): Promise<string> => {
    const { data, error } = await supabase
      .from("tickets")
      .select("id")
      .like("id", "TKT-IF-%")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Failed to fetch last ticket ID", error);
      throw error;
    }

    let nextNumber = 1;
    if (data?.id) {
      const match = data.id.match(/TKT-IF-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    // ✅ Check for duplicates and find next available ID
    let finalNextNumber = nextNumber;
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      const candidateId = `TKT-IF-${finalNextNumber.toString().padStart(3, "0")}`;

      const { data: existingTicket } = await supabase
        .from("tickets")
        .select("id")
        .eq("id", candidateId)
        .maybeSingle();

      if (!existingTicket) {
        return candidateId; // ✅ Found available ID
      }

      finalNextNumber++;
      attempts++;
    }

    throw new Error("Unable to generate unique ticket ID. Please try again.");
  };
  // --- HANDLERS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!issue.trim()) {
      alert("Please describe the issue");
      return;
    }

    setIsLoading(true);

    try {
      // ✅ FETCH CUSTOMER MOBILE FROM DATABASE
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("mobile, phone, auth_id")
        .eq("email", currentUser.email)
        .single();

      if (customerError) {
        console.error("Error fetching customer:", customerError);
        alert("Error loading profile. Please try again.");
        setIsLoading(false);
        return;
      }

      const customerMobile = customerData.mobile || customerData.phone;
      if (!customerMobile) {
        alert(
          "Your account is missing a mobile number. Please contact support.",
        );
        setIsLoading(false);
        return;
      }

      // ✅ GENERATE PROPER SEQUENTIAL ID
      const ticketId = await getNextTicketIdForCustomer();
      const now = new Date().toISOString();

      const ticketData = {
        id: ticketId, // ✅ Use generated ID, not timestamp
        customer_id: currentUser.id,
        subject: issue,
        status: "Pending Approval",
        hold_reason: null,
        priority: "Medium",
        assigned_to: null,
        created_at: now,
        resolved_at: null,
        device_type: deviceType,
        device_brand: null,
        device_model: null,
        device_serial_number: null,
        device_brand_service: null,
        device_description: issue,
        charger_status: null,
        store: store,
        amount_estimate: null,
        warranty: "NO",
        bill_number: null,
        scheduled_date: null,
        internal_progress_reason: null,
        internal_progress_note: null,
        user_id: customerData.auth_id || currentUser.id,
        address: currentUser.address || null,
        name: currentUser.name,
        email: currentUser.email,
        mobile: customerMobile,
        zone_id: null,
        history: JSON.stringify([
          {
            id: ticketId,
            timestamp: Date.now(),
            date: new Date().toLocaleString(),
            actorName: currentUser.name,
            actorRole: "CUSTOMER",
            action: "Ticket Created",
            details: `Service request submitted for ${deviceType}`,
          },
        ]),
      };

      // ✅ TRY INSERT WITH CONFLICT HANDLING
      const { data, error } = await supabase
        .from("tickets")
        .insert([ticketData])
        .select()
        .maybeSingle();

      if (error) {
        // ✅ HANDLE DUPLICATE KEY ERROR
        if (error.code === "23505") {
          console.warn("⚠️ Duplicate ticket ID detected, retrying...");

          // Retry with new ID
          const retryId = await getNextTicketIdForCustomer();
          const retryData = { ...ticketData, id: retryId };

          const { data: retryResult, error: retryError } = await supabase
            .from("tickets")
            .insert([retryData])
            .select()
            .single();

          if (retryError) throw retryError;

          const newTicket: Ticket = {
            id: retryResult.id,
            ticketId: retryResult.id,
            customerId: retryResult.customer_id || currentUser.id,
            name: retryResult.name || currentUser.name,
            email: retryResult.email || currentUser.email,
            number: retryResult.mobile ?? "",
            address: retryResult.address || currentUser.address || "",
            date: new Date(retryResult.created_at).toLocaleDateString(),
            deviceType: retryResult.device_type || deviceType,
            issueDescription: retryResult.subject || issue,
            store: retryResult.store ?? "",
            status: retryResult.status || "Pending Approval",
            priority: retryResult.priority || "Medium",
            warranty: retryResult.warranty === "YES",
            estimatedAmount: retryResult.amount_estimate,
            holdReason: retryResult.hold_reason,
            brand: retryResult.device_brand,
            model: retryResult.device_model,
            history: JSON.parse(retryResult.history || "[]"),
          };

          setTickets([newTicket, ...tickets]);
          setIsModalOpen(false);
          setIssue("");
          setDeviceType("Laptop");
          setStore(settings.stores[0]?.name || "");
          alert(
            `Ticket ${retryResult.id} created successfully! Status: Pending Approval`,
          );
          return;
        }

        throw error;
      }

      if (data) {
        const newTicket: Ticket = {
          id: data.id,
          ticketId: data.id,
          customerId: data.customer_id || currentUser.id,
          name: data.name || currentUser.name,
          email: data.email || currentUser.email,
          number: data.mobile ?? "",
          address: data.address || currentUser.address || "",
          date: new Date(data.created_at).toLocaleDateString(),
          deviceType: data.device_type || deviceType,
          issueDescription: data.subject || issue,
          store: data.store ?? "",
          status: data.status || "Pending Approval",
          priority: data.priority || "Medium",
          warranty: data.warranty === "YES",
          estimatedAmount: data.amount_estimate,
          holdReason: data.hold_reason,
          brand: data.device_brand,
          model: data.device_model,
          history: JSON.parse(data.history || "[]"),
        };

        setTickets([newTicket, ...tickets]);

        await sendEmail(
          "TICKET_CREATED",
          {
            ticketId: data.id,
            customerName: currentUser.name,
            customerEmail: currentUser.email,
            issueDescription: issue,
            priority: "Medium",
            status: "Pending Approval",
            source: "CUSTOMER",
          },
          null,
        );

        setIsModalOpen(false);
        setIssue("");
        setDeviceType("Laptop");
        setStore(settings.stores[0]?.name || "");
        alert(
          `Ticket ${data.id} created successfully! Status: Pending Approval`,
        );
      }
    } catch (error: any) {
      console.error("❌ Error creating ticket:", error);
      alert(error.message || "Failed to create ticket. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  const SUPABASE_FUNCTION_URL =
    "https://jajnueotoourhmfupepb.supabase.co/functions/v1/sendEmail";
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const sendEmail = async (
    type: "TICKET_CREATED" | "TASK_ASSIGNED",
    payload: any,
    user: { name: string; email: string },
  ) => {
    try {
      const res = await fetch(SUPABASE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ type, payload, user }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to send email:", text);
        return false;
      } else {
        return true;
      }
    } catch (err) {
      console.error("Error calling sendEmail:", err);
      return false;
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Rejected":
        return "bg-red-100 text-red-700 border-red-200";
      case "Pending Approval":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "New":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "On Hold":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {/* 1. HEADER & STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome Card */}
        <div className="lg:col-span-2 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">
              Hello, {currentUser.name.split(" ")[0]} 👋
            </h1>
            <p className="text-indigo-100 max-w-md text-lg">
              Manage all your service requests in one place. We are here to get
              your devices back up and running.
            </p>
          </div>
          <div className="relative z-10 mt-6">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all shadow-lg inline-flex items-center gap-2 transform hover:-translate-y-1"
            >
              <Plus size={20} /> Raise New Ticket
            </button>
          </div>
          {/* Background Decor */}
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10">
            <Wrench size={240} />
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-300 transition-colors">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                Active Repairs
              </p>
              <h3 className="text-3xl font-black text-slate-800">
                {stats.active}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Activity size={24} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-emerald-300 transition-colors">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                Completed
              </p>
              <h3 className="text-3xl font-black text-slate-800">
                {stats.resolved}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <CheckCircle size={24} />
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-300 transition-colors">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                Total Service History
              </p>
              <h3 className="text-3xl font-black text-slate-800">
                {stats.total}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <FileText size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. FILTERS & TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-20">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search ticket ID, device..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative w-full sm:w-48">
            <Filter
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <option value="All">All Statuses</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <ChevronRight
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none"
            />
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === "grid"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
            title="Card View"
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === "list"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
            title="List View"
          >
            <ListIcon size={20} />
          </button>
        </div>
      </div>

      {/* 3. TICKET CONTENT */}
      <div>
        {filteredTickets.length > 0 ? (
          <>
            {viewMode === "grid" ? (
              // GRID VIEW
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col animate-in fade-in zoom-in-95 cursor-pointer ring-offset-2 hover:ring-2 ring-indigo-500/0 hover:ring-indigo-500/20"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                          ticket.status === "Resolved"
                            ? "bg-emerald-100 text-emerald-600"
                            : ticket.status === "Rejected"
                              ? "bg-red-100 text-red-600"
                              : ticket.status === "On Hold"
                                ? "bg-orange-100 text-orange-600"
                                : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"
                        }`}
                      >
                        {ticket.deviceType === "Laptop" ? (
                          <Laptop size={24} />
                        ) : ticket.deviceType === "Smartphone" ? (
                          <Smartphone size={24} />
                        ) : (
                          <Monitor size={24} />
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(
                          ticket.status,
                        )}`}
                      >
                        {ticket.status}
                      </span>
                    </div>

                    <div className="flex-1 mb-4">
                      <h3 className="font-bold text-slate-800 text-lg mb-1">
                        {ticket.deviceType}
                      </h3>
                      <p
                        className="text-sm text-slate-500 line-clamp-2 leading-relaxed"
                        title={ticket.issueDescription}
                      >
                        {ticket.issueDescription}
                      </p>
                      {/* DISPLAY HOLD REASON FOR CUSTOMER */}
                      {ticket.status === "On Hold" && ticket.holdReason && (
                        <div className="mt-3 bg-orange-50 border border-orange-100 p-3 rounded-xl flex items-start gap-2 text-xs text-orange-800 animate-pulse">
                          <PauseCircle size={16} className="shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">
                              Action Required / On Hold:
                            </span>
                            {ticket.holdReason}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400 font-medium">
                      <span className="bg-slate-50 px-2 py-1 rounded-md text-slate-500 border border-slate-100">
                        ID: {ticket.ticketId}
                      </span>
                      <span className="flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
                        View Timeline <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // LIST VIEW
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/80 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 font-bold text-slate-600">
                          Ticket ID
                        </th>
                        <th className="px-6 py-4 font-bold text-slate-600">
                          Device
                        </th>
                        <th className="px-6 py-4 font-bold text-slate-600">
                          Issue
                        </th>
                        <th className="px-6 py-4 font-bold text-slate-600">
                          Date
                        </th>
                        <th className="px-6 py-4 font-bold text-slate-600">
                          Status
                        </th>
                        <th className="px-6 py-4 font-bold text-slate-600 text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTickets.map((ticket) => (
                        <tr
                          key={ticket.id}
                          onClick={() => setSelectedTicket(ticket)}
                          className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4 font-mono font-medium text-indigo-600">
                            {ticket.ticketId}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-800">
                            <div className="flex items-center gap-2">
                              {ticket.deviceType === "Laptop" ? (
                                <Laptop size={16} className="text-slate-400" />
                              ) : ticket.deviceType === "Smartphone" ? (
                                <Smartphone
                                  size={16}
                                  className="text-slate-400"
                                />
                              ) : (
                                <Monitor size={16} className="text-slate-400" />
                              )}
                              {ticket.deviceType}
                            </div>
                          </td>
                          <td
                            className="px-6 py-4 text-slate-600 max-w-xs truncate"
                            title={ticket.issueDescription}
                          >
                            {ticket.issueDescription}
                            {ticket.status === "On Hold" &&
                              ticket.holdReason && (
                                <div className="text-[10px] text-orange-600 font-medium mt-1 flex items-center gap-1">
                                  <PauseCircle size={10} /> {ticket.holdReason}
                                </div>
                              )}
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {ticket.date}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-bold uppercase border ${getStatusColor(
                                ticket.status,
                              )}`}
                            >
                              {ticket.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-slate-400">
                            <ChevronRight size={18} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          // EMPTY STATE
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center animate-in fade-in zoom-in-95">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Search size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              No tickets found
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">
              {searchTerm || statusFilter !== "All"
                ? "Adjust your filters or search terms to find what you're looking for."
                : "You haven't raised any service requests yet. Start by creating one!"}
            </p>
            {(searchTerm || statusFilter !== "All") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("All");
                }}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* TICKET TIMELINE MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white h-full sm:h-auto sm:max-h-[90vh] w-full max-w-lg sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-white z-10 shrink-0">
              <div>
                <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-mono font-bold mb-2">
                  {selectedTicket.ticketId}
                </span>
                <h3 className="text-xl font-bold text-slate-800">
                  {selectedTicket.deviceType} Repair
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar">
              {/* Details Summary */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    {selectedTicket.deviceType === "Laptop" ? (
                      <Laptop size={20} />
                    ) : (
                      <Smartphone size={20} />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">
                      Current Status
                    </p>
                    <div
                      className={`text-sm font-bold flex items-center gap-2 ${
                        selectedTicket.status === "Resolved"
                          ? "text-emerald-600"
                          : selectedTicket.status === "On Hold"
                            ? "text-orange-600"
                            : "text-indigo-600"
                      }`}
                    >
                      {selectedTicket.status}
                      {selectedTicket.status === "Resolved" && (
                        <CheckCircle size={14} />
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-bold text-slate-400">
                      Issue Reported
                    </p>
                    <p className="text-sm text-slate-700 font-medium">
                      {selectedTicket.issueDescription}
                    </p>
                  </div>
                  <div className="flex gap-4 pt-2">
                    <div>
                      <p className="text-xs font-bold text-slate-400">Store</p>
                      <p className="text-sm text-slate-700">
                        {selectedTicket.store}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400">
                        Estimated Cost
                      </p>
                      <p className="text-sm text-slate-700">
                        {selectedTicket.estimatedAmount
                          ? `$${selectedTicket.estimatedAmount}`
                          : "TBD"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                <History size={18} className="text-indigo-600" /> Activity
                Timeline
              </h4>
              <TicketTimeline ticket={selectedTicket} />
            </div>
          </div>
        </div>
      )}

      {/* NEW REQUEST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Plus size={20} className="text-indigo-600" />
                Create Service Request
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5 bg-slate-50/50"
            >
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                  Device Type
                </label>
                <div className="relative">
                  <Laptop
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <select
                    value={deviceType}
                    onChange={(e) => setDeviceType(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    {settings.deviceTypes.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                  Preferred Store
                </label>
                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <select
                    value={store}
                    onChange={(e) => setStore(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      Choose Store
                    </option>
                    {settings.stores.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronRight
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none"
                    size={16}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                  Issue Description
                </label>
                <textarea
                  required
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 h-32 resize-none transition-all"
                  placeholder="Please describe the problem you are facing in detail..."
                />
              </div>

              <div className="bg-amber-50 p-4 rounded-xl text-xs text-amber-800 flex gap-3 border border-amber-100 items-start">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Your request will be reviewed by our team. Once approved, you
                  will receive a notification with a valid Ticket ID, and you
                  can drop off your device at the selected store.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 transform active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Submit Request <ArrowRight size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
