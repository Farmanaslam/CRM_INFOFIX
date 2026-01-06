
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Calendar as CalendarIcon, 
  User, 
  CheckCircle2, 
  X,
  MapPin,
  Briefcase,
  Wrench,
  MoreHorizontal,
  Trash2,
  Tag,
  Users,
  AlignLeft,
  Edit,
  Save,
  AlertTriangle,
  StickyNote,
  ChevronDown
} from 'lucide-react';
import { Ticket, Task, AppSettings, User as AppUser } from '../types';

interface ScheduleProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  tickets: Ticket[];
  settings: AppSettings;
  currentUser: AppUser;
}

interface CalendarEvent {
  id: string;
  type: 'ticket' | 'task';
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  status: string;
  assignee?: AppUser;
  originalData: Ticket | Task;
}

const DeleteConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4 mx-auto">
          <Trash2 size={24} />
        </div>
        <h3 className="text-lg font-bold text-center text-slate-800 mb-2">Delete Task?</h3>
        <p className="text-center text-slate-500 mb-6 text-sm">
          Are you sure you want to delete this task? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
};

export default function Schedule({ tasks, setTasks, tickets, settings, currentUser }: ScheduleProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];
    tickets.forEach(ticket => {
      if (ticket.scheduledDate) {
        const assignee = settings.teamMembers.find(m => m.id === ticket.assignedToId);
        allEvents.push({
          id: ticket.id,
          type: 'ticket',
          title: `Job: ${ticket.deviceType} - ${ticket.ticketId}`,
          date: ticket.scheduledDate,
          status: ticket.status,
          assignee,
          originalData: ticket
        });
      }
    });
    tasks.forEach(task => {
      const assignee = settings.teamMembers.find(m => m.id === task.assignedToId);
      allEvents.push({
        id: task.id,
        type: 'task',
        title: task.title,
        date: task.date,
        time: task.time,
        status: task.status,
        assignee,
        originalData: task
      });
    });
    return allEvents;
  }, [tickets, tasks, settings.teamMembers]);

  const selectedDayEvents = events.filter(e => e.date === selectedDateStr);
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (taskId: string) => setTaskToDelete(taskId);
  const confirmDelete = () => {
    if (taskToDelete) {
      setTasks(tasks.filter(t => t.id !== taskToDelete));
      setTaskToDelete(null);
    }
  };

  const handleToggleTaskStatus = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t));
  };

  const handleSaveTask = (task: Task) => {
    if (editingTask) {
      setTasks(tasks.map(t => t.id === task.id ? task : t));
    } else {
      setTasks([...tasks, task]);
    }
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleCloseModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  // Technicians should also be able to create tasks for themselves
  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';
  const canCreate = currentUser.role !== 'CUSTOMER'; 
  const canDelete = isAdmin;

  const renderCalendarDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(<div key={`empty-${i}`} className="h-24 sm:h-32 bg-slate-50/30 border border-slate-100/50"></div>);
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter(e => e.date === dateStr);
      const isSelected = selectedDateStr === dateStr;
      const isToday = new Date().toISOString().split('T')[0] === dateStr;
      days.push(<div key={day} onClick={() => setSelectedDateStr(dateStr)} className={`h-24 sm:h-32 border border-slate-100 p-2 relative cursor-pointer transition-all group ${isSelected ? 'bg-indigo-50/50 ring-2 ring-inset ring-indigo-500/20 z-10' : 'hover:bg-slate-50'} ${isToday ? 'bg-white' : 'bg-white'}`}><div className="flex justify-between items-start mb-1"><span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700 group-hover:bg-slate-200'}`}>{day}</span>{dayEvents.length > 0 && <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 rounded-md">{dayEvents.length}</span>}</div><div className="space-y-1 overflow-hidden max-h-[calc(100%-30px)]">{dayEvents.slice(0, 3).map((evt, idx) => (<div key={idx} className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium border-l-2 ${evt.type === 'ticket' ? 'bg-indigo-50 text-indigo-700 border-indigo-400' : 'bg-emerald-50 text-emerald-700 border-emerald-400'}`} title={evt.title}>{evt.time && <span className="opacity-75 mr-1">{evt.time}</span>}{evt.title}</div>))}{dayEvents.length > 3 && <div className="text-[9px] text-slate-400 pl-1">+ {dayEvents.length - 3} more</div>}</div></div>);
    }
    return days;
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6">
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{monthNames[month]} <span className="text-slate-400 font-normal">{year}</span></h2>
               <div className="flex bg-slate-100 rounded-lg p-1 gap-1"><button onClick={prevMonth} className="p-1 hover:bg-white rounded shadow-sm text-slate-600 transition-all"><ChevronLeft size={18}/></button><button onClick={nextMonth} className="p-1 hover:bg-white rounded shadow-sm text-slate-600 transition-all"><ChevronRight size={18}/></button></div>
            </div>
            {canCreate && (<button onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"><Plus size={18} /> Add Task</button>)}
        </div>
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-widest text-center py-3"><div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div></div>
        <div className="grid grid-cols-7 flex-1 overflow-y-auto custom-scrollbar">{renderCalendarDays()}</div>
      </div>

      <div className="w-full lg:w-96 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
         <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
            <h3 className="text-lg font-bold flex items-center gap-2"><CalendarIcon size={20} className="text-indigo-200" /> Daily Agenda</h3>
            <p className="text-indigo-100 text-sm mt-1">{new Date(selectedDateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50">
            {selectedDayEvents.length > 0 ? (
               selectedDayEvents.sort((a,b) => (a.time || '').localeCompare(b.time || '')).map(evt => (
                  <div key={`${evt.type}-${evt.id}`} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm group hover:shadow-md transition-all relative overflow-hidden">
                     <div className={`absolute left-0 top-0 bottom-0 w-1 ${evt.type === 'ticket' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
                     <div className="pl-2">
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-2">
                              {evt.type === 'ticket' ? <span className="text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">Ticket</span> : <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">Task</span>}
                              {evt.time && <span className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Clock size={12}/> {evt.time}</span>}
                           </div>
                           {evt.type === 'task' && (
                              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => handleToggleTaskStatus(evt.id)} title={evt.status === 'completed' ? 'Mark Pending' : 'Mark Completed'} className={`p-1.5 rounded-lg transition-colors ${evt.status === 'completed' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}><CheckCircle2 size={16} /></button>
                                 <button onClick={() => handleEditTask(evt.originalData as Task)} title={isAdmin ? "Edit Task" : "Add Note / Update"} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit size={16} /></button>
                                 {canDelete && (<button onClick={() => handleDeleteTask(evt.id)} title="Delete Task" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>)}
                              </div>
                           )}
                        </div>
                        <h4 className={`font-bold text-slate-800 text-sm mb-1 ${evt.status === 'completed' || evt.status === 'Resolved' ? 'line-through text-slate-400' : ''}`}>{evt.title}</h4>
                        {evt.type === 'ticket' ? (
                           <div className="text-xs text-slate-500 space-y-1"><p className="flex items-center gap-1.5"><MapPin size={12}/> {(evt.originalData as Ticket).store}</p><p className="flex items-center gap-1.5"><Wrench size={12}/> {(evt.originalData as Ticket).issueDescription}</p></div>
                        ) : (
                           <div className="text-xs text-slate-500 space-y-2">
                              <p>{(evt.originalData as Task).description}</p>
                              {(evt.originalData as Task).technicianNote && (
                                <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100 flex items-start gap-2 italic">
                                  <StickyNote size={12} className="text-indigo-400 mt-0.5 shrink-0" />
                                  <p className="text-[10px] text-indigo-700 leading-relaxed">{(evt.originalData as Task).technicianNote}</p>
                                </div>
                              )}
                           </div>
                        )}
                        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                           {evt.assignee ? <div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-slate-200 text-[10px] flex items-center justify-center font-bold text-slate-600">{evt.assignee.name.charAt(0)}</div><span className="text-xs text-slate-600">{evt.assignee.name}</span></div> : <span className="text-xs text-slate-400 italic">Unassigned</span>}
                           <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${evt.status === 'completed' || evt.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{evt.status}</span>
                        </div>
                     </div>
                  </div>
               ))
            ) : (<div className="flex flex-col items-center justify-center h-48 text-slate-400 text-center"><div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3"><CalendarIcon size={24} className="opacity-50" /></div><p className="text-sm font-medium">No events scheduled</p><p className="text-xs mt-1">Click "Add Task" to create one.</p></div>)}
         </div>
         {canCreate && (
          <div className="p-4 border-t border-slate-200 bg-white">
              <button onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }} className="w-full py-2.5 border border-dashed border-indigo-300 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"><Plus size={16} /> Add Task for {new Date(selectedDateStr).getDate()}th</button>
          </div>
         )}
      </div>

      {isTaskModalOpen && (
        <TaskModal isOpen={isTaskModalOpen} onClose={handleCloseModal} initialDate={selectedDateStr} onSave={handleSaveTask} teamMembers={settings.teamMembers} currentUser={currentUser} taskToEdit={editingTask} />
      )}
      <DeleteConfirmationModal isOpen={!!taskToDelete} onClose={() => setTaskToDelete(null)} onConfirm={confirmDelete} />
    </div>
  );
}

interface TaskModalProps {
   isOpen: boolean;
   onClose: () => void;
   onSave: (task: Task) => void;
   initialDate: string;
   teamMembers: AppUser[];
   currentUser: AppUser;
   taskToEdit?: Task | null;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, initialDate, teamMembers, currentUser, taskToEdit }) => {
   const [formData, setFormData] = useState<Partial<Task>>({
      title: '',
      date: initialDate,
      time: '09:00',
      description: '',
      technicianNote: '',
      type: 'general',
      assignedToId: currentUser.id,
      status: 'pending'
   });

   useEffect(() => {
     if (taskToEdit) {
       setFormData(taskToEdit);
     } else {
       setFormData({ title: '', date: initialDate, time: '09:00', description: '', technicianNote: '', type: 'general', assignedToId: currentUser.id, status: 'pending' });
     }
   }, [taskToEdit, initialDate, currentUser]);

   const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';
   const isTechnician = currentUser.role === 'TECHNICIAN';
   
   // --- ACCESS FILTERING ---
   const assignableMembers = useMemo(() => {
     if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') return teamMembers;
     if (currentUser.role === 'MANAGER') {
       return teamMembers.filter(m => m.role === 'MANAGER' || m.role === 'TECHNICIAN');
     }
     // Technicians can only assign to themselves
     return teamMembers.filter(m => m.id === currentUser.id);
   }, [teamMembers, currentUser.role, currentUser.id]);

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(formData.title && formData.date) {
         onSave({
            id: taskToEdit ? taskToEdit.id : Date.now().toString(),
            title: formData.title,
            date: formData.date,
            time: formData.time,
            description: formData.description || '',
            technicianNote: formData.technicianNote || '',
            type: formData.type as any,
            assignedToId: formData.assignedToId,
            status: formData.status || 'pending',
            createdBy: taskToEdit ? taskToEdit.createdBy : currentUser.id
         });
      }
   };

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
         <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
               <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${taskToEdit ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>{taskToEdit ? <Edit size={20} /> : <CheckCircle2 size={20} />}</div>
                  <div><h3 className="font-bold text-slate-800 text-lg">{taskToEdit ? (isAdmin ? 'Edit Task' : 'Update Log') : 'Add New Task'}</h3><p className="text-xs text-slate-500 font-medium">{taskToEdit ? 'Adjust details and feedback' : 'Schedule a new activity'}</p></div>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 p-6 space-y-5">
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Task Title</label>
                  <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Tag size={16} /></div><input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-60" placeholder="e.g. Shop Inventory Check" /></div>
               </div>
               
               <div className="grid grid-cols-2 gap-5">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Date</label>
                     <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><CalendarIcon size={16} /></div><input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-60" /></div>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Time</label>
                     <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Clock size={16} /></div><input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-60" /></div>
                  </div>
               </div>
               
               <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Task Category</label><div className="grid grid-cols-3 gap-2">{[{ id: 'general', label: 'General', icon: CheckCircle2 }, { id: 'meeting', label: 'Meeting', icon: Users }, { id: 'maintenance', label: 'Maint.', icon: Wrench }].map(type => (<button key={type.id} type="button" onClick={() => setFormData({...formData, type: type.id as any})} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${formData.type === type.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-200 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}><type.icon size={20} className="mb-1.5" /><span className="text-xs font-bold">{type.label}</span></button>))}</div></div>
               
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Assign To</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User size={16} />
                    </div>
                    <select 
                      disabled={isTechnician}
                      value={formData.assignedToId || ''} 
                      onChange={e => setFormData({...formData, assignedToId: e.target.value})} 
                      className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                    >
                      <option value="">-- Unassigned --</option>
                      {assignableMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.role.replace('_', ' ')})</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                  {isTechnician && <p className="text-[10px] text-slate-400 mt-1 ml-1 italic">Technicians can only create personal tasks.</p>}
               </div>
               
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Admin Notes / Description</label>
                  <div className="relative"><div className="absolute top-3 left-3 pointer-events-none text-slate-400"><AlignLeft size={16} /></div><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none h-20 transition-all disabled:opacity-60" placeholder="Task description..." /></div>
               </div>
               
               <hr className="border-slate-200" />
               
               <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5 ml-1 flex items-center gap-2"><StickyNote size={14} className="text-indigo-600" /> Technician Feedback</label>
                  <div className="relative">
                     <textarea 
                        value={formData.technicianNote} 
                        onChange={e => setFormData({...formData, technicianNote: e.target.value})} 
                        className="w-full px-4 py-3 bg-indigo-50/30 border border-indigo-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none h-24 transition-all italic placeholder:text-slate-300" 
                        placeholder="Technician feedback or completion notes (internal only)..." 
                     />
                  </div>
               </div>

               <div className="pt-2 flex gap-3 pb-4">
                  <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2">{taskToEdit ? <><Save size={18}/> {isAdmin ? 'Save Changes' : 'Update Note'}</> : 'Create Task'}</button>
               </div>
            </form>
         </div>
      </div>
   );
};
