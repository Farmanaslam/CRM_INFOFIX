
import React, { useState, useRef, useEffect } from 'react';
import { 
  ExternalLink, 
  Bot, 
  Send, 
  User, 
  Globe, 
  Sparkles, 
  BookOpen, 
  Plus, 
  Trash2, 
  FileText, 
  Download,
  Cpu,
  RefreshCcw,
  Shield,
  ChevronRight,
  Search
} from 'lucide-react';
import { generateAIResponse } from '../services/geminiService';
import { jsPDF } from 'jspdf';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface BrandProtocol {
  id: string;
  title: string;
  category: 'Repair' | 'Policy' | 'Troubleshoot' | 'Specs';
  content: string;
}

// Default Data for Ivoomi
const DEFAULT_PROTOCOLS: BrandProtocol[] = [
  {
    id: '1',
    title: 'Standard Screen Replacement',
    category: 'Repair',
    content: '1. Heat gun at 80°C for 2 mins.\n2. Use plastic pry tool only (No metal).\n3. Disconnect battery first.\n4. Test new display before gluing.\n5. Use B-7000 glue, clamp for 30 mins.'
  },
  {
    id: '2',
    title: 'Warranty Policy - Battery',
    category: 'Policy',
    content: 'Ivoomi batteries carry a 6-month warranty. Bulging is covered. Water damage voids warranty immediately. Bill required.'
  }
];

