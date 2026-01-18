import React, { useState, useEffect } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  KeyRound,
} from "lucide-react";
import { supabase } from "@/supabaseClient";

interface ResetPasswordProps {
  onSuccess: () => void;
}

export default function ResetPassword({ onSuccess }: ResetPasswordProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "success" | "error" | "invalid"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Check if user has a valid recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setStatus("invalid");
      }
    });
  }, []);

  const validatePassword = (pass: string) => {
    return pass.length >= 8;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword(newPassword)) {
      setStatus("error");
      setErrorMessage("Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setErrorMessage("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setStatus("success");

      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setStatus("error");
      setErrorMessage(
        err.message || "Failed to reset password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength =
    newPassword.length >= 12
      ? "strong"
      : newPassword.length >= 8
      ? "medium"
      : "weak";
  const passwordsMatch =
    newPassword === confirmPassword && newPassword.length > 0;

  if (status === "invalid") {
    return (
      <div className="h-[100dvh] bg-[#020617] flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="w-full max-w-[420px] glass-panel rounded-[2.5rem] overflow-hidden p-8 text-center">
          <AlertCircle size={64} className="text-rose-400 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white mb-2">
            Invalid Reset Link
          </h2>
          <p className="text-sm text-slate-300 mb-6">
            This password reset link is invalid or has expired.
          </p>
          <button
            onClick={onSuccess}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-2xl"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

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
              <KeyRound size={32} className="text-white" />
              <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter drop-shadow-md">
                CREATE NEW{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  PASSWORD
                </span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mt-1.5 opacity-80">
                Secure Your Account
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
                  Password Updated!
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Your password has been successfully reset.
                </p>
                <p className="text-xs text-slate-400 mt-3">
                  Redirecting you to login...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Choose a strong password with at least 8 characters.
                </p>
              </div>

              {status === "error" && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] rounded-xl flex items-start gap-2.5 font-bold animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1.5 input-group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-all duration-300 input-icon"
                    size={18}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none transition-all placeholder:text-slate-600"
                    placeholder="••••••••"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {newPassword && (
                  <div className="ml-1 flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordStrength === "strong"
                            ? "w-full bg-emerald-500"
                            : passwordStrength === "medium"
                            ? "w-2/3 bg-yellow-500"
                            : "w-1/3 bg-rose-500"
                        }`}
                      ></div>
                    </div>
                    <span
                      className={`text-[9px] font-bold uppercase ${
                        passwordStrength === "strong"
                          ? "text-emerald-400"
                          : passwordStrength === "medium"
                          ? "text-yellow-400"
                          : "text-rose-400"
                      }`}
                    >
                      {passwordStrength}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 input-group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-all duration-300 input-icon"
                    size={18}
                  />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        passwordsMatch &&
                        validatePassword(newPassword)
                      ) {
                        handleSubmit(e);
                      }
                    }}
                    className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none transition-all placeholder:text-slate-600"
                    placeholder="••••••••"
                  />
                  <button
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {confirmPassword && (
                  <p
                    className={`text-[9px] font-bold ml-1 flex items-center gap-1 ${
                      passwordsMatch ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {passwordsMatch ? (
                      <>
                        <CheckCircle size={10} /> Passwords match
                      </>
                    ) : (
                      <>
                        <AlertCircle size={10} /> Passwords don't match
                      </>
                    )}
                  </p>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={
                  isLoading || !passwordsMatch || !validatePassword(newPassword)
                }
                className="w-full py-4.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100 group active:scale-95 text-[11px] uppercase tracking-[0.25em] relative overflow-hidden"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span className="relative z-10 flex items-center gap-2 p-2">
                      <Shield size={18} /> Reset Password
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="py-3 px-8 border-t border-white/5 flex justify-center items-center bg-black/20 text-[9px] font-bold text-slate-600 uppercase tracking-wider">
          <p>© 2025 INFOFIX - Secure Password Reset</p>
        </div>
      </div>
    </div>
  );
}
