import React, { useState, useMemo } from "react";
import { Ticket, AppSettings, User } from "../types";
import {
  Check,
  X,
  Clock,
  FileText,
  User as UserIcon,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/supabaseClient";

interface ReviewReportsProps {
  tickets: Ticket[];
  setTickets: (tickets: Ticket[]) => void;
  currentUser: User;
}

export default function ReviewReports({
  tickets,
  setTickets,
  currentUser,
}: ReviewReportsProps) {
  // Filter for Pending Approval tickets
  const pendingTickets = tickets.filter((t) => t.status === "Pending Approval");
  const [loading, setLoading] = useState<string | null>(null);

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
            : t
        )
      );
    } catch (err: any) {
      alert(err.message || "Approval failed");
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setLoading(id);

    try {
      const ticketToReject = tickets.find((t) => t.id === id);
      if (!ticketToReject) {
        throw new Error("Ticket not found");
      }

      // Update status in Supabase
      const { data, error } = await supabase
        .from("tickets")
        .update({
          status: "Rejected",
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error rejecting ticket:", error);
        throw new Error(`Failed to reject ticket: ${error.message}`);
      }

      // Update local state
      const updatedTickets = tickets.map((t) =>
        t.id === id
          ? {
              ...t,
              status: "Rejected",
              history: [
                ...(t.history || []),
                {
                  id: Date.now().toString(),
                  timestamp: Date.now(),
                  date: new Date().toLocaleString(),
                  actorName: currentUser.name,
                  actorRole: currentUser.role,
                  action: "Ticket Rejected",
                  details: `Ticket rejected by ${currentUser.name} (${currentUser.role})`,
                },
              ],
            }
          : t
      );

      setTickets(updatedTickets);
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
                  onClick={() => handleReject(ticket.id)}
                  className="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <X size={18} /> Reject
                </button>
                <button
                  onClick={() => handleApprove(ticket.id)}
                  className="flex-1 md:flex-none px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                >
                  <Check size={18} /> Approve Ticket
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
