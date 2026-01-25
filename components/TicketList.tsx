import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  MapPin,
  Phone,
  User,
  LayoutGrid,
  List as ListIcon,
  Edit,
  Trash2,
  Check,
  AlertTriangle,
  Laptop,
  Smartphone,
  Printer,
  Activity,
  AlertCircle,
  Monitor,
  X,
  Calendar,
} from "lucide-react";
import {
  Ticket,
  Customer,
  AppSettings,
  User as AppUser,
  Store,
  OperationalZone,
  AppNotification,
} from "../types";
import { TicketFormModal } from "./TicketFormModal";
import { jsPDF } from "jspdf";
import { supabase } from "@/supabaseClient";

interface TicketListProps {
  tickets: Ticket[];
  setTickets: (tickets: Ticket[]) => void;
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  settings: AppSettings;
  currentUser: AppUser;
  selectedZoneId: string;
  onRefresh?: () => Promise<void>;
  teamMembers: AppUser[];
  zones: OperationalZone[];
  stores: Store[];
  pushNotification: (
    // 🔥 ADD THIS
    notif: Omit<AppNotification, "id" | "timestamp" | "userId" | "readBy">,
    forceUser?: AppUser,
  ) => void;
}

// Add this helper function right after the imports and before the TicketList component
const fetchCustomerForTicket = async (
  customerId: string,
): Promise<Customer | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .single();

  if (error) {
    console.error("Error fetching customer:", error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    mobile: data.mobile,
    address: data.address,
  };
};
// --- Receipt Generation Logic ---
export const generateTicketReceipt = async (
  ticket: Ticket,
  settings: AppSettings,
  shouldSave: boolean = false,
) => {
  // 🔥 FETCH CUSTOMER DATA
  const customer = await fetchCustomerForTicket(ticket.customerId);

  if (!customer) {
    alert("Unable to fetch customer data. Please try again.");
    return;
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Find Store Details
  const storeData = settings.stores.find((s) => s.name === ticket.store);
  const storeAddress =
    storeData?.address || "BENACHTY DURGAPUR KAMLPUR PLOT NEAR BINA INDIAN GAS";
  const storePhone = storeData?.phone || "+91 93829 79780";

  // Header
  doc.setFillColor(79, 70, 229); // Indigo-600
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("INFOFIX SERVICES", 15, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Professional IT & Device Repair Solutions", 15, 28);
  doc.text("Receipt of Device Acknowledgement", 15, 33);

  // Ticket Info Header
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`TICKET ID: ${ticket.ticketId}`, 15, 55);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${ticket.date}`, pageWidth - 60, 55);

  doc.setDrawColor(230, 230, 230);
  doc.line(15, 60, pageWidth - 15, 60);

  // Section: Customer Info - 🔥 NOW USING FETCHED CUSTOMER DATA
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Customer Information", 15, 72);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${customer.name}`, 15, 80);
  doc.text(`Mobile: ${customer.mobile}`, 15, 86);
  doc.text(`Email: ${customer.email}`, 15, 92);

  // Section: Device Info
  doc.setFont("helvetica", "bold");
  doc.text("Device Details", 100, 72);
  doc.setFont("helvetica", "normal");
  doc.text(`Type: ${ticket.deviceType}`, 100, 80);
  doc.text(`Brand/Model: ${ticket.brand} ${ticket.model}`, 100, 86);
  doc.text(`Serial No: ${ticket.serial || "N/A"}`, 100, 92);

  // Section: Problem Description
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 100, pageWidth - 30, 30, "F");
  doc.setFont("helvetica", "bold");
  doc.text("Issue Reported:", 20, 108);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const issueLines = doc.splitTextToSize(
    ticket.issueDescription,
    pageWidth - 40,
  );
  doc.text(issueLines, 20, 115);

  // --- LOGIN CREDENTIALS SECTION - 🔥 NOW USING CUSTOMER DATA ---
  doc.setFillColor(238, 242, 255); // Indigo-50
  doc.setDrawColor(199, 210, 254); // Indigo-200
  doc.roundedRect(15, 140, pageWidth - 30, 45, 3, 3, "FD");

  doc.setTextColor(67, 56, 202); // Indigo-700
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TRACK YOUR REPAIR ONLINE", pageWidth / 2, 150, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "Log in to our portal to check your work status, history, and more.",
    pageWidth / 2,
    157,
    { align: "center" },
  );

  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`Portal Login ID: ${customer.email}`, 25, 168);
  doc.text(`Default Password: ${customer.mobile}`, 25, 175);
  doc.setFontSize(8);
  doc.text("(Password is your registered mobile number)", 25, 180);

  // Footer / Terms
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text("Terms & Conditions:", 15, 195);
  const terms = [
    "1. We kindly request that you collect the device within 30 days of resolution, as it may sometimes be lost afterwards.",
    "2. While we take care during your entire resolution time, minor scratches may sometimes occur.",
    "3. Please note that the estimated amount may change after a detailed diagnosis of the device.",
    "4. Occasionally, the device may be unresponsive/dead at the time of diagnosis.",
    "5. I have read and agreed to all the terms and conditions.",
  ];

  let termY = 202;
  terms.forEach((term) => {
    // Split long text
    const lines = doc.splitTextToSize(term, pageWidth - 30);
    doc.text(lines, 15, termY);
    termY += lines.length * 4 + 1;
  });
  doc.setDrawColor(200);
  doc.line(15, 250, 80, 250);
  doc.text("Customer Signature", 30, 255);

  doc.line(pageWidth - 80, 250, pageWidth - 15, 250);
  doc.text("Authorized Signatory", pageWidth - 60, 255);

  doc.text(`Branch: ${ticket.store}`, pageWidth / 2, 275, { align: "center" });
  doc.text(`${storeAddress} • Tel: ${storePhone}`, pageWidth / 2, 280, {
    align: "center",
  });
  if (shouldSave) {
    doc.save(`Receipt_${ticket.ticketId}.pdf`);
  }
  // Convert PDF to Base64 and RETURN it (for emailing)
  const pdfBase64 = doc.output("datauristring");

  return {
    fileName: `Receipt_${ticket.ticketId}.pdf`,
    base64: pdfBase64.split(",")[1],
  };
};

