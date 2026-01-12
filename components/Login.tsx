import React, { useState, useEffect, useMemo } from "react";
import { User, Role, Customer, AppNotification } from "../types";
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
  Zap,
} from "lucide-react";
import { supabase } from "@/supabaseClient";
import NotificationHub from "./NotificationHub";

interface LoginProps {
  onLogin: (user: User) => void;
  teamMembers: User[];
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  pushNotification: (
    notif: Omit<AppNotification, "id" | "timestamp" | "read" | "userId">
  ) => void;
}

export default function Login({
  onLogin,
  teamMembers,
  customers,
  setCustomers,
  pushNotification,
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
    staff: {
      primary: "indigo",
      hex: "#6366f1",
      gradient: "from-indigo-600 to-purple-600",
      shadow: "shadow-indigo-500/20",
    },
    customer: {
      primary: "emerald",
      hex: "#10b981",
      gradient: "from-emerald-500 to-teal-500",
      shadow: "shadow-emerald-500/20",
    },
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

  // Load cached credentials on component mount AND when tab changes

  // Load cached credentials on component mount AND when tab changes
  useEffect(() => {
    const loadCachedCredentials = () => {
      try {
        // Load based on active tab
        const cacheKey =
          activeTab === "staff" ? "staff_auth_cache" : "customer_auth_cache";
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
          const { u: cachedEmail, p: cachedPassword } = JSON.parse(cached);
          setEmail(cachedEmail || "");
          setPassword(cachedPassword || "");
        } else {
          // Clear fields if no cache exists for this tab
          if (activeTab === "customer") {
            setEmail("user@infofix.com");
            setPassword("");
          } else {
            setEmail("");
            setPassword("");
          }
        }
      } catch (err) {
        console.error("Error loading cached credentials:", err);
        // Set defaults on error
        if (activeTab === "customer") {
          setEmail("user@infofix.com");
          setPassword("");
        } else {
          setEmail("");
          setPassword("");
        }
      }
    };

    loadCachedCredentials();
  }, [activeTab]);
  const handleCustomerSignup = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPhone = regPhone.trim();

      if (cleanPhone.length !== 10) {
        throw new Error("Mobile number must be 10 digits");
      }

      // ✅ STEP 1: CREATE AUTH USER
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPhone, // 👈 phone is password
          options: {
            data: {
              role: "CUSTOMER",
              name: regName,
            },
          },
        });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("Auth user not created");

      const authUser = signUpData.user;

      // ✅ STEP 2: INSERT CUSTOMER PROFILE
      const { data: customer, error: insertError } = await supabase
        .from("customers")
        .insert({
          auth_id: authUser.id, // 🔥 VERY IMPORTANT
          name: regName,
          email: cleanEmail,
          mobile: cleanPhone,
          address: regAddress,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // ✅ STEP 3: AUTO LOGIN
      onLogin({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        role: "CUSTOMER",
        zoneId: "all",
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Customer signup failed");
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

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
        if (isSignUp) {
          await handleCustomerSignup(); // 👈 ADD THIS
        } else {
          await handleCustomerLogin();
        }
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
    localStorage.setItem(
      "staff_auth_cache",
      JSON.stringify({
        u: email,
        p: password,
      })
    );
    // 1️⃣ Auth login
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Auth user missing");

    const authUser = authData.user;

    // 2️⃣ Try to fetch staff profile
    let { data: staff, error: staffErr } = await supabase
      .from("users") // your staff table
      .select("*")
      .eq("auth_id", authUser.id)
      .maybeSingle();

    if (staffErr) {
      console.error("Staff fetch error:", staffErr);
      throw new Error("Failed to fetch staff profile");
    }

    // 3️⃣ AUTO-CREATE STAFF PROFILE IF NOT FOUND ✅
    if (!staff) {
      // 🔍 Check if staff exists by EMAIL
      const { data: existingByEmail, error: emailErr } = await supabase
        .from("users")
        .select("*")
        .eq("email", authUser.email)
        .maybeSingle();

      if (emailErr) throw emailErr;

      if (existingByEmail) {
        // ✅ LINK auth_id to existing staff
        const { data: updatedStaff, error: updateErr } = await supabase
          .from("users")
          .update({ auth_id: authUser.id })
          .eq("id", existingByEmail.id)
          .select()
          .single();

        if (updateErr) throw updateErr;

        staff = updatedStaff;
      } else {
        // ✅ CREATE brand new staff
        const roleFromAuth =
          (authUser.user_metadata?.role as string) || "STAFF";

        const { data: newStaff, error: insertErr } = await supabase
          .from("users")
          .insert({
            auth_id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.name || authUser.email,
            role: roleFromAuth,
          })
          .select()
          .single();

        if (insertErr) throw insertErr;

        staff = newStaff;
      }
    }

    // 4️⃣ Login success
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
    // Save credentials to localStorage
    localStorage.setItem(
      "customer_auth_cache",
      JSON.stringify({
        u: email,
        p: password,
      })
    );
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
    <div className="h-[100dvh] bg-[#020617] flex items-center justify-center p-4 sm:p-6 font-sans selection:bg-indigo-500/30 overflow-hidden relative isolate">
      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#0f172a_0%,transparent_90%)] opacity-60"></div>

        {/* Animated Orbs */}
        <div
          className="absolute left-[20%] top-[20%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 transition-all duration-[2000ms] animate-pulse"
          style={{
            backgroundColor: activeTab === "staff" ? "#6366f1" : "#10b981",
          }}
        ></div>
        <div
          className="absolute right-[10%] bottom-[10%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-10 transition-all duration-[3000ms]"
          style={{
            backgroundColor: activeTab === "staff" ? "#a855f7" : "#06b6d4",
          }}
        ></div>

        {/* Stars */}
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
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }

        .glass-panel {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        
        .input-group:focus-within .input-icon { color: ${theme.hex}; transform: translateY(-50%) scale(1.1); }
        .input-group:focus-within input { border-color: ${theme.hex}60; background: rgba(255,255,255,0.08); }
      `}</style>

      {/* LOGIN CARD */}
      <div
        className={`w-full max-w-[420px] h-full sm:h-auto sm:max-h-[85vh] glass-panel rounded-none sm:rounded-[2.5rem] overflow-hidden flex flex-col transition-all duration-500 z-10 ${
          shake ? "animate-shake" : ""
        }`}
      >
        {/* Header Section */}
        <div className="px-8 pt-10 pb-6 text-center shrink-0 relative">
          <div className="flex flex-col items-center gap-4 mb-2 animate-in slide-in-from-top-4 duration-700">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center shadow-lg ${theme.shadow} mb-2 ring-4 ring-white/5 relative group cursor-default transition-transform hover:scale-105`}
            >
              {activeTab === "staff" ? (
                <ShieldCheck size={32} className="text-white" />
              ) : (
                <UserIcon size={32} className="text-white" />
              )}
              <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter drop-shadow-md">
                INFOFIX{" "}
                <span
                  className={`text-transparent bg-clip-text bg-gradient-to-r ${theme.gradient}`}
                >
                  SERVICES
                </span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mt-1.5 opacity-80">
                {isSignUp
                  ? "New Member Registration"
                  : activeTab === "staff"
                  ? "Internal System Access"
                  : "Customer Service Portal"}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Form Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-2 min-h-0">
          {/* Tab Switcher */}
          {!isSignUp && (
            <div className="mb-8">
              <div className="bg-black/20 p-1 rounded-xl flex relative border border-white/5">
                <div
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/10 rounded-lg transition-all duration-300 ease-out shadow-sm border border-white/5 ${
                    activeTab === "customer" ? "left-1" : "left-[calc(50%+1px)]"
                  }`}
                ></div>
                <button
                  onClick={() => setActiveTab("customer")}
                  className={`flex-1 py-2.5 relative z-10 text-[10px] font-black uppercase tracking-widest transition-colors duration-300 flex items-center justify-center gap-2 ${
                    activeTab === "customer"
                      ? "text-white"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <UserIcon size={12} /> Customers
                </button>
                <button
                  onClick={() => setActiveTab("staff")}
                  className={`flex-1 py-2.5 relative z-10 text-[10px] font-black uppercase tracking-widest transition-colors duration-300 flex items-center justify-center gap-2 ${
                    activeTab === "staff"
                      ? "text-white"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <Shield size={12} /> Staff
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] rounded-xl flex items-start gap-2.5 font-bold animate-in fade-in slide-in-from-top-2">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5 pb-4">
            {isSignUp ? (
              <div className="space-y-5 animate-in fade-in duration-500">
                <div className="space-y-1.5 input-group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-all duration-300 input-icon"
                      size={18}
                    />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none transition-all placeholder:text-slate-600"
                      placeholder="Enter Full Name"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 input-group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-all duration-300 input-icon"
                      size={18}
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none transition-all placeholder:text-slate-600"
                      placeholder="user@domain.com"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 input-group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Smartphone
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-all duration-300 input-icon"
                      size={18}
                    />
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        setRegPhone(val);
                      }}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none transition-all placeholder:text-slate-600"
                      placeholder="9876543210"
                    />
                  </div>
                  <p className="text-[9px] text-slate-500 ml-1 flex items-center gap-1">
                    <Zap size={10} className="text-amber-400" /> Use this number
                    to login later.
                  </p>
                </div>
                <div className="space-y-1.5 input-group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Address
                  </label>
                  <textarea
                    required
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none transition-all h-20 resize-none custom-scrollbar placeholder:text-slate-600 focus:bg-white/10 focus:border-white/20"
                    placeholder="Service location..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="space-y-1.5 input-group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 input-icon ${
                        isEmailValid
                          ? `text-${theme.primary}-400`
                          : "text-slate-500"
                      }`}
                      size={18}
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none transition-all placeholder:text-slate-600"
                      placeholder="user@infofix.com"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 input-group">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {activeTab === "staff"
                        ? "Access Cipher"
                        : "Mobile Number"}
                    </label>
                  </div>
                  <div className="relative">
                    {activeTab === "staff" ? (
                      <>
                        <Lock
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-all duration-300 input-icon"
                          size={18}
                        />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none transition-all placeholder:text-slate-600"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <Smartphone
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-all duration-300 input-icon"
                          size={18}
                        />
                        <input
                          type="tel"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none transition-all placeholder:text-slate-600"
                          placeholder="9876543210"
                        />
                      </>
                    )}
                  </div>
                </div>
                <div
                  className="flex items-center gap-3 pt-1 cursor-pointer group w-fit"
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all duration-300 ${
                      rememberMe
                        ? `bg-${theme.primary}-500 border-${theme.primary}-500`
                        : "bg-transparent border-slate-600 group-hover:border-slate-400"
                    }`}
                  >
                    {rememberMe && (
                      <Check size={10} strokeWidth={4} className="text-white" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider group-hover:text-slate-200 transition-colors">
                    Keep Session Active
                  </span>
                </div>
              </div>
            )}

            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4.5 bg-gradient-to-r ${theme.gradient} text-white font-black rounded-2xl shadow-lg ${theme.shadow} hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100 group active:scale-95 text-[11px] uppercase tracking-[0.25em] relative overflow-hidden`}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span className="relative z-10 flex items-center gap-2">
                      {isSignUp ? (
                        <>
                          <UserPlus size={18} /> Join Now
                        </>
                      ) : (
                        <>
                          <LogIn size={18} /> LOGIN
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Navigation */}
        <div className="px-8 py-5 shrink-0 border-t border-white/5 bg-black/10">
          {activeTab === "customer" && !isSignUp && (
            <div
              className="relative group cursor-pointer"
              onClick={() => setIsSignUp(true)}
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl blur opacity-20 group-hover:opacity-50 transition duration-500"></div>
              <div className="relative p-4 rounded-xl bg-[#0B1120] border border-white/10 flex items-center justify-between group-hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                      New User?
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Create an account
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={14}
                  className="text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all"
                />
              </div>
            </div>
          )}
          {isSignUp && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className="text-slate-400 hover:text-white font-black uppercase tracking-[0.2em] text-[9px] inline-flex items-center gap-2 transition-colors group py-2"
              >
                <ArrowLeft
                  size={12}
                  className="group-hover:-translate-x-1 transition-transform"
                />{" "}
                Return to Login
              </button>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="py-3 px-8 border-t border-white/5 flex justify-between items-center shrink-0 bg-black/20 text-[9px] font-bold text-slate-600 uppercase tracking-wider">
          <p>© 2025 INFOFIX</p>
          <div className="flex gap-4">
            <span className="flex items-center gap-1 hover:text-slate-400 cursor-pointer transition-colors">
              <Globe size={10} /> EN
            </span>
            <span className="flex items-center gap-1 hover:text-slate-400 cursor-pointer transition-colors">
              <Shield size={10} /> Secure
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
