import React from 'react';
import { AppSettings } from '../types';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  Cpu, 
  Monitor, 
  ShieldAlert, 
  Database, 
  Wifi, 
  Gamepad2, 
  Camera, 
  Briefcase,
  Zap,
  Award,
  ThumbsUp,
  ArrowRight,
  MessageCircle
} from 'lucide-react';

interface CustomerSupportInfoProps {
  settings: AppSettings;
}

export default function CustomerSupportInfo({ settings }: CustomerSupportInfoProps) {
  
  const services = [
    { title: "Hardware Repair", icon: Cpu, color: "from-blue-400 to-blue-600", desc: "Chip-level repair for laptops & desktops." },
    { title: "Software Solutions", icon: Monitor, color: "from-purple-400 to-purple-600", desc: "OS installation, debugging & optimization." },
    { title: "Virus Removal", icon: ShieldAlert, color: "from-red-400 to-red-600", desc: "Complete malware protection & removal." },
    { title: "Data Recovery", icon: Database, color: "from-emerald-400 to-emerald-600", desc: "Retrieve lost data from crashed drives." },
    { title: "Networking", icon: Wifi, color: "from-cyan-400 to-cyan-600", desc: "Router config, LAN setup & troubleshooting." },
    { title: "Custom Gaming PC", icon: Gamepad2, color: "from-fuchsia-400 to-fuchsia-600", desc: "High-performance builds for gamers." },
    { title: "CCTV Solutions", icon: Camera, color: "from-orange-400 to-orange-600", desc: "Security camera installation & maintenance." },
    { title: "AMC Services", icon: Briefcase, color: "from-indigo-400 to-indigo-600", desc: "Annual maintenance contracts for businesses." },
  ];

  const testimonials = [
    { name: "Sourav M.", role: "Gamer", text: "Built my dream gaming PC here. Cable management is art! Runs 4K like butter." },
    { name: "Ankit R.", role: "Business Owner", text: "Their AMC service saved my office network twice this month. Super fast response." },
    { name: "Priya D.", role: "Student", text: "Thought I lost my thesis data. INFOFIX recovered everything in 24 hours. Lifesavers!" },
  ];

  return (
    <div className="bg-slate-50 min-h-full rounded-3xl overflow-hidden shadow-sm relative no-scrollbar">
      {/* Custom Styles for Scrollbar Hiding & Animations */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20 px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
          INFOFIX
        </h1>
        <a href="#contact" className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-full hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl">
          Contact Us
        </a>
      </nav>

      <div className="pb-20">
        {/* HERO SECTION */}
        <div className="relative w-full px-6 py-16 md:py-24 overflow-hidden">
          {/* Animated Background Blobs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl opacity-30 pointer-events-none">
            <div className="absolute top-0 left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          </div>

          <div className="relative z-10 text-center max-w-3xl mx-auto space-y-6">
            <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-widest mb-2 shadow-sm">
              Your Tech Experts
            </span>
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight">
              We Fix <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Anything</span> <br/>
              With a Power Button.
            </h2>
            <p className="text-slate-500 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
              Professional IT solutions, custom builds, and rapid repairs. Experience the next generation of computer service.
            </p>
            <div className="pt-4">
              <a href="#services" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 hover:scale-105 transition-transform">
                Explore Services <ArrowRight size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* SERVICES GRID */}
        <div id="services" className="px-4 md:px-8 py-12">
          <div className="flex items-center gap-3 mb-8 px-2">
            <Zap className="text-amber-500 fill-current" />
            <h3 className="text-2xl font-bold text-slate-800">Our Expertise</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {services.map((service, index) => (
              <div key={index} className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-default">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:rotate-6 transition-transform`}>
                  <service.icon size={24} />
                </div>
                <h4 className="font-bold text-slate-800 text-lg mb-2 leading-tight">{service.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* WHY CHOOSE US */}
        <div className="px-4 md:px-8 py-12 bg-slate-900 mx-4 md:mx-8 rounded-[3rem] text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full filter blur-3xl opacity-20"></div>
          <div className="relative z-10 grid md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
            <div className="p-4">
               <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-cyan-400">
                 <Zap size={32} />
               </div>
               <h4 className="text-xl font-bold mb-2">Fast Turnaround</h4>
               <p className="text-slate-400 text-sm">Most repairs completed within 24-48 hours.</p>
            </div>
            <div className="p-4">
               <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-400">
                 <Award size={32} />
               </div>
               <h4 className="text-xl font-bold mb-2">Certified Experts</h4>
               <p className="text-slate-400 text-sm">Qualified technicians handling your expensive gear.</p>
            </div>
            <div className="p-4">
               <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
                 <ThumbsUp size={32} />
               </div>
               <h4 className="text-xl font-bold mb-2">Affordable Pricing</h4>
               <p className="text-slate-400 text-sm">Transparent quotes. No hidden fees. Best market rates.</p>
            </div>
          </div>
        </div>

        {/* SOCIAL PROOF */}
        <div className="px-4 md:px-8 py-16">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1,2,3,4].map(i => <Star key={i} size={24} className="text-yellow-400 fill-current" />)}
              <Star size={24} className="text-yellow-400 fill-current opacity-50" />
            </div>
            <h3 className="text-3xl font-black text-slate-800">4.5 / 5 Stars</h3>
            <p className="text-slate-500 font-medium">Google Ratings & Reviews</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative">
                <div className="absolute top-6 right-6 text-slate-200">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21L14.017 18C14.017 16.896 14.354 15.939 15.026 15.13C15.698 14.322 16.865 13.918 18.527 13.918L19 13.918L19 12.893C19 10.871 18.337 9.176 17.012 7.809C15.687 6.442 13.914 5.758 11.693 5.758L10.985 5.758L10.985 8.758L11.835 8.758C13.069 8.758 13.996 9.042 14.615 9.61C15.235 10.178 15.625 10.963 15.786 11.964L15.361 11.964C14.181 11.964 13.204 12.333 12.43 13.07C11.657 13.807 11.27 14.734 11.27 15.852C11.27 16.969 11.657 18.257 12.43 19.715L14.017 21ZM5.017 21L5.017 18C5.017 16.896 5.354 15.939 6.026 15.13C6.698 14.322 7.865 13.918 9.527 13.918L10 13.918L10 12.893C10 10.871 9.337 9.176 8.012 7.809C6.687 6.442 4.914 5.758 2.693 5.758L1.985 5.758L1.985 8.758L2.835 8.758C4.069 8.758 4.996 9.042 5.615 9.61C6.235 10.178 6.625 10.963 6.786 11.964L6.361 11.964C5.181 11.964 4.204 12.333 3.43 13.07C2.657 13.807 2.27 14.734 2.27 15.852C2.27 16.969 2.657 18.257 3.43 19.715L5.017 21Z"></path></svg>
                </div>
                <p className="text-slate-600 mb-4 text-sm font-medium leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">{t.name}</h5>
                    <p className="text-slate-400 uppercase tracking-wide text-[10px]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CONTACT SECTION */}
        <div id="contact" className="px-4 md:px-8 pb-12">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-indigo-200">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black mb-2">Get In Touch</h2>
              <p className="text-indigo-200">Visit us or call for a quick quote.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              
              {/* CALL US */}
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10 flex flex-col items-center text-center relative group hover:bg-white/20 transition-colors">
                <Phone className="mb-4 text-cyan-300" size={32} />
                <h3 className="font-bold text-lg mb-1">Call Us</h3>
                <a href="tel:+919382979780" className="text-indigo-100 font-mono text-lg hover:text-white transition-colors">
                  +91 93829 79780
                </a>
                <div className="mt-4 flex gap-3 w-full justify-center">
                    <a href="tel:+919382979780" className="flex-1 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1">
                      Call
                    </a>
                    <a href="https://wa.me/919382979780" target="_blank" rel="noreferrer" className="flex-1 py-2 bg-green-500/80 hover:bg-green-500 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1">
                      <MessageCircle size={16} /> WhatsApp
                    </a>
                </div>
              </div>

              {/* EMAIL US */}
              <a href="mailto:INFOFIXCOMPUTERS1@GMAIL.COM" className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10 flex flex-col items-center text-center hover:bg-white/20 transition-colors cursor-pointer group">
                <Mail className="mb-4 text-purple-300 group-hover:scale-110 transition-transform" size={32} />
                <h3 className="font-bold text-lg mb-1">Email Us</h3>
                <p className="text-indigo-100 text-sm break-all group-hover:text-white transition-colors">INFOFIXCOMPUTERS1@GMAIL.COM</p>
                <span className="mt-4 text-xs font-bold bg-white/10 px-3 py-1 rounded-full group-hover:bg-white/20 transition-colors">Click to Mail</span>
              </a>

              {/* VISIT US */}
              <a href="https://maps.app.goo.gl/siHMLkvnzEcVtAdg6" target="_blank" rel="noreferrer" className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10 flex flex-col items-center text-center hover:bg-white/20 transition-colors cursor-pointer group">
                <MapPin className="mb-4 text-pink-300 group-hover:scale-110 transition-transform" size={32} />
                <h3 className="font-bold text-lg mb-1">Visit Us</h3>
                <p className="text-indigo-100 text-xs group-hover:text-white transition-colors">BENACHTY DURGAPUR KAMLPUR PLOT NEAR BINA INDIAN GAS INFOFIX SERVICES</p>
                <span className="mt-4 text-xs font-bold bg-white/10 px-3 py-1 rounded-full group-hover:bg-white/20 transition-colors">Open Maps</span>
              </a>

            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-center py-8 text-slate-400 text-xs font-medium">
          <p>Copyright © 2025 InfoFix Computers. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}