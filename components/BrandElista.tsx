
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
  Search,
  Image as ImageIcon,
  Loader2,
  X,
  Maximize2
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
  image?: string; // Base64 string for diagrams/images
}

// Default Data for Elista
const DEFAULT_PROTOCOLS: BrandProtocol[] = [
  {
    id: '1',
    title: 'LED TV Power Supply Check',
    category: 'Troubleshoot',
    content: '1. Check Fuse F1.\n2. Verify 12V DC output at bridge rectifier.\n3. If 0V, check MOSFET Q201.\n4. Ensure standby voltage is 5V.',
    image: ''
  }
];

export default function BrandElista() {
  // --- STATE ---
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to the ELISTA Service Hub. I can help you with repair protocols, LED/Smart TV troubleshooting, and warranty validation. I can also reference diagrams from your library.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Knowledge Base State
  const [protocols, setProtocols] = useState<BrandProtocol[]>(() => {
    const saved = localStorage.getItem('elista_protocols');
    return saved ? JSON.parse(saved) : DEFAULT_PROTOCOLS;
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProtocol, setNewProtocol] = useState<Partial<BrandProtocol>>({ category: 'Repair' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- EFFECTS ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('elista_protocols', JSON.stringify(protocols));
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
      `[CATEGORY: ${p.category.toUpperCase()}] TITLE: ${p.title}\nCONTENT: ${p.content}\n[HAS IMAGE: ${p.image ? 'Yes' : 'No'}]`
    ).join('\n\n');

    const systemPrompt = `
      You are an expert AI Service Engineer for the brand "ELISTA" (known for TVs, Audio, IT Accessories).
      Your goal is to assist technicians by referencing the company's specific INTERNAL KNOWLEDGE BASE.
      
      INTERNAL KNOWLEDGE BASE:
      ${kbContext}
      
      Instructions:
      1. Prioritize information from the Internal Knowledge Base.
      2. If a protocol mentions an image, tell the user "Please check the attached diagram in the Protocol Library for visual aid."
      3. Structure your answers with clear headings and steps (Pipeline format).
      4. If the info is missing, provide general electronics repair advice but flag it as "General Suggestion".
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
        content: "Network error. Unable to reach the AI service.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
        alert("Image must be under 1MB");
        return;
    }

    setIsCompressing(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 600; // Limit size for storage
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
            } else {
                if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            const compressed = canvas.toDataURL('image/jpeg', 0.7);
            setNewProtocol(prev => ({ ...prev, image: compressed }));
            setIsCompressing(false);
        };
    };
  };

  const handleAddProtocol = () => {
    if (newProtocol.title && newProtocol.content) {
      const protocol: BrandProtocol = {
        id: Date.now().toString(),
        title: newProtocol.title,
        category: newProtocol.category as any,
        content: newProtocol.content,
        image: newProtocol.image || ''
      };
      setProtocols([...protocols, protocol]);
      setNewProtocol({ category: 'Repair' });
      setShowAddModal(false);
    }
  };

  const handleDeleteProtocol = (id: string) => {
    setProtocols(protocols.filter(p => p.id !== id));
  };

  // --- PDF GENERATION ---
  const handleDownloadReport = () => {
    const doc = new jsPDF();
    
    // Header Style
    doc.setFillColor(236, 72, 153); // Pink/Fuchsia for Elista branding vibe
    doc.rect(0, 0, 210, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("ELISTA TECHNICAL REPORT", 10, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 160, 15);

    let y = 35;
    const margin = 15;
    const maxWidth = 180;

    // Chat Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text("Consultation Log", margin, y);
    y += 8;

    doc.setDrawColor(200);
    doc.line(margin, y, 195, y);
    y += 5;

    messages.forEach((msg) => {
        if (y > 270) { doc.addPage(); y = 20; }
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(msg.role === 'assistant' ? 236 : 80, msg.role === 'assistant' ? 72 : 80, msg.role === 'assistant' ? 153 : 80);
        doc.text(msg.role === 'assistant' ? "AI AGENT:" : "TECHNICIAN:", margin, y);
        y += 5;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(40);
        const lines = doc.splitTextToSize(msg.content, maxWidth);
        doc.text(lines, margin, y);
        y += (lines.length * 5) + 8;
    });

    // Appendix: Diagrams & Protocols
    // Find unique protocols referenced in chat (or just dump all for now as 'Relevant Data')
    doc.addPage();
    y = 20;
    
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 0, 210, 297, 'F'); // Light background for appendix
    
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("APPENDIX: SUPPORTING DOCUMENTS & DIAGRAMS", margin, y);
    y += 15;

    protocols.forEach((p, idx) => {
        if (y > 200) { doc.addPage(); y = 20; }

        // Protocol Box
        doc.setDrawColor(200);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(margin, y, 180, 80, 3, 3, 'FD');
        
        const contentY = y + 10;
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(p.title, margin + 5, contentY);
        
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Category: ${p.category}`, margin + 5, contentY + 5);

        doc.setFontSize(9);
        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(p.content, 100); // Wrap text on left side
        doc.text(lines, margin + 5, contentY + 15);

        // Image if exists
        if (p.image) {
            try {
                doc.addImage(p.image, 'JPEG', margin + 110, contentY, 60, 60);
                doc.setDrawColor(230);
                doc.rect(margin + 110, contentY, 60, 60); // border for image
            } catch (e) {
                doc.text("[Image Error]", margin + 120, contentY + 30);
            }
        } else {
            doc.setTextColor(150);
            doc.text("[No Diagram]", margin + 125, contentY + 30);
        }

        y += 90;
    });

    doc.save(`Elista_Support_Report_${new Date().getTime()}.pdf`);
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
           <h1 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">ELISTA <span className="text-pink-600">Connect</span></h1>
           <p className="text-sm text-slate-500">Service Network & Resource Center</p>
        </div>

        <a 
          href="https://elista.mcrm.in/" 
          target="_blank" 
          rel="noreferrer"
          className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl shadow-lg shadow-slate-300 text-white flex items-center justify-between gap-6 hover:shadow-xl hover:scale-[1.01] transition-all md:w-96 group cursor-pointer"
        >
           <div>
              <div className="flex items-center gap-2 mb-1 opacity-80">
                 <Globe size={14} />
                 <span className="text-[10px] font-bold uppercase tracking-wider">mCRM Portal</span>
              </div>
              <h3 className="text-lg font-bold">Launch Elista CRM</h3>
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
                  <div className="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center text-pink-600 ring-2 ring-white shadow-sm">
                      <Bot size={20} />
                  </div>
                  <div>
                      <h3 className="font-bold text-slate-800 text-sm">Elista AI Assistant</h3>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <p className="text-[10px] text-slate-500 font-medium">Online</p>
                      </div>
                  </div>
                </div>
                <button 
                  onClick={handleDownloadReport}
                  className="p-2 text-pink-700 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                  title="Download Report with Diagrams"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">PDF Report</span>
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/30 custom-scrollbar">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${
                                msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-pink-600 text-white shadow-md shadow-pink-200'
                            }`}>
                                {msg.role === 'user' ? <User size={16}/> : <Sparkles size={16}/>}
                            </div>
                            <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                                msg.role === 'user' 
                                ? 'bg-white text-slate-800 border border-slate-200 rounded-tr-none shadow-sm' 
                                : 'bg-pink-600 text-white rounded-tl-none shadow-md shadow-pink-200'
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
                        placeholder="Ask about TV backlights, Audio ICs, or Policies..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all"
                    />
                    <button 
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isTyping}
                        className="p-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-pink-200"
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
                     <BookOpen size={16} className="text-pink-500"/> Docs & Diagrams
                  </h3>
                  <button 
                     onClick={() => setShowAddModal(true)}
                     className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                     title="Add New Protocol"
                  >
                     <Plus size={18} />
                  </button>
               </div>
               {/* Search */}
               <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input 
                     type="text" 
                     placeholder="Search guides..." 
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full pl-8 pr-3 py-2 bg-slate-100 border-none rounded-lg text-xs outline-none focus:ring-2 focus:ring-pink-500/20"
                  />
               </div>
            </div>

            {/* Protocol List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
               {filteredProtocols.length > 0 ? (
                  filteredProtocols.map((protocol) => (
                     <div key={protocol.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-pink-300 transition-all group relative">
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
                        
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-700 text-sm mb-1">{protocol.title}</h4>
                                <div className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                                    {protocol.content}
                                </div>
                            </div>
                            {protocol.image && (
                                <button 
                                    onClick={() => setViewImage(protocol.image || null)}
                                    className="w-16 h-16 shrink-0 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden relative group/img"
                                >
                                    <img src={protocol.image} alt="Diagram" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                        <Maximize2 size={12} className="text-white drop-shadow-md" />
                                    </div>
                                </button>
                            )}
                        </div>
                     </div>
                  ))
               ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-center">
                     <FileText size={24} className="mb-2 opacity-50"/>
                     <p className="text-xs">No docs found.</p>
                  </div>
               )}
            </div>
         </div>

      </div>

      {/* ADD PROTOCOL MODAL */}
      {showAddModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
               <div className="p-5 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">Add Elista Protocol</h3>
               </div>
               <div className="p-5 space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                     <input 
                        value={newProtocol.title || ''}
                        onChange={(e) => setNewProtocol({...newProtocol, title: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-pink-500 outline-none"
                        placeholder="e.g. Backlight Voltage Chart"
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                     <select 
                        value={newProtocol.category}
                        onChange={(e) => setNewProtocol({...newProtocol, category: e.target.value as any})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-pink-500 outline-none bg-white"
                     >
                        <option value="Repair">Repair</option>
                        <option value="Policy">Policy</option>
                        <option value="Troubleshoot">Troubleshoot</option>
                        <option value="Specs">Specs</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Diagram / Image (Optional)</label>
                     <div className="flex items-center gap-3">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isCompressing}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-2"
                        >
                            {isCompressing ? <Loader2 size={14} className="animate-spin"/> : <ImageIcon size={14} />}
                            {newProtocol.image ? 'Change Image' : 'Upload Image'}
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                        {newProtocol.image && <span className="text-xs text-green-600 font-bold">Image Attached</span>}
                     </div>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Details</label>
                     <textarea 
                        value={newProtocol.content || ''}
                        onChange={(e) => setNewProtocol({...newProtocol, content: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-pink-500 outline-none h-24 resize-none"
                        placeholder="Enter step-by-step instructions..."
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
                        className="flex-1 py-2.5 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700"
                     >
                        Save Protocol
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* IMAGE PREVIEW MODAL */}
      {viewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setViewImage(null)}>
              <div className="max-w-4xl max-h-[90vh] overflow-hidden rounded-xl relative">
                  <img src={viewImage} alt="Full View" className="w-full h-full object-contain" />
                  <button className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70">
                      <X size={20} />
                  </button>
              </div>
          </div>
      )}

    </div>
  );
}
