import React, { useState } from "react";
import {
  Mail,
  ArrowLeft,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Info,
} from "lucide-react";
import { supabase } from "@/supabaseClient";

interface ForgotPasswordProps {
  onBack: () => void;
}

export default function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const cleanEmail = email.trim().toLowerCase();
      await supabase.auth.signOut();
   const redirectUrl = window.location.origin

      const { data, error } = await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo: redirectUrl,
        },
      );

      if (error) {
        console.error("Reset password error:", error);
        if (error.message.includes("SMTP") || error.message.includes("email")) {
          throw new Error(
            "Email service temporarily unavailable. Please contact admin or try again later.",
          );
        }
        throw error;
      }

      setStatus("success");
    } catch (err: any) {
      console.error("Password reset error:", err);
      setStatus("error");
      if (err.message.includes("User not found")) {
        setErrorMessage("No account found with this email address.");
      } else if (err.message.includes("rate limit")) {
        setErrorMessage(
          "Too many requests. Please wait a few minutes and try again.",
        );
      } else if (
        err.message.includes("SMTP") ||
        err.message.includes("unexpected_failure")
      ) {
        setErrorMessage(
          "Email service configuration error. Please contact your system administrator.",
        );
      } else {
        setErrorMessage(
          err.message || "Failed to send reset email. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="h-[100dvh] bg-[#020617] flex items-center justify-center p-4 sm:p-6 font-sans selection:bg-indigo-500/30 overflow-hidden relative isolate">
      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#0f172a_0%,transparent_90%)] opacity-60"></div>

        <div className="absolute left-[20%] top-[20%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 bg-indigo-600 animate-pulse transition-all duration-[2000ms]"></div>
        <div className="absolute right-[10%] bottom-[10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-10 bg-purple-600 transition-all duration-[3000ms]"></div>

        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(white 1px, transparent 1px)",
            backgroundSize: "50px 50px",
            opacity: 0.05,
          }}
        ></div>
      </div>

      <style>{`
        .glass-panel {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .input-group:focus-within .input-icon { color: #6366f1; transform: translateY(-50%) scale(1.1); }
        .input-group:focus-within input { border-color: #6366f160; background: rgba(255,255,255,0.08); }
      `}</style>

      {/* MAIN CARD */}
      <div className="w-full max-w-[420px] glass-panel rounded-none sm:rounded-[2.5rem] overflow-hidden z-10">
        {/* Header */}
        <div className="px-8 pt-10 pb-6 text-center relative">
          <div className="flex flex-col items-center gap-4 mb-2 animate-in slide-in-from-top-4 duration-700">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-2 ring-4 ring-white/5 relative group cursor-default transition-transform hover:scale-105">
              <Shield size={32} className="text-white" />
              <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter drop-shadow-md">
                RESET{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  PASSWORD
                </span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mt-1.5 opacity-80">
                Staff Account Recovery
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          {status === "success" ? (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
                <CheckCircle
                  size={48}
                  className="text-emerald-400 mx-auto mb-4"
                />
                <h3 className="text-lg font-black text-white mb-2">
                  Email Sent!
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  We've sent password reset instructions to{" "}
                  <span className="font-bold text-white">{email}</span>
                </p>
                <p className="text-xs text-slate-400 mt-3">
                  Check your inbox and spam folder. The link expires in 24
                  hours.
                </p>
              </div>
              <button
                onClick={onBack}
                className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.25em]"
              >
                <ArrowLeft size={18} /> Back to Login
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Enter your email address and we'll send you instructions to
                  reset your password.
                </p>
              </div>

              {status === "error" && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] rounded-xl flex items-start gap-2.5 font-bold animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="mb-1">{errorMessage}</p>
                    {errorMessage.includes("administrator") && (
                      <p className="text-[10px] text-rose-300 mt-2 flex items-start gap-1">
                        <Info size={12} className="shrink-0 mt-0.5" />
                        <span>
                          The email service needs to be configured in Supabase.
                          Contact your admin for assistance.
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-1.5 input-group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 input-icon ${
                      isEmailValid ? "text-indigo-400" : "text-slate-500"
                    }`}
                    size={18}
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && isEmailValid && !isLoading) {
                        handleSubmit(e);
                      }
                    }}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none transition-all placeholder:text-slate-600"
                    placeholder="staff@infofix.com"
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isLoading || !isEmailValid}
                className="w-full py-4.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100 group active:scale-95 text-[11px] uppercase tracking-[0.25em] relative overflow-hidden"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span className="relative z-10 flex items-center gap-2 p-2">
                      <Send size={18} /> Send Reset Link
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  </>
                )}
              </button>

              <button
                onClick={onBack}
                className="w-full py-3 text-slate-400 hover:text-white font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 transition-colors group"
              >
                <ArrowLeft
                  size={12}
                  className="group-hover:-translate-x-1 transition-transform"
                />
                Back to Login
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="py-3 px-8 border-t border-white/5 flex justify-center items-center bg-black/20 text-[9px] font-bold text-slate-600 uppercase tracking-wider">
          <p>© 2025 INFOFIX - Secure Password Recovery</p>
        </div>
      </div>
    </div>
  );
}