export default function BrandIvoomi() {
  // --- STATE ---
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am your IVOOMI Brand Specialist. I have access to your internal protocols. Ask me about repairs, warranty policies, or technical specs.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Knowledge Base State
  const [protocols, setProtocols] = useState<BrandProtocol[]>(() => {
    const saved = localStorage.getItem('ivoomi_protocols');
    return saved ? JSON.parse(saved) : DEFAULT_PROTOCOLS;
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProtocol, setNewProtocol] = useState<Partial<BrandProtocol>>({ category: 'Repair' });
  const [searchTerm, setSearchTerm] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- EFFECTS ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('ivoomi_protocols', JSON.stringify(protocols));
  }, [protocols]);

  // --- HANDLERS ---

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Build Context from Protocols
    const kbContext = protocols.map(p => 
      `[CATEGORY: ${p.category.toUpperCase()}] TITLE: ${p.title}\nCONTENT: ${p.content}`
    ).join('\n\n');

    const systemPrompt = `
      You are an expert AI Support Agent for the brand "IVOOMI".
      Your goal is to assist technicians by referencing the company's specific INTERNAL KNOWLEDGE BASE.
      
      INTERNAL KNOWLEDGE BASE (PROTOCOLS & POLICIES):
      ${kbContext}
      
      Instructions:
      1. If the user asks about a topic found in the Knowledge Base, STRICTLY follow the steps or rules provided there.
      2. If the info is not in the KB, use general expert knowledge about smartphones/electronics but mention "Standard industry practice" vs "Official Protocol".
      3. Format your response clearly with bullet points if explaining a process.
      4. Be helpful, professional, and concise.
    `;

    try {
      const aiResponse = await generateAIResponse(userMsg.content, systemPrompt);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm currently unable to access the knowledge base. Please check your internet connection.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAddProtocol = () => {
    if (newProtocol.title && newProtocol.content) {
      const protocol: BrandProtocol = {
        id: Date.now().toString(),
        title: newProtocol.title,
        category: newProtocol.category as any,
        content: newProtocol.content
      };
      setProtocols([...protocols, protocol]);
      setNewProtocol({ category: 'Repair' });
      setShowAddModal(false);
    }
  };

  const handleDeleteProtocol = (id: string) => {
    setProtocols(protocols.filter(p => p.id !== id));
  };

  const handleDownloadReport = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(79, 70, 229); // Indigo
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("IVOOMI AI Consultation Report", 10, 13);
    
    doc.setFontSize(10);
    doc.text(new Date().toLocaleString(), 160, 13);

    let y = 30;
    const pageHeight = 280;
    const margin = 10;
    const maxWidth = 190;

    // Chat History
    doc.setTextColor(0, 0, 0);
    
    messages.forEach((msg) => {
       if (y > pageHeight) { doc.addPage(); y = 20; }
       
       doc.setFontSize(9);
       doc.setFont("helvetica", "bold");
       doc.setTextColor(msg.role === 'assistant' ? 79 : 100, msg.role === 'assistant' ? 70 : 116, msg.role === 'assistant' ? 229 : 139);
       doc.text(msg.role === 'assistant' ? "IVOOMI AI AGENT:" : "TECHNICIAN:", margin, y);
       y += 5;

       doc.setFontSize(10);
       doc.setFont("helvetica", "normal");
       doc.setTextColor(30, 41, 59);
       
       const lines = doc.splitTextToSize(msg.content, maxWidth);
       doc.text(lines, margin, y);
       y += (lines.length * 5) + 5;
    });

    // Disclaimer
    if (y > 270) doc.addPage();
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Generated by InfoFix Services CRM. Suggestions are based on available protocols.", margin, 290);

    doc.save(`Ivoomi_Consultation_${new Date().getTime()}.pdf`);
  };

  // --- RENDER HELPERS ---
  const getCategoryIcon = (cat: string) => {
    switch(cat) {
      case 'Repair': return <Cpu size={16} className="text-blue-500"/>;
      case 'Policy': return <Shield size={16} className="text-purple-500"/>;
      case 'Specs': return <FileText size={16} className="text-emerald-500"/>;
      default: return <RefreshCcw size={16} className="text-orange-500"/>;
    }
  };

  const filteredProtocols = protocols.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
      
      {/* TOP HEADER: Branding & External Link */}
      <div className="flex flex-col md:flex-row gap-6 shrink-0">
        <div className="flex-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
           <h1 className="text-2xl font-black text-slate-800 mb-1">IVOOMI <span className="text-indigo-600">Smart Hub</span></h1>
           <p className="text-sm text-slate-500">Official Brand Resource Center</p>
        </div>

        <a 
          href="https://vi.cancrm.in/" 
          target="_blank" 
          rel="noreferrer"
          className="bg-slate-900 p-6 rounded-2xl shadow-lg shadow-slate-200 text-white flex items-center justify-between gap-6 hover:shadow-xl hover:scale-[1.01] transition-all md:w-96 group cursor-pointer"
        >
           <div>
              <div className="flex items-center gap-2 mb-1 opacity-80">
                 <Globe size={14} />
                 <span className="text-[10px] font-bold uppercase tracking-wider">Partner Portal</span>
              </div>
              <h3 className="text-lg font-bold">Launch CRM</h3>
           </div>
           <div className="bg-white/10 p-2.5 rounded-xl group-hover:bg-white/20 transition-colors">
              <ExternalLink size={20} />
           </div>
        </a>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
         
         {/* LEFT COL: AI CONSULTANT (7 cols) */}
         <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 ring-2 ring-white shadow-sm">
                      <Bot size={20} />
                  </div>
                  <div>
                      <h3 className="font-bold text-slate-800 text-sm">Brand Tutor</h3>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <p className="text-[10px] text-slate-500 font-medium">Context Active: {protocols.length} Protocols</p>
                      </div>
                  </div>
                </div>
                <button 
                  onClick={handleDownloadReport}
                  className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                  title="Download PDF Report"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Download PDF</span>
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/30 custom-scrollbar">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${
                                msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                            }`}>
                                {msg.role === 'user' ? <User size={16}/> : <Sparkles size={16}/>}
                            </div>
                            <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                                msg.role === 'user' 
                                ? 'bg-white text-slate-800 border border-slate-200 rounded-tr-none shadow-sm' 
                                : 'bg-indigo-600 text-white rounded-tl-none shadow-md shadow-indigo-200'
                            }`}>
                                {msg.content}
                            </div>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex gap-1 ml-11">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-200 bg-white">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="E.g. What is the SOP for water damaged charging port?"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                    <button 
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isTyping}
                        className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
         </div>

         {/* RIGHT COL: PROTOCOL MANAGER (5 cols) */}
         <div className="lg:col-span-5 flex flex-col bg-slate-50 rounded-2xl border border-slate-200 shadow-inner overflow-hidden">
            {/* Manager Header */}
            <div className="p-4 bg-white border-b border-slate-200 flex flex-col gap-3">
               <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                     <BookOpen size={16} className="text-amber-500"/> Protocol Library
                  </h3>
                  <button 
                     onClick={() => setShowAddModal(true)}
                     className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                     title="Add New Protocol"
                  >
                     <Plus size={18} />
                  </button>
               </div>
               {/* Search Protocols */}
               <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input 
                     type="text" 
                     placeholder="Search protocols..." 
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full pl-8 pr-3 py-2 bg-slate-100 border-none rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
               </div>
            </div>

            {/* Protocol List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
               {filteredProtocols.length > 0 ? (
                  filteredProtocols.map((protocol) => (
                     <div key={protocol.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all group relative">
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-2">
                              {getCategoryIcon(protocol.category)}
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{protocol.category}</span>
                           </div>
                           <button 
                              onClick={() => handleDeleteProtocol(protocol.id)}
                              className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                              <Trash2 size={14} />
                           </button>
                        </div>
                        <h4 className="font-bold text-slate-700 text-sm mb-1">{protocol.title}</h4>
                        <div className="text-xs text-slate-500 line-clamp-3 bg-slate-50 p-2 rounded-lg leading-relaxed">
                           {protocol.content}
                        </div>
                     </div>
                  ))
               ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-center">
                     <FileText size={24} className="mb-2 opacity-50"/>
                     <p className="text-xs">No protocols found.</p>
                  </div>
               )}
            </div>
         </div>

      </div>

      {/* ADD PROTOCOL MODAL */}
      {showAddModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95">
               <div className="p-5 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">Add New Protocol</h3>
               </div>
               <div className="p-5 space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                     <input 
                        value={newProtocol.title || ''}
                        onChange={(e) => setNewProtocol({...newProtocol, title: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                        placeholder="e.g. Screen Replacement SOP"
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                     <select 
                        value={newProtocol.category}
                        onChange={(e) => setNewProtocol({...newProtocol, category: e.target.value as any})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none bg-white"
                     >
                        <option value="Repair">Repair</option>
                        <option value="Policy">Policy</option>
                        <option value="Troubleshoot">Troubleshoot</option>
                        <option value="Specs">Specs</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Content / Steps</label>
                     <textarea 
                        value={newProtocol.content || ''}
                        onChange={(e) => setNewProtocol({...newProtocol, content: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none h-24 resize-none"
                        placeholder="Enter detailed steps or rules..."
                     />
                  </div>
                  <div className="flex gap-3 pt-2">
                     <button 
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200"
                     >
                        Cancel
                     </button>
                     <button 
                        onClick={handleAddProtocol}
                        className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700"
                     >
                        Add
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}

    </div>
  );
}
