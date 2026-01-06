
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Bot, 
  Send, 
  Book, 
  BookOpen,
  MessageSquare, 
  Search, 
  Plus, 
  Settings as SettingsIcon,
  ChevronRight,
  User,
  AlertCircle,
  Laptop,
  Smartphone,
  Check,
  Edit2,
  Trash2,
  X,
  FileText,
  BrainCircuit,
  Save,
  Clock,
  Sparkles,
  Zap,
  RotateCcw,
  Wrench,
  Stethoscope,
  Mail,
  ListChecks,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  Cpu,
  ShieldCheck,
  History,
  Activity,
  Layers,
  Fingerprint,
  Verified,
  Menu,
  Database,
  Terminal,
  Unplug,
  Waves,
  MessageCircle,
  Copy,
  ChevronDown,
  Monitor,
  Code
} from 'lucide-react';
import { Ticket, AppSettings, SupportGuideline, Customer, Task } from '../types';
import { generateAIResponse } from '../services/geminiService';

interface SupportsProps {
  tickets: Ticket[];
  customers: Customer[];
  tasks: Task[];
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  canBeSaved?: boolean;
  type?: 'text' | 'draft' | 'diagnostic';
}

interface DiscoveredPattern {
  id: string;
  title: string;
  count: number;
  description: string;
  relatedTickets: Ticket[];
}

