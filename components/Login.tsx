import React, { useState, useEffect, useMemo } from "react";
import { User, Role, Customer } from "../types";
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  Sparkles,
  Shield,
  ArrowLeft,
  Loader2,
  Check,
  Smartphone,
  Fingerprint,
  ShieldCheck,
  ArrowRight,
  ShieldAlert,
  Globe,
  Waves,
  Snowflake,
} from "lucide-react";
import { supabase } from "@/supabaseClient";
interface LoginProps {
  onLogin: (user: User) => void;
  teamMembers: User[];
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
}

export default function Login({
  onLogin,
  teamMembers,
  customers,
  setCustomers,
}: LoginProps) {
  const [activeTab, setActiveTab] = useState<"staff" | "customer">("customer");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regPhone, setRegPhone] = useState("");

  // UI States
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  // Dynamic Theme Mapping
  const theme = {
    staff: { color: "indigo", hex: "#6366f1" },
    customer: { color: "emerald", hex: "#10b981" },
  }[activeTab];

  // Advanced 3D Snow Generation logic
  const snowflakeLayers = useMemo(() => {
    const generateLayer = (
      count: number,
      z: number,
      speedMult: number,
      sizeBase: number,
      blur: string
    ) =>
      Array.from({ length: count }).map((_, i) => ({
        id: `${z}-${i}`,
        left: `${Math.random() * 100}%`,
        size: `${Math.random() * sizeBase + 2}px`,
        duration: `${(Math.random() * 15 + 10) / speedMult}s`,
        delay: `${Math.random() * -30}s`,
        opacity: Math.random() * 0.6 + 0.1,
        blur: blur,
        sway: `${Math.random() * 120 - 60}px`, // Horizontal drift
        tz: z * 100, // Z-axis translation
        z,
      }));

    return [
      ...generateLayer(60, 0, 0.4, 2, "4px"), // Far Background
      ...generateLayer(40, 1, 0.8, 5, "1px"), // Mid-ground
      ...generateLayer(20, 2, 1.8, 12, "0px"), // Near Foreground
    ];
  }, []);

  // Load cached credentials

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  {
    /*} const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    await new Promise(r => setTimeout(r, 1400));

    if (activeTab === 'staff') {
      const user = teamMembers.find(m => m.email.toLowerCase() === cleanEmail);
      if (user && (cleanPass === user.password || cleanPass === '123456')) {
        if (rememberMe) localStorage.setItem('staff_auth_cache', JSON.stringify({ u: cleanEmail, p: cleanPass }));
        onLogin(user);
      } else {
        setError('Authorization Denied. Check credentials.');
        triggerShake();
      }
    } else {
      if (isSignUp) {
        if (!regName || !regPhone || !regAddress || !cleanEmail) {
          setError('Incomplete identity nodes.');
          setIsLoading(false);
          return;
        }
        const existing = customers.find(c => c.email.toLowerCase() === cleanEmail);
        if (existing) {
          setError('Email already exists in registry.');
          setIsLoading(false);
          return;
        }
        const newCustomer: Customer = {
          id: `CUST-${Date.now().toString().slice(-4)}`,
          name: regName, email: cleanEmail, mobile: regPhone, address: regAddress
        };
        setCustomers([...customers, newCustomer]);
        onLogin({ id: newCustomer.id, name: newCustomer.name, email: newCustomer.email, role: 'CUSTOMER' });
      } else {
        const customer = customers.find(c => c.email.toLowerCase() === cleanEmail);
        if (customer && customer.mobile === cleanPass) {
          if (rememberMe) localStorage.setItem('customer_auth_cache', JSON.stringify({ u: cleanEmail, p: cleanPass }));
          onLogin({ id: customer.id, name: customer.name, email: customer.email, role: 'CUSTOMER' });
        } else {
          setError('Node not found. Verify identity.');
          triggerShake();
        }
      }
    }
    setIsLoading(false);
  };*/
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    try {
      if (activeTab === "staff") {
        await handleStaffLogin(cleanEmail, cleanPass);
      } else {
        await handleCustomerLogin();
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "Authentication failed");
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };
  const handleStaffLogin = async (email: string, password: string) => {
    // 1️⃣ Auth login
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error("Authentication failed: user missing");
    }

    // 2️⃣ Fetch staff USING auth_id (NOT email)
    const { data: staff, error: staffErr } = await supabase
      .from("users") // ✅ CORRECT TABLE
      .select("*")
      .eq("auth_id", authData.user.id)
      .maybeSingle(); // ✅ SAFE

    if (staffErr) {
      console.error("Staff fetch error:", staffErr);
      throw new Error("Staff profile query failed");
    }

    if (!staff) {
      throw new Error("Staff profile not found. Contact admin.");
    }

    // 3️⃣ Pass clean user to app
    onLogin({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      mobile: staff.mobile,
      zoneId: staff.zone_id,
      storeId: staff.store_id,
      address: staff.address,
    });
  };

  const handleCustomerLogin = async () => {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    const { data: customer, error: custErr } = await supabase
      .from("customers")
      .select("*")
      .eq("auth_id", authData.user.id)
      .single();

    if (custErr || !customer) {
      alert("Customer profile not found");
      return;
    }

    // ✅ THIS IS THE MOST IMPORTANT PART
    onLogin({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      role: "CUSTOMER",
      zoneId: "all",
    });
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div
      className="min-h-screen bg-[#010409] flex items-center justify-center p-4 sm:p-6 font-sans selection:bg-indigo-500/30 overflow-hidden relative"
      style={{ perspective: "1200px" }}
    >
      {/* 3D SNOW WORLD - LAYER 0 & 1 (Background and Midground) */}
      <div
        className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
        style={{ transformStyle: "preserve-3d" }}
      >
        {snowflakeLayers
          .filter((f) => f.z <= 1)
          .map((flake) => (
            <div
              key={flake.id}
              className="absolute bg-white rounded-full animate-snow-3d"
              style={
                {
                  left: flake.left,
                  top: "-50px",
                  width: flake.size,
                  height: flake.size,
                  opacity: flake.opacity,
                  filter: `blur(${flake.blur})`,
                  animationDuration: flake.duration,
                  animationDelay: flake.delay,
                  "--sway": flake.sway,
                  "--tz": `${flake.tz}px`,
                } as any
              }
            />
          ))}
      </div>

      {/* ATMOSPHERIC GLOW */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#0f172a_0%,transparent_70%)] opacity-80"></div>
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[140px] opacity-10 transition-all duration-1000"
          style={{ backgroundColor: theme.hex }}
        ></div>
      </div>

      <style>{`
        @keyframes snow-3d {
          0% { transform: translateY(-10vh) translateX(0) translateZ(var(--tz)); }
          50% { transform: translateY(50vh) translateX(var(--sway)) translateZ(var(--tz)); }
          100% { transform: translateY(120vh) translateX(0) translateZ(var(--tz)); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        
        .scrooller::-webkit-scrollbar {
          width: 5px;
        }
        .scrooller::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.01);
          border-radius: 10px;
        }
        .scrooller::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .scrooller::-webkit-scrollbar-thumb:hover {
          background: ${theme.hex}50;
        }

        .glass-card {
          background: rgba(13, 17, 23, 0.7);
          backdrop-filter: blur(40px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.8), inset 0 0 1px 1px rgba(255, 255, 255, 0.05);
        }
        
        .animate-snow-3d {
          animation-name: snow-3d;
          animation-iteration-count: infinite;
          animation-timing-function: linear;
        }
      `}</style>

      {/* COMPACT AUTH CARD */}
      <div
        className={`w-full max-w-[460px] h-full sm:h-auto sm:max-h-[92vh] glass-card rounded-none sm:rounded-[3.5rem] overflow-hidden flex flex-col transition-all duration-700 z-10 ${
          shake ? "animate-shake" : ""
        }`}
      >
        {/* Fixed Branding Header */}
        <div className="px-8 pt-8 pb-3 text-center shrink-0 border-b border-white/5">
          <div className="inline-flex items-center gap-3 mb-4 animate-in slide-in-from-top-4 duration-700">
            <div
              className={`w-10 h-10 bg-${theme.color}-600 rounded-xl flex items-center justify-center text-white shadow-2xl shadow-${theme.color}-500/40 ring-1 ring-white/30 transition-all duration-700`}
            >
              <ShieldCheck size={24} strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <h1 className="text-lg font-black text-white tracking-tighter uppercase leading-none">
                INFOFIX{" "}
                <span className={`text-${theme.color}-400 transition-colors`}>
                  SERVICES
                </span>
              </h1>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1 flex items-center gap-1">
                <span
                  className={`w-1 h-1 rounded-full bg-${theme.color}-500`}
                ></span>{" "}
                SUPPORT
              </p>
            </div>
          </div>

          <h2 className="text-xl font-black text-white tracking-tight mb-1">
            {isSignUp
              ? "New Registry"
              : activeTab === "staff"
              ? "STAFF"
              : "CUSTOMER SUPPORT"}
          </h2>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto scrooller px-8 py-4">
          {!isSignUp && (
            <div className="pb-4">
              <div className="bg-white/5 p-1 rounded-2xl flex relative border border-white/5 shadow-inner">
                <div
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/10 rounded-xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    activeTab === "customer" ? "left-1" : "left-[calc(50%+1px)]"
                  }`}
                ></div>
                <button
                  onClick={() => setActiveTab("customer")}
                  className={`flex-1 py-2 relative z-10 text-[9px] font-black uppercase tracking-[0.25em] transition-colors duration-500 flex items-center justify-center gap-2 ${
                    activeTab === "customer"
                      ? `text-${theme.color}-400`
                      : "text-slate-500"
                  }`}
                >
                  <UserIcon size={12} /> Client
                </button>
                <button
                  onClick={() => setActiveTab("staff")}
                  className={`flex-1 py-2 relative z-10 text-[9px] font-black uppercase tracking-[0.25em] transition-colors duration-500 flex items-center justify-center gap-2 ${
                    activeTab === "staff"
                      ? `text-${theme.color}-400`
                      : "text-slate-500"
                  }`}
                >
                  <Shield size={12} /> Staff
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] rounded-xl flex items-center gap-2 font-bold animate-in fade-in slide-in-from-top-2">
              <ShieldAlert size={14} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp ? (
              <div className="space-y-3 animate-in fade-in duration-500">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Identity Name
                  </label>
                  <div className="relative">
                    <UserIcon
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                      size={14}
                    />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:ring-4 ring-indigo-50/10 focus:border-indigo-500 transition-all shadow-inner"
                      placeholder="Enter Full Name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Email Node
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:ring-4 ring-indigo-50/10 transition-all shadow-inner"
                      placeholder="user@domain.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Mobile UID
                    </label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:ring-4 ring-indigo-50/10 transition-all shadow-inner"
                      placeholder="+91..."
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Address Location
                  </label>
                  <textarea
                    required
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:ring-4 ring-indigo-50/10 transition-all h-20 resize-none scrooller shadow-inner"
                    placeholder="Detailed service address..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Identity ID
                  </label>
                  <div className="relative group">
                    <Mail
                      className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                        isEmailValid
                          ? `text-${theme.color}-400`
                          : "text-slate-500"
                      }`}
                      size={14}
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:ring-4 ring-indigo-50/10 focus:border-indigo-500 transition-all shadow-inner"
                      placeholder="user@infofix.com"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      {activeTab === "staff"
                        ? "Access Cipher"
                        : "Phone Identity"}
                    </label>
                  </div>
                  <div className="relative">
                    {activeTab === "staff" ? (
                      <>
                        <Lock
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                          size={14}
                        />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:ring-4 ring-indigo-50/10 focus:border-indigo-500 transition-all shadow-inner"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <Smartphone
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                          size={14}
                        />
                        <input
                          type="tel"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:ring-4 ring-indigo-50/10 focus:border-indigo-500 transition-all shadow-inner"
                          placeholder="+91..."
                        />
                      </>
                    )}
                  </div>
                </div>
                <div
                  className="flex items-center gap-3 pt-0.5 cursor-pointer group"
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                      rememberMe
                        ? `bg-${theme.color}-600 border-${theme.color}-600 shadow-lg shadow-${theme.color}-500/20`
                        : "bg-transparent border-white/10 group-hover:border-white/20"
                    }`}
                  >
                    {rememberMe && (
                      <Check size={10} strokeWidth={4} className="text-white" />
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                    Persist Session
                  </span>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 bg-${theme.color}-600 text-white font-black rounded-xl shadow-2xl shadow-${theme.color}-500/30 hover:bg-${theme.color}-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 group active:scale-95 text-xs uppercase tracking-widest`}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : isSignUp ? (
                  <>
                    <UserPlus size={16} /> Initialize
                  </>
                ) : (
                  <>
                    <LogIn size={16} /> Authorize
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* FIXED NAVIGATION AREA */}
        <div className="px-8 py-3 shrink-0 border-t border-white/5 bg-white/2">
          {activeTab === "customer" && !isSignUp && (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 animate-in fade-in duration-1000 relative group overflow-hidden">
              <div
                className={`absolute -right-4 -bottom-4 w-16 h-16 bg-${theme.color}-500 blur-3xl opacity-10 group-hover:opacity-30 transition-all`}
              ></div>
              <div className="flex items-center justify-between mb-2 relative z-10">
                <h4 className="text-[10px] font-black text-white tracking-tight uppercase">
                  New Member?
                </h4>
                <Sparkles size={12} className="text-amber-400 animate-pulse" />
              </div>
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className="w-full py-2.5 bg-white text-slate-900 font-black rounded-lg text-[8px] uppercase tracking-[0.25em] hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-xl relative z-10"
              >
                Join Registry <ArrowRight size={10} />
              </button>
            </div>
          )}

          {isSignUp && (
            <div className="py-1 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className="text-slate-500 hover:text-white font-black uppercase tracking-[0.25em] text-[8px] inline-flex items-center gap-2 transition-colors group"
              >
                <ArrowLeft
                  size={12}
                  className="group-hover:-translate-x-1 transition-transform"
                />{" "}
                Back to Entry
              </button>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="bg-white/5 py-4 px-8 border-t border-white/5 flex justify-between items-center shrink-0">
          <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em]">
            © 2025 INFOFIX SERVICE HAPPY TO HELP
          </p>
          <div className="flex gap-3">
            <Globe size={10} className="text-slate-600" />
            <Shield size={10} className="text-slate-600" />
          </div>
        </div>
      </div>

      {/* 3D SNOW WORLD - LAYER 2 (Foreground - In front of card) */}
      <div
        className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
        style={{ transformStyle: "preserve-3d" }}
      >
        {snowflakeLayers
          .filter((f) => f.z === 2)
          .map((flake) => (
            <div
              key={flake.id}
              className="absolute bg-white rounded-full animate-snow-3d"
              style={
                {
                  left: flake.left,
                  top: "-50px",
                  width: flake.size,
                  height: flake.size,
                  opacity: flake.opacity,
                  filter: `blur(${flake.blur})`,
                  animationDuration: flake.duration,
                  animationDelay: flake.delay,
                  "--sway": flake.sway,
                  "--tz": `${flake.tz}px`,
                } as any
              }
            />
          ))}
      </div>
    </div>
  );
}
