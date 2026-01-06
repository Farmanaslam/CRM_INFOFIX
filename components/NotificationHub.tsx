
import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Zap, 
  Trash2, 
  CheckCheck,
  ChevronRight,
  Info,
  Flame,
  User,
  Ticket as TicketIcon
} from 'lucide-react';
import { AppNotification, View } from '../types';

interface NotificationHubProps {
  notifications: AppNotification[];
  setNotifications: (notifications: AppNotification[]) => void;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: View) => void;
}

export default function NotificationHub({ 
  notifications, 
  setNotifications, 
  isOpen, 
  onClose, 
  onNavigate 
}: NotificationHubProps) {
  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);

  // Monitor for new notifications to show toasts
  useEffect(() => {
    const unread = notifications.filter(n => !n.read && (Date.now() - n.timestamp < 10000));
    if (unread.length > 0) {
      const latest = unread[unread.length - 1];
      if (!activeToasts.find(t => t.id === latest.id)) {
        setActiveToasts(prev => [...prev, latest]);
        // Auto remove toast after 5 seconds
        setTimeout(() => {
          setActiveToasts(prev => prev.filter(t => t.id !== latest.id));
        }, 5000);
      }
    }
  }, [notifications]);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleNotificationClick = (n: AppNotification) => {
    setNotifications(notifications.map(item => item.id === n.id ? { ...item, read: true } : item));
    if (n.link) {
      onNavigate(n.link);
      onClose();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-emerald-500" size={18} />;
      case 'warning': return <AlertCircle className="text-amber-500" size={18} />;
      case 'urgent': return <Flame className="text-rose-500" size={18} />;
      default: return <Info className="text-blue-500" size={18} />;
    }
  };

  return (
    <>
      {/* TOAST OVERLAY (Visible even when hub is closed) */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        {activeToasts.map(toast => (
          <div 
            key={toast.id} 
            className="pointer-events-auto bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-right fade-in duration-500 flex gap-4"
          >
            <div className={`p-2 rounded-xl bg-white/10 shrink-0`}>
              {getIcon(toast.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-black text-white leading-none mb-1">{toast.title}</h4>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{toast.message}</p>
            </div>
            <button 
              onClick={() => setActiveToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-slate-500 hover:text-white shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* DRAWER HUB */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />
          <div className="absolute inset-y-0 right-0 w-full sm:w-[420px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Notification Center</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personal Activity Stream</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={24} /></button>
            </div>

            <div className="p-4 bg-slate-50 flex justify-between items-center shrink-0 border-b border-slate-100">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {notifications.filter(n => !n.read).length} Unread Updates
               </span>
               <button 
                 onClick={markAllAsRead}
                 className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-black transition-colors"
               >
                 <CheckCheck size={14} /> Mark all read
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-white">
               {notifications.length > 0 ? (
                 notifications.sort((a,b) => b.timestamp - a.timestamp).map(n => (
                   <div 
                     key={n.id}
                     onClick={() => handleNotificationClick(n)}
                     className={`p-4 rounded-2xl border transition-all cursor-pointer group relative ${n.read ? 'bg-white border-slate-100 opacity-60' : 'bg-slate-50 border-indigo-100 shadow-sm ring-1 ring-indigo-50'}`}
                   >
                     {!n.read && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-r-full"></div>}
                     
                     <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${n.read ? 'bg-slate-100 text-slate-400' : 'bg-white text-indigo-600 border border-indigo-50'}`}>
                           {getIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-start mb-1">
                              <h4 className={`text-sm font-black tracking-tight ${n.read ? 'text-slate-600' : 'text-slate-800'}`}>{n.title}</h4>
                              <span className="text-[9px] font-bold text-slate-400 tabular-nums">
                                {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                           </div>
                           <p className={`text-xs leading-relaxed ${n.read ? 'text-slate-400' : 'text-slate-500'}`}>{n.message}</p>
                           
                           {n.link && (
                              <div className="mt-3 flex items-center gap-1 text-[9px] font-black uppercase text-indigo-600 tracking-widest group-hover:gap-2 transition-all">
                                 View Details <ChevronRight size={10} />
                              </div>
                           )}
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                          className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-center p-10 text-slate-300 opacity-50">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                       <Bell size={40} />
                    </div>
                    <p className="font-black text-xs uppercase tracking-[0.2em]">Zero Notifications</p>
                    <p className="text-[10px] mt-2 max-w-[180px]">Your personal activity stream is clear.</p>
                 </div>
               )}
            </div>

            <div className="p-6 border-t border-slate-100 text-center shrink-0">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                  Encryption Layer Active • Personal Node V3.5
               </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