export default function Supports({ tickets, customers, tasks, settings, onUpdateSettings }: SupportsProps) {
  // --- LAYOUT STATE ---
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true); 
  const [ticketSearch, setTicketSearch] = useState('');
  const [kbTab, setKbTab] = useState<'insights' | 'protocols'>('insights');

  // --- CHAT STATE ---
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'System initialized. Cognitive Engine V3.5-PRO online.\n\nI have indexed all active service nodes and historical data clusters. How may I facilitate your operations today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- KB STATE ---
  const [editingGuideline, setEditingGuideline] = useState<SupportGuideline | null>(null);
  const [isGuidelineModalOpen, setIsGuidelineModalOpen] = useState(false);
  const [kbSearch, setKbSearch] = useState('');

  const activeTicket = useMemo(() => tickets.find(t => t.id === selectedTicketId), [tickets, selectedTicketId]);

  // --- ANALYTICS ENGINE ---
  const insights = useMemo(() => {
    const resolved = tickets.filter(t => t.status === 'Resolved');
    const patterns: Record<string, Ticket[]> = {};
    const keywords = ['screen', 'display', 'battery', 'charging', 'water', 'dead', 'software', 'keyboard', 'hinge', 'heat', 'reboot'];

    resolved.forEach(t => {
       const text = ((t.issueDescription || "") + " " + (t.deviceType || "")).toLowerCase();
       let matchedKey = 'general';
       for (const k of keywords) {
         if (text.includes(k)) {
            matchedKey = `${t.deviceType} - ${k.charAt(0).toUpperCase() + k.slice(1)}`;
            break;
         }
       }
       if (!patterns[matchedKey]) patterns[matchedKey] = [];
       patterns[matchedKey].push(t);
    });

    return Object.entries(patterns)
        .filter(([key, list]) => list.length >= 2 && key !== 'general')
        .map(([key, list], idx) => ({
            id: `pattern-${idx}`,
            title: key,
            count: list.length,
            description: `Aggregated resolution successful for ${list.length} units in this cluster.`,
            relatedTickets: list
        }))
        .sort((a,b) => b.count - a.count);
  }, [tickets]);

  const cognitiveLoad = useMemo(() => {
    return Math.min(100, Math.round(((tickets.length + tasks.length) / 500) * 100));
  }, [tickets, tasks]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // --- AI HANDLERS ---
  const handleSendMessage = async (text: string = inputValue, forcedType: 'text' | 'draft' | 'diagnostic' = 'text') => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    const kbContext = settings.supportGuidelines.map(g => `[PROTOCOL: ${g.title}] CAT: ${g.category}\nINFO: ${g.content}`).join('\n\n');
    let contextString = activeTicket 
        ? `[SESSION FOCUS: TICKET ${activeTicket.ticketId}] DEVICE: ${activeTicket.brand} ${activeTicket.model}, FAULT: ${activeTicket.issueDescription}, STATUS: ${activeTicket.status}, PRIORITY: ${activeTicket.priority}` 
        : `[GLOBAL SCOPE] ACTIVE WORKLOAD: ${tickets.filter(t => t.status !== 'Resolved').length} NODES.`;

    const systemPrompt = `
      ROLE: INFOFIX COGNITIVE AGENT (V3.5-PRO).
      SCOPE: ${contextString}
      KNOWLEDGE_BASE: ${kbContext}
      
      INSTRUCTIONS:
      1. If requested to "Draft", use a premium, professional corporate tone.
      2. If "Diagnose", provide step-by-step technical isolation procedures.
      3. Reference internal Protocols by name if they match the issue.
      4. Always present data in a clean, structured pipeline format.
      5. Current Response Target: ${forcedType.toUpperCase()}.
    `;

    try {
      const aiResponse = await generateAIResponse(text, systemPrompt);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        canBeSaved: true,
        type: forcedType
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "CRITICAL: Neural link interrupted. Re-establish sync to continue.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDeleteGuideline = (id: string) => {
    if (confirm("Are you sure you want to delete this protocol from the vault?")) {
      const updated = settings.supportGuidelines.filter(item => item.id !== id);
      onUpdateSettings({ ...settings, supportGuidelines: updated });
    }
  };

  const handleFormalizePattern = (pattern: DiscoveredPattern) => {
    setEditingGuideline({
      id: Date.now().toString(),
      title: `${pattern.title} Protocol`,
      category: 'Diagnostic',
      content: `Pattern detected across ${pattern.count} units.\n\nSummary: ${pattern.description}\n\nStandard Operating Procedure:\n1. Inspect common failure points.\n2. Apply verified resolution steps.\n3. Validate fix via system tests.`
    });
    setIsGuidelineModalOpen(true);
  };

  const handleSaveGuideline = (g: SupportGuideline) => {
    const exists = settings.supportGuidelines.find(item => item.id === g.id);
    const updated = exists 
      ? settings.supportGuidelines.map(item => item.id === g.id ? g : item)
      : [...settings.supportGuidelines, g];
    onUpdateSettings({ ...settings, supportGuidelines: updated });
    setIsGuidelineModalOpen(false);
    setEditingGuideline(null);
  };

  const quickActions = activeTicket ? [
    { label: "Technical Diagnosis", icon: Stethoscope, type: 'diagnostic', prompt: `Execute deep diagnostic isolation for "${activeTicket.issueDescription}" on ${activeTicket.brand} ${activeTicket.model}.` },
    { label: "Customer Update Draft", icon: Mail, type: 'draft', prompt: `Compose a high-end service update draft for the client. Current Status: ${activeTicket.status}.` },
    { label: "BOM Parts List", icon: ListChecks, type: 'text', prompt: `Estimate required Bill of Materials (BOM) for "${activeTicket.issueDescription}".` },
    { label: "Protocol Match", icon: ShieldCheck, type: 'text', prompt: "Scan internal SOP repository for matching fault patterns." },
  ] : [
    { label: "Enterprise Pulse", icon: Activity, type: 'text', prompt: "Generate real-time workload efficiency report and shop status." },
    { label: "Failure Analysis", icon: TrendingUp, type: 'text', prompt: "Identify common failure points based on historical service logs." },
    { label: "Repository Scan", icon: Database, type: 'text', prompt: "Summarize top 5 service protocols in the knowledge base." }
  ];

  const filteredTickets = tickets
    .filter(t => t.status !== 'Resolved' && t.status !== 'Rejected')
    .filter(t => t.ticketId.toLowerCase().includes(ticketSearch.toLowerCase()) || t.name.toLowerCase().includes(ticketSearch.toLowerCase()))
    .sort((a,b) => (a.priority === 'High' ? -1 : 1));

  const filteredKB = settings.supportGuidelines
    .filter(g => g.title.toLowerCase().includes(kbSearch.toLowerCase()) || g.category.toLowerCase().includes(kbSearch.toLowerCase()));

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-4 lg:gap-6 pb-2 min-h-0 select-none">
      
      {/* 1. SESSION FOCUS (LEFT SIDEBAR) - REFINED WIDTH */}
      <div className={`
        ${showSidebar ? 'flex' : 'hidden'}
        w-full md:w-[280px] lg:w-[320px] flex-shrink-0 flex-col bg-white rounded-[2.5rem] lg:rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-left duration-700 h-full
      `}>
        <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50 relative overflow-hidden shrink-0">
           <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none text-slate-900">
              <Fingerprint size={120} />
           </div>
           <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight flex items-center gap-3">
                <Layers size={20} className="text-indigo-600"/> Nodes
              </h3>
              <button onClick={() => setShowSidebar(false)} className="md:hidden p-2 text-slate-400 hover:text-indigo-600"><X size={24}/></button>
           </div>
           <div className="relative group z-10">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                placeholder="Locate context..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-wider outline-none focus:ring-4 ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-sm"
              />
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-slate-50/20">
            {selectedTicketId && (
               <button 
                  onClick={() => setSelectedTicketId(null)}
                  className="w-full p-3 rounded-2xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl active:scale-[0.98] mb-4 group"
               >
                  <RotateCcw size={14} className="group-hover:-rotate-90 transition-transform duration-500" /> Reset Neural Focus
               </button>
            )}

            {filteredTickets.map(ticket => (
                <button
                    key={ticket.id}
                    onClick={() => { setSelectedTicketId(ticket.id); if(window.innerWidth < 768) setShowSidebar(false); }}
                    className={`w-full text-left p-4 rounded-[2rem] border transition-all duration-500 group relative overflow-hidden ${
                        selectedTicketId === ticket.id 
                        ? 'bg-indigo-600 border-indigo-400 shadow-xl scale-[1.02] z-10' 
                        : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-lg'
                    }`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${selectedTicketId === ticket.id ? 'text-indigo-200' : 'text-slate-400'}`}>{ticket.ticketId}</span>
                        <div className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-[0.15em] border ${
                            ticket.priority === 'High' 
                            ? (selectedTicketId === ticket.id ? 'bg-white text-rose-600 border-white' : 'bg-rose-50 text-rose-600 border-rose-100') 
                            : (selectedTicketId === ticket.id ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-slate-50 text-slate-500 border-slate-100')
                        }`}>
                           {ticket.priority === 'High' ? 'Critical' : 'Routine'}
                        </div>
                    </div>
                    <div className={`font-black text-sm mb-1 truncate flex items-center gap-2 tracking-tight ${selectedTicketId === ticket.id ? 'text-white' : 'text-slate-800'}`}>
                       {ticket.deviceType === 'Laptop' ? <Laptop size={14}/> : <Smartphone size={14}/>}
                       {ticket.brand} {ticket.model}
                    </div>
                    <div className={`text-[10px] line-clamp-2 leading-relaxed font-medium ${selectedTicketId === ticket.id ? 'text-indigo-100/80' : 'text-slate-500'}`}>
                       {ticket.issueDescription}
                    </div>
                </button>
            ))}
        </div>
      </div>

      {/* 2. COGNITIVE HUB (MIDDLE PANEL) - EXPANSIVE AREA */}
      <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] lg:rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden relative animate-in fade-in duration-1000 h-full min-w-0">
         {/* Command Header */}
         <div className="p-4 lg:p-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-10 sticky top-0 shrink-0">
            <div className="flex items-center gap-4">
                {!showSidebar && (
                    <button onClick={() => setShowSidebar(true)} className="p-2.5 bg-slate-900 text-indigo-400 hover:text-white rounded-xl transition-all shadow-lg mr-1">
                        <Terminal size={18}/>
                    </button>
                )}
                <div className="relative group">
                   <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-2xl relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/40 to-transparent"></div>
                       <BrainCircuit className="w-6 h-6 lg:w-8 lg:h-8 relative z-10" />
                   </div>
                   <div className="absolute -bottom-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 bg-emerald-500 rounded-full border-4 border-white shadow-lg"></div>
                </div>
                <div>
                    <h2 className="font-black text-slate-800 text-sm lg:text-xl uppercase tracking-tighter leading-none flex items-center gap-2">
                       COGNITIVE ENGINE
                       <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 shadow-sm ml-1">V3.5-PRO</span>
                    </h2>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em]">{activeTicket ? `NODE: ${activeTicket.ticketId}` : 'SYNCED'}</p>
                        <div className="h-2 w-px bg-slate-200 mx-1"></div>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em]">LOAD: {cognitiveLoad}%</p>
                    </div>
                </div>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => setShowKnowledgeBase(!showKnowledgeBase)}
                    className={`px-4 py-2 lg:py-2.5 rounded-xl border-2 transition-all flex items-center gap-2.5 text-[9px] font-black uppercase tracking-[0.15em] ${
                        showKnowledgeBase 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-300' 
                        : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-indigo-200'
                    }`}
                >
                    <Book size={16} /> <span className="hidden lg:inline">{showKnowledgeBase ? 'CLOSE VAULT' : 'OPEN VAULT'}</span>
                </button>
            </div>
         </div>

         {/* Neural Feed (Chat) */}
         <div className="flex-1 overflow-y-auto p-5 lg:p-8 space-y-8 bg-slate-50/30 custom-scrollbar min-h-0 relative">
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.02]">
                <Waves size={800} className="text-slate-900 absolute -top-40 -left-40" />
            </div>

            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10`}>
                    <div className={`flex flex-col gap-2.5 max-w-[95%] lg:max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`flex gap-3 lg:gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-9 h-9 lg:w-11 lg:h-11 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg transition-all duration-700 ${
                                msg.role === 'user' ? 'bg-white text-slate-400 border border-slate-100' : 'bg-indigo-600 text-white'
                            }`}>
                                {msg.role === 'user' ? <User size={20}/> : <Bot size={20}/>}
                            </div>
                            <div className={`relative p-5 lg:p-6 rounded-[2rem] text-sm lg:text-base leading-relaxed whitespace-pre-wrap shadow-xl transition-all ${
                                msg.role === 'user' 
                                ? 'bg-white text-slate-800 border border-slate-100 rounded-tr-none' 
                                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none ring-1 ring-indigo-50'
                            }`}>
                                {msg.type === 'draft' && (
                                   <div className="mb-3 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg inline-flex items-center gap-2 text-[9px] font-black uppercase text-indigo-600 tracking-widest">
                                      <Mail size={12} /> Communication Draft
                                   </div>
                                )}
                                {msg.type === 'diagnostic' && (
                                   <div className="mb-3 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg inline-flex items-center gap-2 text-[9px] font-black uppercase text-emerald-600 tracking-widest">
                                      <Wrench size={12} /> Diagnostic Matrix
                                   </div>
                                )}
                                <div className="font-medium text-slate-700">{msg.content}</div>
                            </div>
                        </div>
                        
                        {msg.role === 'assistant' && (
                           <div className="flex gap-2 ml-12 lg:ml-16">
                                {msg.canBeSaved && (
                                    <button 
                                        onClick={() => {
                                            setEditingGuideline(null);
                                            setIsGuidelineModalOpen(true);
                                            setTimeout(() => {
                                                const inputContent = document.getElementById('g-content') as HTMLTextAreaElement;
                                                if (inputContent) inputContent.value = msg.content;
                                            }, 100);
                                        }}
                                        className="flex items-center gap-2 text-[8px] font-black text-indigo-600 bg-white border border-indigo-100 px-3 py-1.5 rounded-full hover:bg-indigo-50 transition-all shadow-md group active:scale-95"
                                    >
                                        <Save size={10} className="text-indigo-400 group-hover:scale-110 transition-transform" /> Commit to Vault
                                    </button>
                                )}
                                <button 
                                    onClick={() => handleCopy(msg.content)}
                                    className="flex items-center gap-2 text-[8px] font-black text-slate-500 bg-white border border-slate-100 px-3 py-1.5 rounded-full hover:bg-slate-50 transition-all shadow-md active:scale-95"
                                >
                                    <Copy size={10} /> Copy Output
                                </button>
                           </div>
                        )}
                    </div>
                </div>
            ))}
            {isTyping && (
                <div className="flex justify-start relative z-10">
                     <div className="flex gap-4 max-w-[85%]">
                        <div className="w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center bg-indigo-600 text-white shadow-xl animate-pulse">
                             <Bot size={20}/>
                        </div>
                        <div className="bg-white p-5 rounded-[2rem] rounded-tl-none border border-slate-100 shadow-xl flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150"></span>
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-300"></span>
                        </div>
                     </div>
                </div>
            )}
            <div ref={messagesEndRef} />
         </div>

         {/* Command Terminal (Input) */}
         <div className="p-4 lg:p-6 bg-white border-t border-slate-100 shrink-0 z-20">
             <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
                {quickActions.map((action, idx) => (
                   <button
                      key={idx}
                      onClick={() => handleSendMessage(action.prompt, action.type as any)}
                      className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-wider text-slate-500 whitespace-nowrap hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all active:scale-[0.98] shadow-sm group"
                   >
                      <action.icon size={14} className="group-hover:scale-110 transition-transform" /> {action.label}
                   </button>
                ))}
             </div>

             <div className="relative flex items-center gap-3">
                 <div className="flex-1 relative group">
                    <Terminal size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={activeTicket ? `Prompt for ${activeTicket.ticketId}...` : "Command the global engine..."}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] lg:rounded-[2rem] pl-12 pr-6 py-4 text-sm font-bold text-slate-800 focus:ring-8 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner"
                    />
                 </div>
                 <button 
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isTyping}
                    className="p-4 lg:p-5 bg-slate-900 text-white rounded-[1.5rem] lg:rounded-[2rem] hover:bg-black disabled:opacity-20 disabled:grayscale transition-all shadow-2xl active:scale-90"
                 >
                     <Send size={22} />
                 </button>
             </div>
         </div>
      </div>

      {/* 3. SYSTEM BRAIN (RIGHT PANEL) - REFINED WIDTH */}
      {showKnowledgeBase && (
          <div className="w-full md:w-[320px] lg:w-[380px] flex-shrink-0 flex flex-col bg-white rounded-[2.5rem] lg:rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-right duration-700 h-full">
             <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50 shrink-0 relative overflow-hidden">
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight flex items-center gap-3">
                        <Database size={22} className="text-indigo-600"/> Vault
                    </h3>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => { setEditingGuideline(null); setIsGuidelineModalOpen(true); }}
                            className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-black transition-all shadow-xl active:scale-90"
                        >
                            <Plus size={18} />
                        </button>
                        <button onClick={() => setShowKnowledgeBase(false)} className="p-2.5 text-slate-300 hover:text-indigo-600 transition-colors"><X size={20}/></button>
                    </div>
                </div>
                
                <div className="flex bg-slate-200/50 p-1 rounded-2xl mb-5 relative z-10 border border-slate-100 shadow-inner">
                    {(['insights', 'protocols'] as const).map(tab => (
                       <button 
                          key={tab}
                          onClick={() => setKbTab(tab)}
                          className={`flex-1 py-2 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${kbTab === tab ? 'bg-white shadow-lg text-indigo-600 border border-slate-100' : 'text-slate-500 hover:text-slate-800'}`}
                       >
                          {tab}
                       </button>
                    ))}
                </div>

                <div className="relative group z-10">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                        value={kbSearch}
                        onChange={(e) => setKbSearch(e.target.value)}
                        placeholder="Search repository..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider outline-none focus:ring-4 ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-sm"
                    />
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 custom-scrollbar bg-slate-50/10 min-h-0 relative">
                {kbTab === 'insights' ? (
                    <div className="space-y-4">
                        <div className="p-5 bg-slate-900 rounded-[2rem] text-white relative overflow-hidden group shadow-xl">
                            <div className="flex items-center gap-2 mb-2">
                               <Sparkles size={14} className="text-amber-400 animate-pulse" />
                               <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Emergent Logic</p>
                            </div>
                            <p className="text-[11px] font-medium leading-relaxed text-indigo-100/90 italic">"Autonomous pattern detection is isolating common fault clusters."</p>
                        </div>
                        {insights.map(pattern => (
                            <div key={pattern.id} className="p-5 bg-white border border-slate-100 rounded-[2rem] hover:border-indigo-400 transition-all group shadow-sm hover:shadow-lg">
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-tight">{pattern.title}</h4>
                                    <span className="bg-emerald-500/10 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded-full border border-emerald-100">
                                        {pattern.count} UNITS
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium mb-4 leading-relaxed italic line-clamp-2">"{pattern.description}"</p>
                                <button 
                                    onClick={() => handleFormalizePattern(pattern)}
                                    className="w-full py-2.5 bg-slate-50 hover:bg-indigo-600 text-slate-600 hover:text-white border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                >
                                    <Verified size={14} /> Formalize
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredKB.map(g => (
                            <div key={g.id} className="p-5 bg-white border border-slate-100 rounded-[2rem] hover:border-indigo-400 transition-all group relative shadow-sm hover:shadow-lg">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">{g.category}</span>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-2">
                                        <button onClick={() => { setEditingGuideline(g); setIsGuidelineModalOpen(true); }} className="p-1.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg"><Edit2 size={12}/></button>
                                        <button onClick={() => handleDeleteGuideline(g.id)} className="p-1.5 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-lg"><Trash2 size={12}/></button>
                                    </div>
                                </div>
                                <h4 className="font-black text-slate-800 text-[11px] mb-2 leading-tight uppercase tracking-tight">{g.title}</h4>
                                <p className="text-[10px] text-slate-500 leading-relaxed font-medium line-clamp-3 italic">"{g.content}"</p>
                            </div>
                        ))}
                    </div>
                )}
             </div>
          </div>
      )}

      {/* GUIDELINE MODAL - REDESIGNED TO MAX-W-4XL FOR BETTER PROPORTIONS */}
      {isGuidelineModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
             <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 flex flex-col max-h-[90vh] border border-white/20">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none text-slate-900 group-hover:rotate-12 transition-transform duration-1000"><BrainCircuit size={160} /></div>
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl shadow-xl flex items-center justify-center"><BookOpen size={24} /></div>
                        <div>
                           <h3 className="font-black text-slate-800 text-xl lg:text-2xl uppercase tracking-tighter leading-none">{editingGuideline ? 'Adjust Node' : 'Neural Induction'}</h3>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Intelligence Allocation Layer</p>
                        </div>
                    </div>
                    <button onClick={() => setIsGuidelineModalOpen(false)} className="p-3 hover:bg-white rounded-full text-slate-400 transition-all border border-transparent active:scale-90"><X size={28}/></button>
                </div>

                <div className="p-8 lg:p-10 space-y-10 flex-1 overflow-y-auto custom-scrollbar">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Registry Identifier (Title)</label>
                          <div className="relative group">
                             <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                             <input 
                                 id="g-title"
                                 className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-800 focus:ring-4 ring-indigo-500/5 focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner" 
                                 placeholder="e.g. Display Matrix SOP"
                                 defaultValue={editingGuideline?.title}
                             />
                          </div>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Sector Categorization</label>
                          <div className="relative group">
                             <Layers size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                             <input 
                                 id="g-category"
                                 className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-slate-800 focus:ring-4 ring-indigo-500/5 focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-inner" 
                                 placeholder="e.g. Hardware"
                                 defaultValue={editingGuideline?.category}
                             />
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Instructional Payload (Protocol Details)</label>
                           <div className="flex items-center gap-2 text-[9px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                              <Code size={10} /> Markdown Supported
                           </div>
                        </div>
                        <div className="relative group">
                           <div className="absolute left-4 top-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                              <Verified size={18} />
                           </div>
                           <textarea 
                               id="g-content"
                               className="w-full pl-12 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm lg:text-base font-bold text-slate-700 leading-relaxed focus:bg-white focus:border-indigo-500 outline-none h-64 lg:h-96 shadow-inner resize-none custom-scrollbar italic" 
                               placeholder="Enter technical procedures, constraints, and validation logic..."
                               defaultValue={editingGuideline?.content}
                           />
                        </div>
                    </div>
                </div>

                <div className="px-8 py-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row gap-4 shrink-0">
                   <button onClick={() => setIsGuidelineModalOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-500 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95">Discard</button>
                   <button 
                        onClick={() => {
                            const title = (document.getElementById('g-title') as HTMLInputElement).value;
                            const category = (document.getElementById('g-category') as HTMLInputElement).value;
                            const content = (document.getElementById('g-content') as HTMLTextAreaElement).value;
                            if(title && content) {
                                handleSaveGuideline({ id: editingGuideline?.id || Date.now().toString(), title, category, content });
                            }
                        }}
                        className="flex-[2.5] py-4 bg-slate-900 text-white font-black rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-300 hover:bg-black transition-all flex items-center justify-center gap-4 active:scale-[0.98] group"
                   >
                        <Save size={20} className="text-indigo-400 group-hover:scale-110 transition-transform" /> Commit to Intelligence
                   </button>
                </div>
             </div>
          </div>
      )}

    </div>
  );
}
