import React, { useState } from "react";
import { Ticket, User } from "../types";
import {
  Check,
  X,
  Calendar,
  User as UserIcon,
  FileText,
  AlertTriangle,
  MessageSquare,
  UserX,
} from "lucide-react";
import { supabase } from "@/supabaseClient";

interface ReviewReportsProps {
  tickets: Ticket[];
  setTickets: (tickets: Ticket[]) => void;
  currentUser: User;
}

// Rejection Modal Component
const RejectionModal = ({
  isOpen,
  onClose,
  onConfirm,
  ticketId,
  isSubmitting = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (staffReason: string, customerReason: string) => void;
  ticketId: string;
  isSubmitting?: boolean;
}) => {
  const [staffReason, setStaffReason] = useState("");
  const [customerReason, setCustomerReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!staffReason.trim() || !customerReason.trim()) {
      setError("Both rejection reasons are required");
      return;
    }
    onConfirm(staffReason, customerReason);
    setStaffReason("");
    setCustomerReason("");
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-red-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Reject Ticket
              </h3>
              <p className="text-xs text-slate-500">Ticket ID: {ticketId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-red-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 bg-slate-50">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-800 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-2">
              <UserX size={14} />
              Internal Rejection Reason (Staff Only) *
            </label>
            <textarea
              value={staffReason}
              onChange={(e) => setStaffReason(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all resize-none h-24"
              placeholder="Enter the internal reason for rejection (visible to staff only)..."
            />
            <p className="text-xs text-slate-500 italic">
              This reason will only be visible to staff members
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-2">
              <MessageSquare size={14} />
              Customer-Facing Rejection Reason *
            </label>
            <textarea
              value={customerReason}
              onChange={(e) => setCustomerReason(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all resize-none h-24"
              placeholder="Enter the reason that will be shown to the customer..."
            />
            <p className="text-xs text-slate-500 italic">
              This message will be visible to the customer in their timeline
            </p>
          </div>

          <div className="bg-amber-50 p-4 rounded-xl text-xs text-amber-800 flex gap-3 border border-amber-100 items-start">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Important:</strong> Once rejected, this ticket will be
              marked as closed. The customer will be notified with the
              customer-facing reason you provide above.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Rejecting...
              </>
            ) : (
              <>
                <UserX size={18} />
                Confirm Rejection
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ReviewReports({
  tickets,
  setTickets,
  currentUser,
}: ReviewReportsProps) {
  const pendingTickets = tickets.filter((t) => t.status === "Pending Approval");
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectingTicketId, setRejectingTicketId] = useState<string | null>(
    null,
  );
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);

  const getNextTicketNumber = () => {
    const existingNumbers = tickets
      .map((t) => t.ticketId)
      .filter((id): id is string => !!id && id.startsWith("TKT-IF-"))
      .map((id) => parseInt(id.replace("TKT-IF-", ""), 10))
      .filter((n) => !isNaN(n));

    const maxNumber =
      existingNumbers.length > 0 ? Math.max(...existingNumbers) : 197;

    return maxNumber + 1;
  };

  const handleApprove = async (id: string) => {
    setLoading(id);

    try {
      const ticketToApprove = tickets.find((t) => t.id === id);
      if (!ticketToApprove) throw new Error("Ticket not found");

      const nextNumber = getNextTicketNumber();
      const paddedNumber = nextNumber.toString().padStart(3, "0");
      const formalTicketId = `TKT-IF-${paddedNumber}`;

      const { error } = await supabase
        .from("tickets")
        .update({
          status: "New",
          ticket_id: formalTicketId,
        })
        .eq("id", id);

      if (error) throw error;

      setTickets(
        tickets.map((t) =>
          t.id === id
            ? {
                ...t,
                status: "New",
                ticketId: formalTicketId,
                history: [
                  ...(t.history || []),
                  {
                    id: Date.now().toString(),
                    timestamp: Date.now(),
                    date: new Date().toLocaleString(),
                    actorName: currentUser.name,
                    actorRole: currentUser.role,
                    action: "Ticket Approved",
                    details: `Ticket approved. New Ticket ID: ${formalTicketId}`,
                  },
                ],
              }
            : t,
        ),
      );

      alert("Ticket approved successfully!");
    } catch (err: any) {
      alert(err.message || "Approval failed");
    } finally {
      setLoading(null);
    }
  };

  const handleRejectClick = (ticketId: string) => {
    setRejectingTicketId(ticketId);
    setIsRejectionModalOpen(true);
  };

  const handleRejectConfirm = async (
    staffReason: string,
    customerReason: string,
  ) => {
    if (!rejectingTicketId) return;

    setLoading(rejectingTicketId);

    try {
      const ticketToReject = tickets.find((t) => t.id === rejectingTicketId);
      if (!ticketToReject) {
        throw new Error("Ticket not found");
      }

      // ✅ Create rejection history entry
      const rejectionHistory = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        date: new Date().toLocaleString(),
        actorName: currentUser.name,
        actorRole: currentUser.role,
        action: "Ticket Rejected",
        details: customerReason, // Customer-facing reason in details
      };

      // ✅ Build updated history array
      const updatedHistory = [
        ...(ticketToReject.history || []),
        rejectionHistory,
      ];

      // ✅ Update in Supabase with history
      const { error } = await supabase
        .from("tickets")
        .update({
          status: "Rejected",
          rejection_reason_staff: staffReason,
          rejection_reason_customer: customerReason,
          history: JSON.stringify(updatedHistory), // ✅ Save history
        })
        .eq("id", rejectingTicketId);

      if (error) {
        console.error("Error rejecting ticket:", error);
        throw new Error(`Failed to reject ticket: ${error.message}`);
      }

      // ✅ Update local state
      const updatedTickets = tickets.map((t) =>
        t.id === rejectingTicketId
          ? {
              ...t,
              status: "Rejected",
              rejectionReasonStaff: staffReason,
              rejectionReasonCustomer: customerReason,
              history: updatedHistory, // ✅ Update local history
            }
          : t,
      );

      setTickets(updatedTickets);
      setIsRejectionModalOpen(false);
      setRejectingTicketId(null);
      alert("Ticket rejected successfully!");
    } catch (error: any) {
      console.error("Rejection error:", error);
      alert(error.message || "Failed to reject ticket");
    } finally {
      setLoading(null);
    }
  };
  return (
    <div className="space-y-6">
      <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Review Incoming Requests</h2>
          <p className="text-indigo-200">
            Approve or reject service requests submitted by customers.
          </p>
        </div>
        <div className="text-3xl font-bold bg-white/20 px-4 py-2 rounded-xl">
          {pendingTickets.length}
        </div>
      </div>

      {pendingTickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
            <Check size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">All Caught Up!</h3>
          <p className="text-slate-500">
            There are no pending requests to review.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide">
                    {ticket.ticketId}
                  </span>
                  <span className="text-sm text-slate-500 flex items-center gap-1">
                    <Calendar size={14} /> {ticket.date}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  {ticket.issueDescription}
                </h3>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <UserIcon size={14} /> {ticket.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText size={14} /> {ticket.deviceType}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => handleRejectClick(ticket.id)}
                  disabled={loading === ticket.id}
                  className="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={18} /> Reject
                </button>
                <button
                  onClick={() => handleApprove(ticket.id)}
                  disabled={loading === ticket.id}
                  className="flex-1 md:flex-none px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === ticket.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <Check size={18} />
                  )}
                  Approve Ticket
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <RejectionModal
        isOpen={isRejectionModalOpen}
        onClose={() => {
          setIsRejectionModalOpen(false);
          setRejectingTicketId(null);
        }}
        onConfirm={handleRejectConfirm}
        ticketId={rejectingTicketId || ""}
        isSubmitting={loading !== null}
      />
    </div>
  );
}