// --- Delete Confirmation Modal ---
const DeleteConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4 mx-auto">
          <Trash2 size={24} />
        </div>
        <h3 className="text-lg font-bold text-center text-slate-800 mb-2">
          Delete Ticket?
        </h3>
        <p className="text-center text-slate-500 mb-6 text-sm">
          Are you sure you want to delete this ticket? This action cannot be
          undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

const TicketList: React.FC<TicketListProps> = ({
  tickets,
  setTickets,
  customers,
  setCustomers,
  settings,
  currentUser,
  selectedZoneId,
  onRefresh,
  teamMembers,
  zones,
  stores = [],
  pushNotification,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Edit & Delete State
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);

  // Filters State
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterStore, setFilterStore] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterDevice, setFilterDevice] = useState<string>("all");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  // --- FILTERING LOGIC ---
  const zoneFilteredTickets = useMemo(() => {
    let result = tickets.filter((t) => t.status !== "Pending Approval");

    // Zone Filter
    if (selectedZoneId !== "all") {
      const zoneStoreNames = stores
        .filter((s) => s.zoneId === selectedZoneId)
        .map((s) => s.name);
      result = result.filter((t) => zoneStoreNames.includes(t.store));
    }

    // Role Specific Filter
    if (currentUser.role === "TECHNICIAN") {
      result = result.filter((t) => t.assignedToId === currentUser.id);
    }

    return result;
  }, [tickets, selectedZoneId, stores, currentUser]);

  const normalize = (value?: string) => value?.toString().toLowerCase() || "";

  const filteredTickets = useMemo(() => {
    return zoneFilteredTickets.filter((ticket) => {
      // 1. Text Search
      const search = searchTerm.trim().toLowerCase();

      const matchesSearch =
        search === "" ||
        normalize(ticket.issueDescription).includes(search) ||
        normalize(ticket.name).includes(search) ||
        normalize(ticket.brand).includes(search) ||
        normalize(ticket.model).includes(search) ||
        normalize(ticket.deviceType).includes(search) ||
        normalize(ticket.store).includes(search);

      // 2. Assignee Filter
      const matchesAssignee =
        filterAssignee === "all" || ticket.assignedToId === filterAssignee;

      // 3. Store Filter
      const matchesStore =
        filterStore === "all" || ticket.store === filterStore;

      // 4. Status Filter
      const matchesStatus =
        filterStatus === "all" || ticket.status === filterStatus;

      // 5. Priority Filter
      const matchesPriority =
        filterPriority === "all" || ticket.priority === filterPriority;

      // 6. Device Type Filter
      const matchesDevice =
        filterDevice === "all" || ticket.deviceType === filterDevice;

      // 7. Date Range Filter
      let matchesDate = true;
      if (filterStartDate || filterEndDate) {
        const ticketDate = new Date(ticket.date);

        if (!isNaN(ticketDate.getTime())) {
          ticketDate.setHours(0, 0, 0, 0);

          if (filterStartDate) {
            const start = new Date(filterStartDate);
            start.setHours(0, 0, 0, 0);
            if (ticketDate < start) matchesDate = false;
          }
          if (filterEndDate && matchesDate) {
            const end = new Date(filterEndDate);
            end.setHours(23, 59, 59, 999);
            if (ticketDate > end) matchesDate = false;
          }
        }
      }

      return (
        matchesSearch &&
        matchesAssignee &&
        matchesStore &&
        matchesStatus &&
        matchesPriority &&
        matchesDevice &&
        matchesDate
      );
    });
  }, [
    zoneFilteredTickets,
    searchTerm,
    filterAssignee,
    filterStore,
    filterStatus,
    filterPriority,
    filterDevice,
    filterStartDate,
    filterEndDate,
  ]);

  const handleEdit = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (currentUser.role === "SUPER_ADMIN" || currentUser.role === "ADMIN") {
      setTicketToDelete(id);
    }
  };

  const confirmDelete = async () => {
    if (ticketToDelete) {
      try {
        const { error } = await supabase
          .from("tickets")
          .delete()
          .eq("id", ticketToDelete);

        if (error) throw error;

        // Update local state
        setTickets(tickets.filter((t) => t.id !== ticketToDelete));
      } catch (error) {
        console.error("Error deleting ticket:", error);
        alert("Failed to delete ticket. Please try again.");
      } finally {
        setTicketToDelete(null);
      }
    }
  };

  const clearFilters = () => {
    setFilterAssignee("all");
    setFilterStore("all");
    setFilterStatus("all");
    setFilterPriority("all");
    setFilterDevice("all");
    setFilterStartDate("");
    setFilterEndDate("");
    setSearchTerm("");
  };

  const hasActiveFilters =
    filterAssignee !== "all" ||
    filterStore !== "all" ||
    filterStatus !== "all" ||
    filterPriority !== "all" ||
    filterDevice !== "all" ||
    filterStartDate !== "" ||
    filterEndDate !== "";
  const handleOpenNew = () => {
    setEditingTicket(null);
    setIsModalOpen(true);
  };

  const handleTicketCreated = () => {
    setSearchTerm("");
  };

  const canDelete =
    currentUser.role === "SUPER_ADMIN" || currentUser.role === "ADMIN";

  const availableStores = useMemo(() => {
    if (selectedZoneId === "all") return stores;
    return stores.filter((s) => s.zoneId === selectedZoneId);
  }, [stores, selectedZoneId]);

  const availableTechs = useMemo(() => {
    let techs = teamMembers.filter(
      (m) => m.role === "TECHNICIAN" || m.role === "MANAGER",
    );
    if (selectedZoneId !== "all") {
      techs = techs.filter((t) => t.zoneId === selectedZoneId);
    }
    return techs;
  }, [teamMembers, selectedZoneId]);

  return (
    <div className="relative h-full min-h-[calc(100vh-140px)] flex flex-col">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Row 1: Search & View Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 w-full">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search tickets by ID, Name, Mobile..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value.trim().toLowerCase())
              }
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm text-slate-700"
            />
          </div>

          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-indigo-50 text-indigo-600 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Grid View"
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-indigo-50 text-indigo-600 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="List View"
            >
              <ListIcon size={20} />
            </button>
          </div>
        </div>

        {/* Row 2: Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Date Range Filter */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm h-9 hover:border-indigo-300 transition-colors">
            <Calendar size={14} className="text-slate-400" />
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="text-xs font-bold text-slate-600 outline-none bg-transparent w-24 cursor-pointer"
              title="Start Date"
            />
            <span className="text-slate-300 text-xs">-</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="text-xs font-bold text-slate-600 outline-none bg-transparent w-24 cursor-pointer"
              title="End Date"
            />
          </div>

          {/* Assignee Filter */}
          {currentUser.role !== "TECHNICIAN" && (
            <div className="relative group">
              <User
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none appearance-none cursor-pointer hover:border-indigo-300 transition-colors shadow-sm focus:ring-2 focus:ring-indigo-500/20 h-9"
              >
                <option value="all">All Techs</option>
                {availableTechs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Store Filter */}
          <div className="relative group">
            <MapPin
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              value={filterStore}
              onChange={(e) => setFilterStore(e.target.value)}
              className="pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none appearance-none cursor-pointer hover:border-indigo-300 transition-colors shadow-sm focus:ring-2 focus:ring-indigo-500/20 h-9"
            >
              <option value="all">All Stores</option>
              {availableStores.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative group">
            <Activity
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none appearance-none cursor-pointer hover:border-indigo-300 transition-colors shadow-sm focus:ring-2 focus:ring-indigo-500/20 h-9"
            >
              <option value="all">All Status</option>
              {settings.ticketStatuses.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="relative group">
            <AlertCircle
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none appearance-none cursor-pointer hover:border-indigo-300 transition-colors shadow-sm focus:ring-2 focus:ring-indigo-500/20 h-9"
            >
              <option value="all">All Priorities</option>
              {settings.priorities.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Device Filter */}
          <div className="relative group">
            <Monitor
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              value={filterDevice}
              onChange={(e) => setFilterDevice(e.target.value)}
              className="pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none appearance-none cursor-pointer hover:border-indigo-300 transition-colors shadow-sm focus:ring-2 focus:ring-indigo-500/20 h-9"
            >
              <option value="all">All Devices</option>
              {settings.deviceTypes.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors h-9"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pb-20 flex-1">
        {filteredTickets.length > 0 ? (
          viewMode === "grid" ? (
            // GRID VIEW
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative"
                >
                  {/* Card Actions (Hover) */}
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={async () =>
                        await generateTicketReceipt(ticket, settings, true)
                      } // Add true for saving
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      title="Print Receipt"
                    >
                      <Printer size={16} />
                    </button>
                    <button
                      onClick={() => handleEdit(ticket)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(ticket.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          ticket.priority === "High"
                            ? "bg-red-100 text-red-600"
                            : "bg-indigo-100 text-indigo-600"
                        }`}
                      >
                        {ticket.deviceType === "Laptop" ? (
                          <Laptop size={20} />
                        ) : ticket.deviceType === "Smartphone" ? (
                          <Smartphone size={20} />
                        ) : (
                          <User size={20} />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          {ticket.id}
                          {ticket.priority === "High" && (
                            <span
                              className="w-2 h-2 rounded-full bg-red-500"
                              title="High Priority"
                            />
                          )}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">
                          {ticket.name}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-2 py-1 text-xs rounded font-bold uppercase tracking-wider ${
                        ticket.status === "New"
                          ? "bg-blue-100 text-blue-700"
                          : ticket.status === "Resolved"
                            ? "bg-green-100 text-green-700"
                            : ticket.status === "Rejected"
                              ? "bg-red-100 text-red-700"
                              : ticket.status === "On Hold"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600 mb-4">
                    <p className="line-clamp-2 text-slate-800 font-medium italic">
                      "{ticket.issueDescription}"
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mt-2">
                      <div className="flex items-center gap-1">
                        <Phone size={12} /> {ticket.number}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin size={12} /> {ticket.store}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>{ticket.date}</span>
                    {ticket.warranty && (
                      <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                        <AlertTriangle size={10} /> Warranty
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // LIST VIEW
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-slate-600">
                        ID
                      </th>
                      <th className="px-6 py-4 font-semibold text-slate-600">
                        Customer
                      </th>
                      <th className="px-6 py-4 font-semibold text-slate-600">
                        Device
                      </th>
                      <th className="px-6 py-4 font-semibold text-slate-600">
                        Issue
                      </th>
                      <th className="px-6 py-4 font-semibold text-slate-600">
                        Status
                      </th>
                      <th className="px-6 py-4 font-semibold text-slate-600">
                        Priority
                      </th>
                      <th className="px-6 py-4 font-semibold text-slate-600">
                        Store
                      </th>
                      <th className="px-6 py-4 font-semibold text-slate-600 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="px-6 py-4 font-medium text-indigo-600">
                          {ticket.ticketId}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">
                            {ticket.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {ticket.number}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-800">
                            {ticket.deviceType}
                          </div>
                          <div className="text-xs text-slate-500">
                            {ticket.brand} {ticket.model}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className="max-w-xs truncate text-slate-600"
                            title={ticket.issueDescription}
                          >
                            {ticket.issueDescription}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase ${
                              ticket.status === "New"
                                ? "bg-blue-100 text-blue-700"
                                : ticket.status === "Resolved"
                                  ? "bg-green-100 text-green-700"
                                  : ticket.status === "Rejected"
                                    ? "bg-red-100 text-red-700"
                                    : ticket.status === "On Hold"
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                              ticket.priority === "High"
                                ? "bg-red-50 text-red-700 border-red-100"
                                : ticket.priority === "Medium"
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-100"
                                  : "bg-green-50 text-green-700 border-green-100"
                            }`}
                          >
                            {ticket.priority === "High" && (
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            )}
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {ticket.store}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                generateTicketReceipt(ticket, settings)
                              }
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Print Receipt"
                            >
                              <Printer size={16} />
                            </button>
                            <button
                              onClick={() => handleEdit(ticket)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(ticket.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-20 text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-700">
              No tickets found
            </p>
            <p className="text-sm">
              Try adjusting your search terms or zone selection.
            </p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleOpenNew}
        className="fixed bottom-8 right-8 lg:bottom-10 lg:right-10 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all transform hover:scale-105 z-40"
      >
        <Plus size={28} />
      </button>

      {/* New Ticket Modal */}
      <TicketFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customers={customers}
        setCustomers={setCustomers}
        tickets={tickets}
        setTickets={setTickets}
        settings={settings}
        currentUser={currentUser}
        editingTicket={editingTicket}
        onSuccess={handleTicketCreated}
        onRefresh={onRefresh}
        selectedZoneId={selectedZoneId}
        teamMembers={teamMembers}
        stores={stores}
        zones={zones}
        onEditingTicketUpdate={setEditingTicket}
        pushNotification={pushNotification}
      />

      <DeleteConfirmationModal
        isOpen={!!ticketToDelete}
        onClose={() => setTicketToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default TicketList;
