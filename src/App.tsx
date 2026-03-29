import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Edit2, Check, X, Search, Filter,
  Calendar, Archive, Trash, MoreHorizontal, 
  Menu, User, Bell, ChevronLeft, ChevronRight,
  Clock, FileText, Folder, List, ListOrdered
} from 'lucide-react';

interface Note {
  id: string;
  title: string;
  text: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  color: string;
  isArchived?: boolean;
  isDeleted?: boolean;
  tags?: string[];
}

type ViewType = 'notes' | 'calendar' | 'archive' | 'trash' | 'pending';
type TimeFilter = 'all' | 'todays' | 'this-week' | 'this-month';

const COLORS = [
  'bg-[#FFF08A]', // Yellow
  'bg-[#F9B7B7]', // Pink
  'bg-[#7EBCE1]', // Blue
  'bg-[#E2F0CB]', // Green
  'bg-[#FFD1BA]', // Orange
];

export default function App() {
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('ranas-notes-v2');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load notes:', e);
      return [];
    }
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('notes');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [notifications, setNotifications] = useState<{id: string, text: string, time: number}[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [newTag, setNewTag] = useState('');
  const [currentTags, setCurrentTags] = useState<string[]>([]);

  useEffect(() => {
    if (editingNote) {
      setCurrentTags(editingNote.tags || []);
    } else if (isAdding) {
      setCurrentTags([]);
    }
  }, [editingNote, isAdding]);

  const addNotification = (text: string) => {
    const newNotif = { id: Math.random().toString(36), text, time: Date.now() };
    setNotifications(prev => [newNotif, ...prev].slice(0, 10));
  };

  const counts = useMemo(() => ({
    notes: notes.filter(n => !n.isArchived && !n.isDeleted).length,
    pending: notes.filter(n => !n.isArchived && !n.isDeleted && !n.completed).length,
    archive: notes.filter(n => n.isArchived && !n.isDeleted).length,
    trash: notes.filter(n => n.isDeleted).length,
  }), [notes]);

  // Profile State
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('ranas-profile');
      return saved ? JSON.parse(saved) : { name: 'Sayef mahmud', pic: 'https://picsum.photos/seed/user/100/100' };
    } catch (e) {
      return { name: 'Sayef mahmud', pic: 'https://picsum.photos/seed/user/100/100' };
    }
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState(profile);

  const insertList = (type: 'bullet' | 'number') => {
    const prefix = type === 'bullet' ? '• ' : '1. ';
    if (editingNote) {
      const currentText = editingNote.text;
      const lines = currentText.split('\n');
      const lastLine = lines[lines.length - 1];
      
      // If the last line is empty or just whitespace, add the prefix to it
      if (lastLine.trim() === '') {
        lines[lines.length - 1] = prefix;
      } else {
        lines.push(prefix);
      }
      setEditingNote({ ...editingNote, text: lines.join('\n') });
    } else {
      const lines = newNoteText.split('\n');
      const lastLine = lines[lines.length - 1];
      if (lastLine.trim() === '') {
        lines[lines.length - 1] = prefix;
      } else {
        lines.push(prefix);
      }
      setNewNoteText(lines.join('\n'));
    }
  };

  useEffect(() => {
    localStorage.setItem('ranas-notes-v2', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('ranas-profile', JSON.stringify(profile));
  }, [profile]);

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempProfile(prev => ({ ...prev, pic: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = () => {
    setProfile(tempProfile);
    setIsEditingProfile(false);
  };

  const addNote = () => {
    if (!newNoteText.trim()) return;
    const newNote: Note = {
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      title: newNoteTitle.trim() || 'Untitled Note',
      text: newNoteText.trim(),
      completed: false,
      createdAt: Date.now(),
      color: 'bg-[#FFF08A]', // Default to yellow for pending
      tags: currentTags,
    };
    setNotes(prev => [newNote, ...prev]);
    setIsAdding(false);
    setNewNoteTitle('');
    setNewNoteText('');
    setCurrentTags([]);
    addNotification(`New note added: ${newNote.title}`);
  };

  const deleteNote = (id: string) => {
    const noteToDelete = notes.find(n => n.id === id);
    if (activeView === 'trash') {
      setNotes(prev => prev.filter(n => n.id !== id));
      addNotification(`Note permanently deleted: ${noteToDelete?.title}`);
    } else {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, isDeleted: true } : n));
      addNotification(`Note moved to trash: ${noteToDelete?.title}`);
    }
    setShowDeleteConfirm(null);
  };

  const archiveNote = (id: string) => {
    const note = notes.find(n => n.id === id);
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isArchived: !n.isArchived } : n));
    addNotification(`Note ${!note?.isArchived ? 'archived' : 'unarchived'}: ${note?.title}`);
  };

  const restoreNote = (id: string) => {
    const note = notes.find(n => n.id === id);
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isDeleted: false } : n));
    addNotification(`Note restored: ${note?.title}`);
  };

  const toggleComplete = (id: string) => {
    setNotes(prev => prev.map(n => {
      if (n.id === id) {
        const isCompleting = !n.completed;
        addNotification(`Note marked as ${isCompleting ? 'completed' : 'incomplete'}: ${n.title}`);
        return { 
          ...n, 
          completed: isCompleting,
          completedAt: isCompleting ? Date.now() : undefined,
          color: isCompleting ? 'bg-[#E2F0CB]' : 'bg-[#FFF08A]'
        };
      }
      return n;
    }));
  };

  const saveEdit = () => {
    if (!editingNote || !editingNote.text.trim()) return;
    // Enforce color based on status
    const updatedNote = {
      ...editingNote,
      color: editingNote.completed ? 'bg-[#E2F0CB]' : 'bg-[#FFF08A]',
      tags: currentTags
    };
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
    setEditingNote(null);
    setCurrentTags([]);
  };

  const filteredNotes = useMemo(() => {
    let result = notes;

    // View Filter
    if (activeView === 'notes') {
      result = result.filter(n => !n.isDeleted && !n.isArchived);
    } else if (activeView === 'pending') {
      result = result.filter(n => !n.isDeleted && !n.isArchived && !n.completed);
    } else if (activeView === 'archive') {
      result = result.filter(n => n.isArchived && !n.isDeleted);
    } else if (activeView === 'trash') {
      result = result.filter(n => n.isDeleted);
    } else if (activeView === 'calendar') {
      result = result.filter(n => !n.isDeleted);
    }

    // Search Filter
    if (searchQuery) {
      result = result.filter(n => 
        n.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.tags && n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    }

    // Advanced Filters
    if (filterStatus !== 'all') {
      result = result.filter(n => filterStatus === 'completed' ? n.completed : !n.completed);
    }

    if (filterTags.length > 0) {
      result = result.filter(n => n.tags && filterTags.every(t => n.tags?.includes(t)));
    }

    if (filterStartDate) {
      const start = new Date(filterStartDate).getTime();
      result = result.filter(n => n.createdAt >= start);
    }

    if (filterEndDate) {
      const end = new Date(filterEndDate).getTime() + 86400000; // end of day
      result = result.filter(n => n.createdAt <= end);
    }

    // Time Filter (only if not searching and no advanced filters active)
    const hasAdvancedFilters = filterStatus !== 'all' || filterTags.length > 0 || filterStartDate || filterEndDate;
    if (!searchQuery && !hasAdvancedFilters) {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      
      // Calculate start of week without mutating 'now'
      const dForWeek = new Date(now);
      dForWeek.setHours(0, 0, 0, 0);
      const day = dForWeek.getDay();
      const startOfWeek = new Date(dForWeek.setDate(dForWeek.getDate() - day)).getTime();
      
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      // Apply Month/Year filter from currentDate to 'notes' and 'calendar' views
      // But only if we are not in 'All Notes' mode or if we are in calendar view
      if (activeView === 'calendar' || (activeView === 'notes' && timeFilter !== 'all')) {
        result = result.filter(n => {
          const d = new Date(n.createdAt);
          return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
        });
      }

      if (timeFilter !== 'all') {
        result = result.filter(n => {
          // Rule: Show if it's not completed (always show pending)
          // OR if it was created within the selected time range
          if (!n.completed) return true;

          if (timeFilter === 'todays') {
            return n.createdAt >= startOfToday;
          } else if (timeFilter === 'this-week') {
            return n.createdAt >= startOfWeek;
          } else if (timeFilter === 'this-month') {
            return n.createdAt >= startOfMonth;
          }
          return true;
        });
      }
    }

    return result;
  }, [notes, searchQuery, activeView, timeFilter, currentDate]);

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(timestamp);
  };

  const formatTime = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long'
    }).format(timestamp);
  };

  return (
    <div className="flex h-screen bg-[#F5F7F9] font-sans text-slate-900 overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 lg:hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 flex items-center justify-between border-b border-slate-100">
                <button 
                  onClick={() => { setTempProfile(profile); setIsEditingProfile(true); setIsMobileMenuOpen(false); }}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm group-hover:scale-110 transition-transform">
                    <img src={profile.pic} alt="User" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-sm text-slate-900 line-clamp-1">{profile.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Edit Profile</span>
                  </div>
                </button>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 px-4 space-y-2 mt-4">
                <button 
                  onClick={() => { setActiveView('notes'); setIsAdding(true); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 group"
                >
                  <div className="p-1 bg-slate-900 rounded text-white"><Plus className="w-4 h-4" /></div>
                  <span className="font-medium">Add new</span>
                </button>

                <div className="py-4 space-y-1">
                  {[
                    { icon: Clock, label: 'Pending Notes', view: 'pending', count: counts.pending },
                    { icon: Calendar, label: 'Calendar', view: 'calendar' },
                    { icon: Archive, label: 'Archive', view: 'archive', count: counts.archive },
                    { icon: Trash, label: 'Trash', view: 'trash', count: counts.trash },
                    { icon: FileText, label: "Rana's Notes", view: 'notes', count: counts.notes },
                  ].map((item) => (
                    <button 
                      key={item.label} 
                      onClick={() => { setActiveView(item.view as ViewType); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                        activeView === item.view 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {item.count !== undefined && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          activeView === item.view ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </nav>

              <div className="p-6">
                {/* Upgrade pro removed */}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 hidden lg:flex flex-col z-30`}
      >
        <div className="p-6 border-b border-slate-100">
          <button 
            onClick={() => { setTempProfile(profile); setIsEditingProfile(true); }}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 min-w-[40px] rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm group-hover:scale-110 transition-transform">
              <img src={profile.pic} alt="User" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col items-start overflow-hidden">
                <span className="font-bold text-sm text-slate-900 line-clamp-1">{profile.name}</span>
                <span className="text-[10px] text-slate-400 font-medium">Edit Profile</span>
              </div>
            )}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => { setActiveView('notes'); setIsAdding(true); }}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 group"
          >
            <div className="p-1 bg-slate-900 rounded text-white"><Plus className="w-4 h-4" /></div>
            {isSidebarOpen && <span className="font-medium">Add new</span>}
          </button>

          <div className="py-4 space-y-1">
            {[
              { icon: Clock, label: 'Pending Notes', view: 'pending', count: counts.pending },
              { icon: Calendar, label: 'Calendar', view: 'calendar' },
              { icon: Archive, label: 'Archive', view: 'archive', count: counts.archive },
              { icon: Trash, label: 'Trash', view: 'trash', count: counts.trash },
              { icon: FileText, label: "Rana's Notes", view: 'notes', count: counts.notes },
            ].map((item) => (
              <button 
                key={item.label} 
                onClick={() => setActiveView(item.view as ViewType)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                  activeView === item.view 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                </div>
                {isSidebarOpen && item.count !== undefined && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    activeView === item.view ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {isSidebarOpen && (
          <div className="p-6">
            {/* Upgrade pro removed */}
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between z-20">
          <div className="flex items-center gap-3 md:gap-8 flex-1">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg md:text-2xl font-bold whitespace-nowrap">Rana's Notes</h1>
            <div className="relative max-w-md w-full hidden sm:flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F5F7F9] border-none rounded-lg py-2 pl-10 pr-10 text-sm focus:ring-2 focus:ring-blue-500/20"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                )}
              </div>
              <button 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`p-2 rounded-lg transition-all ${showAdvancedFilters ? 'bg-blue-600 text-white shadow-lg' : 'bg-[#F5F7F9] text-slate-400 hover:bg-slate-100'}`}
                title="Advanced Filters"
              >
                <Filter className={`w-4 h-4 ${showAdvancedFilters ? 'text-white' : 'text-slate-400'}`} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 relative">
            <div className="sm:hidden">
              <button 
                onClick={() => {
                  const query = prompt("Search notes:");
                  if (query !== null) setSearchQuery(query);
                }}
                className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                      <span className="font-bold text-sm">Notifications</span>
                      <button onClick={() => setNotifications([])} className="text-[10px] text-blue-600 font-bold hover:underline">Clear all</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">No new notifications</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <p className="text-xs text-slate-700 font-medium mb-1">{n.text}</p>
                            <span className="text-[10px] text-slate-400">{new Date(n.time).toLocaleTimeString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hidden lg:block"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 md:space-y-12">
          {/* Advanced Filters Panel */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-3xl p-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 border border-slate-100 shadow-sm">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                    <div className="flex gap-2">
                      {(['all', 'pending', 'completed'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => setFilterStatus(status)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${filterStatus === status ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Range</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="date" 
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="bg-slate-50 border-none rounded-xl p-2 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20 w-full"
                      />
                      <span className="text-slate-300">-</span>
                      <input 
                        type="date" 
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="bg-slate-50 border-none rounded-xl p-2 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20 w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tags</label>
                      <button 
                        onClick={() => {
                          setFilterStatus('all');
                          setFilterTags([]);
                          setFilterStartDate('');
                          setFilterEndDate('');
                        }}
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        Reset Filters
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {/* Unique tags from all notes */}
                      {Array.from(new Set(notes.flatMap(n => n.tags || []))).map(tag => (
                        <button
                          key={tag}
                          onClick={() => setFilterTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${filterTags.includes(tag) ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                          #{tag}
                        </button>
                      ))}
                      {notes.flatMap(n => n.tags || []).length === 0 && <span className="text-[10px] text-slate-300 italic">No tags found</span>}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* My Notes Section */}
          <section>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-8">
                <h2 className="text-xl font-bold capitalize">{activeView === 'notes' ? 'My Notes' : activeView}</h2>
                <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-slate-400 overflow-x-auto pb-2 sm:pb-0">
                  <button 
                    onClick={() => { setTimeFilter('all'); }}
                    className={`whitespace-nowrap ${timeFilter === 'all' ? 'text-slate-900 border-b-2 border-slate-900 pb-1' : 'hover:text-slate-900'}`}
                  >
                    All Notes
                  </button>
                  <button 
                    onClick={() => { setTimeFilter('todays'); setCurrentDate(new Date()); }}
                    className={`whitespace-nowrap ${timeFilter === 'todays' ? 'text-slate-900 border-b-2 border-slate-900 pb-1' : 'hover:text-slate-900'}`}
                  >
                    Todays
                  </button>
                  <button 
                    onClick={() => { setTimeFilter('this-week'); setCurrentDate(new Date()); }}
                    className={`whitespace-nowrap ${timeFilter === 'this-week' ? 'text-slate-900 border-b-2 border-slate-900 pb-1' : 'hover:text-slate-900'}`}
                  >
                    This Week
                  </button>
                  <button 
                    onClick={() => { setTimeFilter('this-month'); setCurrentDate(new Date()); }}
                    className={`whitespace-nowrap ${timeFilter === 'this-month' ? 'text-slate-900 border-b-2 border-slate-900 pb-1' : 'hover:text-slate-900'}`}
                  >
                    This Month
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4 text-slate-400">
                <button 
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setCurrentDate(newDate);
                  }}
                  className="p-1 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-bold text-slate-900 min-w-[120px] text-center">
                  {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate)}
                </span>
                <button 
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setCurrentDate(newDate);
                  }}
                  className="p-1 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {activeView === 'calendar' ? (
              <div className="space-y-10">
                {Object.entries(
                  filteredNotes.reduce((groups: Record<string, Note[]>, note) => {
                    const date = formatDate(note.createdAt);
                    if (!groups[date]) groups[date] = [];
                    groups[date].push(note);
                    return groups;
                  }, {} as Record<string, Note[]>)
                ).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()).map(([date, dateNotes]: [string, Note[]]) => (
                  <div key={date} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-slate-200"></div>
                      <span className="text-sm font-bold text-slate-400 bg-slate-50 px-4 py-1 rounded-full border border-slate-200 shadow-sm">
                        {date}
                      </span>
                      <div className="h-px flex-1 bg-slate-200"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                      <AnimatePresence mode="popLayout">
                        {dateNotes.map((note) => (
                          <motion.div
                            key={note.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={() => setViewingNote(note)}
                            className={`${note.color} rounded-3xl p-6 flex flex-col h-72 relative group hover:shadow-xl transition-all cursor-pointer ${note.completed ? 'opacity-60' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-900/40 uppercase tracking-wider">Created</span>
                                <span className="text-[10px] font-bold text-slate-900/60">{formatDate(note.createdAt)}</span>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                {activeView === 'trash' ? (
                                  <button 
                                    onClick={() => restoreNote(note.id)}
                                    className="p-1.5 bg-white/40 rounded-lg hover:bg-green-500 hover:text-white transition-colors"
                                    title="Restore"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <>
                                    <button 
                                      onClick={() => archiveNote(note.id)}
                                      className={`p-1.5 bg-white/40 rounded-lg hover:bg-white/60 transition-colors ${note.isArchived ? 'text-blue-600' : ''}`}
                                      title={note.isArchived ? "Unarchive" : "Archive"}
                                    >
                                      <Archive className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={() => setEditingNote(note)}
                                      className="p-1.5 bg-white/40 rounded-lg hover:bg-white/60 transition-colors"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                                <button 
                                  onClick={() => setShowDeleteConfirm(note.id)}
                                  className="p-1.5 bg-white/40 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            
                            <h3 className={`font-bold text-lg mb-3 line-clamp-2 flex-1 ${note.completed ? 'line-through' : ''}`}>
                              {note.title}
                            </h3>
                            
                            {note.completed && note.completedAt && (
                              <div className="mb-3 flex flex-col">
                                <span className="text-[10px] font-bold text-green-700/60 uppercase tracking-wider">Completed</span>
                                <span className="text-[10px] font-bold text-green-700/80">{formatDate(note.completedAt)}</span>
                              </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
                              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-900/40">
                                <Clock className="w-3 h-3" />
                                <span>{formatTime(note.createdAt)}</span>
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); toggleComplete(note.id); }}
                                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${note.completed ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-900/20 hover:border-slate-900'}`}
                              >
                                {note.completed && <Check className="w-3 h-3" />}
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
                {filteredNotes.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                    <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No notes found for this month</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredNotes.map((note) => (
                    <motion.div
                      key={note.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={() => setViewingNote(note)}
                      className={`${note.color} rounded-3xl p-6 flex flex-col h-72 relative group hover:shadow-xl transition-all cursor-pointer ${note.completed ? 'opacity-60' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-900/40 uppercase tracking-wider">Created</span>
                          <span className="text-[10px] font-bold text-slate-900/60">{formatDate(note.createdAt)}</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          {activeView === 'trash' ? (
                            <button 
                              onClick={() => restoreNote(note.id)}
                              className="p-1.5 bg-white/40 rounded-lg hover:bg-green-500 hover:text-white transition-colors"
                              title="Restore"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <>
                              <button 
                                onClick={() => archiveNote(note.id)}
                                className={`p-1.5 bg-white/40 rounded-lg hover:bg-white/60 transition-colors ${note.isArchived ? 'text-blue-600' : ''}`}
                                title={note.isArchived ? "Unarchive" : "Archive"}
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => setEditingNote(note)}
                                className="p-1.5 bg-white/40 rounded-lg hover:bg-white/60 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => setShowDeleteConfirm(note.id)}
                            className="p-1.5 bg-white/40 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      <h3 className={`font-bold text-lg mb-3 line-clamp-2 flex-1 ${note.completed ? 'line-through' : ''}`}>
                        {note.title}
                      </h3>
                      
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {note.tags.map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 bg-black/5 rounded text-[9px] font-bold text-black/40 uppercase tracking-tight">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {note.completed && note.completedAt && (
                        <div className="mb-3 flex flex-col">
                          <span className="text-[10px] font-bold text-green-700/60 uppercase tracking-wider">Completed</span>
                          <span className="text-[10px] font-bold text-green-700/80">{formatDate(note.completedAt)}</span>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-900/40">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(note.createdAt)}</span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleComplete(note.id); }}
                          className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${note.completed ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-900/20 hover:border-slate-900'}`}
                        >
                          {note.completed && <Check className="w-3 h-3" />}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <button 
                  onClick={() => setIsAdding(true)}
                  className="border-2 border-dashed border-slate-200 rounded-3xl p-6 h-72 flex flex-col items-center justify-center text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-all group"
                >
                  <div className="bg-slate-900 w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <span className="font-bold">New Note</span>
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Floating Add Button */}
      <button 
        onClick={() => setIsAdding(true)}
        className="fixed bottom-8 right-8 z-40 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 hover:scale-110 transition-all active:scale-95 lg:hidden"
        title="Add New Note"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Desktop Floating Add Button */}
      <button 
        onClick={() => setIsAdding(true)}
        className="fixed bottom-8 right-8 z-40 w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-2xl hidden lg:flex items-center justify-center hover:bg-blue-700 hover:scale-110 transition-all active:scale-95"
        style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
        title="Add New Note"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(isAdding || editingNote) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] p-6 md:p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">{editingNote ? 'Edit Note' : 'Create New Note'}</h3>
                <button 
                  onClick={() => { setIsAdding(false); setEditingNote(null); }}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Title</label>
                  <input 
                    type="text"
                    placeholder="Enter title..."
                    value={editingNote ? editingNote.title : newNoteTitle}
                    onChange={(e) => editingNote ? setEditingNote({...editingNote, title: e.target.value}) : setNewNoteTitle(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-400 uppercase block">Content</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => insertList('bullet')}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                        title="Add Bullet Point"
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => insertList('number')}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                        title="Add Numbered List"
                      >
                        <ListOrdered className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <textarea 
                    placeholder="Write your note here..."
                    rows={5}
                    value={editingNote ? editingNote.text : newNoteText}
                    onChange={(e) => editingNote ? setEditingNote({...editingNote, text: e.target.value}) : setNewNoteText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const currentText = editingNote ? editingNote.text : newNoteText;
                        const lines = currentText.split('\n');
                        const lastLine = lines[lines.length - 1];
                        
                        if (lastLine === '• ') {
                          e.preventDefault();
                          const newText = lines.slice(0, -1).join('\n') + '\n';
                          editingNote ? setEditingNote({...editingNote, text: newText}) : setNewNoteText(newText);
                        } else if (lastLine.match(/^\d+\. $/)) {
                          e.preventDefault();
                          const newText = lines.slice(0, -1).join('\n') + '\n';
                          editingNote ? setEditingNote({...editingNote, text: newText}) : setNewNoteText(newText);
                        } else if (lastLine.startsWith('• ')) {
                          e.preventDefault();
                          const newText = currentText + '\n• ';
                          editingNote ? setEditingNote({...editingNote, text: newText}) : setNewNoteText(newText);
                        } else if (lastLine.match(/^\d+\. /)) {
                          e.preventDefault();
                          const match = lastLine.match(/^(\d+)\. /);
                          const nextNum = parseInt(match![1]) + 1;
                          const newText = currentText + `\n${nextNum}. `;
                          editingNote ? setEditingNote({...editingNote, text: newText}) : setNewNoteText(newText);
                        }
                      }
                    }}
                    className="w-full bg-slate-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-blue-500/20 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {currentTags.map(tag => (
                      <span key={tag} className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                        {tag}
                        <button type="button" onClick={() => setCurrentTags(prev => prev.filter(t => t !== tag))}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTag.trim()) {
                          e.preventDefault();
                          if (!currentTags.includes(newTag.trim())) {
                            setCurrentTags(prev => [...prev, newTag.trim()]);
                          }
                          setNewTag('');
                        }
                      }}
                      className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        if (newTag.trim() && !currentTags.includes(newTag.trim())) {
                          setCurrentTags(prev => [...prev, newTag.trim()]);
                          setNewTag('');
                        }
                      }}
                      className="bg-slate-100 p-2 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="hidden">
                  <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">Choose Color</label>
                  <div className="flex gap-3">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => editingNote ? setEditingNote({...editingNote, color}) : setSelectedColor(color)}
                        className={`w-10 h-10 rounded-xl ${color} transition-transform hover:scale-110 ${
                          (editingNote ? editingNote.color === color : selectedColor === color) ? 'ring-2 ring-slate-900 ring-offset-2 scale-110' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={editingNote ? saveEdit : addNote}
                  className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all active:scale-[0.98] mt-4"
                >
                  {editingNote ? 'Save Changes' : 'Create Note'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Edit Modal */}
      <AnimatePresence>
        {isEditingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2rem] p-6 md:p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Edit Profile</h3>
                <button onClick={() => setIsEditingProfile(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col items-center mb-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 shadow-inner mb-4">
                    <img src={tempProfile.pic} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <Plus className="w-6 h-6" />
                    <input type="file" accept="image/*" onChange={handleProfilePicChange} className="hidden" />
                  </label>
                </div>
                <p className="text-xs text-slate-400">Click image to change</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Full Name</label>
                  <input 
                    type="text"
                    value={tempProfile.name}
                    onChange={(e) => setTempProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <button
                  onClick={saveProfile}
                  className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                  Save Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Note Details Modal */}
      <AnimatePresence>
        {viewingNote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`${viewingNote.color} rounded-[2rem] p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden`}
            >
              <button 
                onClick={() => setViewingNote(null)}
                className="absolute top-6 right-6 p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-900/40 uppercase tracking-widest">Entry Date</span>
                    <span className="text-sm font-bold text-slate-900/60">{formatDate(viewingNote.createdAt)} {formatTime(viewingNote.createdAt)}</span>
                  </div>
                  {viewingNote.completed && viewingNote.completedAt && (
                    <div className="flex flex-col border-l border-black/10 pl-4">
                      <span className="text-[10px] font-bold text-green-700/40 uppercase tracking-widest">Completion Date</span>
                      <span className="text-sm font-bold text-green-700/60">{formatDate(viewingNote.completedAt)} {formatTime(viewingNote.completedAt)}</span>
                    </div>
                  )}
                </div>
                <h2 className={`text-3xl font-black text-slate-900 mb-6 ${viewingNote.completed ? 'line-through opacity-50' : ''}`}>
                  {viewingNote.title}
                </h2>
                
                {viewingNote.tags && viewingNote.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {viewingNote.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-black/5 rounded-xl text-xs font-bold text-black/40 uppercase tracking-widest">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="h-px w-full bg-black/5 mb-6"></div>
                <p className={`text-lg text-slate-800 leading-relaxed whitespace-pre-wrap ${viewingNote.completed ? 'line-through opacity-50' : ''}`}>
                  {viewingNote.text}
                </p>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-black/5">
                <div className="flex gap-2">
                  <button 
                    onClick={() => { archiveNote(viewingNote.id); setViewingNote(null); }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/40 hover:bg-white/60 rounded-xl text-sm font-bold transition-all"
                  >
                    <Archive className="w-4 h-4" />
                    {viewingNote.isArchived ? 'Unarchive' : 'Archive'}
                  </button>
                  <button 
                    onClick={() => { setEditingNote(viewingNote); setViewingNote(null); }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/40 hover:bg-white/60 rounded-xl text-sm font-bold transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                </div>
                <button 
                  onClick={() => { toggleComplete(viewingNote.id); setViewingNote(null); }}
                  className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${viewingNote.completed ? 'bg-slate-900 text-white' : 'bg-white/80 text-slate-900 hover:bg-white'}`}
                >
                  {viewingNote.completed ? 'Mark Incomplete' : 'Mark Completed'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2rem] p-6 md:p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Delete Note?</h3>
              <p className="text-slate-500 mb-8 text-sm">This action cannot be undone. Are you sure you want to delete this note?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteNote(showDeleteConfirm)}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
