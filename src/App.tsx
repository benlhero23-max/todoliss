import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  CalendarEvent, 
  DailyNote, 
  Assignee, 
  ViewMode, 
  LineNotificationConfig, 
  CloudBackupState,
  ShiftHandover,
  ShiftSwap,
  LabAnnouncement
} from './types/calendar';
import { DEFAULT_ASSIGNEES } from './data/defaultAssignees';
import { INITIAL_SAMPLE_EVENTS, INITIAL_SAMPLE_NOTES } from './data/sampleEvents';
import { INITIAL_SAMPLE_HANDOVERS, INITIAL_SAMPLE_SWAPS, INITIAL_SAMPLE_ANNOUNCEMENTS } from './data/sampleShifts';
import { DEFAULT_LINE_CONFIG, getTomorrowEvents, sendLineNotification, sendCustomLineMessage } from './utils/lineNotify';
import { 
  STORAGE_KEYS, 
  loadStoredData, 
  saveStoredData, 
  initialBackupState 
} from './utils/cloudStorage';
import { toISODateString, addDays, formatThaiDate } from './utils/thaiDate';

// Components
import { Navbar } from './components/Navbar';
import { CalendarHeader } from './components/CalendarHeader';
import { MonthView } from './components/MonthView';
import { WeekView } from './components/WeekView';
import { DateDetailModal } from './components/DateDetailModal';
import { ShiftHandoverModal } from './components/ShiftHandoverModal';
import { LabAnnouncementBanner } from './components/LabAnnouncementBanner';
import { EventFormModal } from './components/EventFormModal';
import { LineNotificationModal } from './components/LineNotificationModal';
import { GoogleCalendarModal } from './components/GoogleCalendarModal';
import { CloudBackupModal } from './components/CloudBackupModal';
import { AssigneeManagerModal } from './components/AssigneeManagerModal';
import { AuthModal } from './components/AuthModal';
import { AccessDeniedModal } from './components/AccessDeniedModal';
import { Bell, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Current calendar browsing date (defaults to September 19, 2026 based on metadata)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date('2026-09-19T00:00:00'));
  const [todayIso] = useState<string>(() => '2026-09-19');
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Core data states
  const [events, setEvents] = useState<CalendarEvent[]>(() => 
    loadStoredData<CalendarEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_SAMPLE_EVENTS)
  );
  const [notes, setNotes] = useState<DailyNote[]>(() => 
    loadStoredData<DailyNote[]>(STORAGE_KEYS.NOTES, INITIAL_SAMPLE_NOTES)
  );
  const [handovers, setHandovers] = useState<ShiftHandover[]>(() =>
    loadStoredData<ShiftHandover[]>(STORAGE_KEYS.HANDOVERS, INITIAL_SAMPLE_HANDOVERS)
  );
  const [swaps, setSwaps] = useState<ShiftSwap[]>(() =>
    loadStoredData<ShiftSwap[]>(STORAGE_KEYS.SWAPS, INITIAL_SAMPLE_SWAPS)
  );
  const [announcements, setAnnouncements] = useState<LabAnnouncement[]>(() =>
    loadStoredData<LabAnnouncement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_SAMPLE_ANNOUNCEMENTS)
  );
  const [assignees, setAssignees] = useState<Assignee[]>(() => 
    loadStoredData<Assignee[]>(STORAGE_KEYS.ASSIGNEES, DEFAULT_ASSIGNEES)
  );
  const [lineConfig, setLineConfig] = useState<LineNotificationConfig>(() => 
    loadStoredData<LineNotificationConfig>(STORAGE_KEYS.LINE_CONFIG, DEFAULT_LINE_CONFIG)
  );
  const [cloudState, setCloudState] = useState<CloudBackupState>(() => 
    loadStoredData<CloudBackupState>(STORAGE_KEYS.CLOUD_BACKUP, initialBackupState)
  );

  // Authentication & Current User State (PIN verification system)
  const [currentUser, setCurrentUser] = useState<Assignee | null>(() => 
    loadStoredData<Assignee | null>(STORAGE_KEYS.CURRENT_USER, null)
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalContext, setAuthModalContext] = useState('');
  const [authModalCallback, setAuthModalCallback] = useState<((user?: Assignee) => void) | null>(null);

  // Access Control / Permission Denied Modal
  const [isAccessDeniedOpen, setIsAccessDeniedOpen] = useState(false);
  const [accessDeniedEvent, setAccessDeniedEvent] = useState<CalendarEvent | null>(null);
  const [accessDeniedAction, setAccessDeniedAction] = useState<'edit' | 'delete'>('edit');

  // Filters & Searching
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Modal UI States
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>('2026-09-19');
  const [isDateDetailOpen, setIsDateDetailOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);
  const [isGCalModalOpen, setIsGCalModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-save to Local Storage & trigger simulated Cloud sync timestamp
  useEffect(() => {
    saveStoredData(STORAGE_KEYS.EVENTS, events);
    saveStoredData(STORAGE_KEYS.NOTES, notes);
    saveStoredData(STORAGE_KEYS.HANDOVERS, handovers);
    saveStoredData(STORAGE_KEYS.SWAPS, swaps);
    saveStoredData(STORAGE_KEYS.ANNOUNCEMENTS, announcements);
    saveStoredData(STORAGE_KEYS.ASSIGNEES, assignees);
    saveStoredData(STORAGE_KEYS.LINE_CONFIG, lineConfig);

    const updatedCloudState: CloudBackupState = {
      ...cloudState,
      lastBackupTime: new Date().toISOString(),
      syncStatus: 'synced',
      backupVersion: cloudState.backupVersion + 1
    };
    setCloudState(updatedCloudState);
    saveStoredData(STORAGE_KEYS.CLOUD_BACKUP, updatedCloudState);
  }, [events, notes, handovers, swaps, announcements, assignees, lineConfig]);

  // Count pending shift handovers and swaps needing acknowledgment
  const pendingShiftCount = useMemo(() => {
    const pendingH = handovers.filter(h => h.status === 'pending').length;
    const pendingS = swaps.filter(s => s.status === 'pending').length;
    return pendingH + pendingS;
  }, [handovers, swaps]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Assignee filter
      if (selectedAssigneeId && evt.assigneeId !== selectedAssigneeId) {
        return false;
      }
      // Category filter
      if (selectedCategory && evt.category !== selectedCategory) {
        return false;
      }
      // Search term filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = evt.title.toLowerCase().includes(term);
        const matchesLocation = evt.location?.toLowerCase().includes(term);
        const matchesDesc = evt.description?.toLowerCase().includes(term);
        return matchesTitle || matchesLocation || matchesDesc;
      }
      return true;
    });
  }, [events, selectedAssigneeId, selectedCategory, searchTerm]);

  // Tomorrow events count for 16:00 LINE Alert
  const { tomorrowEvents } = useMemo(() => {
    return getTomorrowEvents(todayIso, events);
  }, [todayIso, events]);

  // Total events in current active month
  const totalEventsInMonth = useMemo(() => {
    const curYear = currentDate.getFullYear();
    const curMonth = currentDate.getMonth();
    return events.filter(e => {
      const parts = e.date.split('-');
      return parseInt(parts[0], 10) === curYear && (parseInt(parts[1], 10) - 1) === curMonth;
    }).length;
  }, [events, currentDate]);

  // Calendar Navigation Handlers
  const handlePrev = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() - 1);
      } else {
        d.setDate(d.getDate() - 7);
      }
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() + 1);
      } else {
        d.setDate(d.getDate() + 7);
      }
      return d;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date(todayIso + 'T00:00:00'));
  };

  // Clicking a date opens the comprehensive single-window activity drawer
  const handleSelectDate = (dateIso: string) => {
    setSelectedDateIso(dateIso);
    setIsDateDetailOpen(true);
  };

  // Authentication & Session Handlers
  const handleLogin = (user: Assignee) => {
    setCurrentUser(user);
    saveStoredData(STORAGE_KEYS.CURRENT_USER, user);
    showToast(`เข้าสู่ระบบสำเร็จ: ${user.name} (${user.isAdmin ? 'ผู้ดูแลระบบ Admin' : 'เจ้าหน้าที่'})`);
    if (authModalCallback) {
      const cb = authModalCallback;
      setAuthModalCallback(null);
      cb(user);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    saveStoredData(STORAGE_KEYS.CURRENT_USER, null);
    showToast('ออกจากระบบเรียบร้อยแล้ว');
  };

  const handleUpdateAssigneePin = (assigneeId: string, newPin: string) => {
    const updated = assignees.map(a => a.id === assigneeId ? { ...a, pin: newPin } : a);
    setAssignees(updated);
    saveStoredData(STORAGE_KEYS.ASSIGNEES, updated);
    if (currentUser && currentUser.id === assigneeId) {
      const updatedUser = { ...currentUser, pin: newPin };
      setCurrentUser(updatedUser);
      saveStoredData(STORAGE_KEYS.CURRENT_USER, updatedUser);
    }
    showToast('เปลี่ยนรหัสผ่าน PIN เรียบร้อยแล้ว');
  };

  const requestAuth = (contextMessage?: string, onAuthenticated?: (user?: Assignee) => void) => {
    setAuthModalContext(contextMessage || 'กรุณาเลือกผู้ใช้งานและใส่รหัส PIN เพื่อดำเนินการ');
    setAuthModalCallback(() => onAuthenticated || null);
    setIsAuthModalOpen(true);
  };

  // Event handlers with authorization logic
  const handleOpenNewEvent = (dateIso?: string) => {
    if (!currentUser) {
      requestAuth('เพื่อเพิ่มนัดหมายกิจกรรมใหม่', () => {
        setEditingEvent(null);
        setSelectedDateIso(dateIso || todayIso);
        setIsEventFormOpen(true);
      });
      return;
    }
    setEditingEvent(null);
    setSelectedDateIso(dateIso || todayIso);
    setIsEventFormOpen(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedDateIso(event.date);
    setIsDateDetailOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent, overrideUser?: Assignee | null) => {
    const user = overrideUser !== undefined ? overrideUser : currentUser;
    if (!user) {
      requestAuth(`เพื่อแก้ไขกิจกรรม "${event.title}"`, (authenticatedUser) => handleEditEvent(event, authenticatedUser));
      return;
    }
    const isOwner = user.id === event.assigneeId;
    const isAdmin = user.isAdmin || false;
    if (!isOwner && !isAdmin) {
      setAccessDeniedEvent(event);
      setAccessDeniedAction('edit');
      setIsAccessDeniedOpen(true);
      return;
    }
    setEditingEvent(event);
    setIsDateDetailOpen(false);
    setIsEventFormOpen(true);
  };

  const handleSaveEvent = (eventData: Omit<CalendarEvent, 'id' | 'createdAt'>, eventId?: string) => {
    if (!currentUser) {
      requestAuth('เพื่อบันทึกกิจกรรม');
      return;
    }

    if (eventId) {
      const existing = events.find(e => e.id === eventId);
      if (existing) {
        const isOwner = currentUser.id === existing.assigneeId;
        const isAdmin = currentUser.isAdmin || false;
        if (!isOwner && !isAdmin) {
          setAccessDeniedEvent(existing);
          setAccessDeniedAction('edit');
          setIsAccessDeniedOpen(true);
          return;
        }
      }
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...eventData } : e));
      showToast('แก้ไขกิจกรรมและสำรองข้อมูลขึ้นคลาวด์เรียบร้อย');
    } else {
      // Non-admins can only create events assigned to themselves
      const effectiveAssigneeId = currentUser.isAdmin ? eventData.assigneeId : currentUser.id;
      const newEvent: CalendarEvent = {
        ...eventData,
        assigneeId: effectiveAssigneeId,
        id: `evt-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      setEvents(prev => [...prev, newEvent]);
      showToast('เพิ่มนัดหมายกิจกรรมและสำรองข้อมูลเรียบร้อย');
    }
  };

  const handleDeleteEvent = (eventId: string, overrideUser?: Assignee | null) => {
    const evt = events.find(e => e.id === eventId);
    if (!evt) return;

    const user = overrideUser !== undefined ? overrideUser : currentUser;

    if (!user) {
      requestAuth(`เพื่อลบกิจกรรม "${evt.title}"`, (authenticatedUser) => handleDeleteEvent(eventId, authenticatedUser));
      return;
    }

    const isOwner = user.id === evt.assigneeId;
    const isAdmin = user.isAdmin || false;
    if (!isOwner && !isAdmin) {
      setAccessDeniedEvent(evt);
      setAccessDeniedAction('delete');
      setIsAccessDeniedOpen(true);
      return;
    }

    setEvents(prev => prev.filter(e => e.id !== eventId));
    showToast(`ลบกิจกรรม "${evt.title}" เรียบร้อยแล้ว`);
  };

  // Daily Notes handlers (Unlimited notes per day)
  const handleAddNote = (noteData: Omit<DailyNote, 'id' | 'createdAt'>) => {
    const newNote: DailyNote = {
      ...noteData,
      id: `note-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setNotes(prev => [...prev, newNote]);
    showToast('บันทึกย่อประจำวันเรียบร้อยแล้ว');
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    showToast('ลบบันทึกย่อเรียบร้อย');
  };

  const handleToggleNoteComplete = (noteId: string) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, isCompleted: !n.isCompleted } : n));
  };

  // Shift Handover Handlers
  const handleAddHandover = (handoverData: Omit<ShiftHandover, 'id' | 'createdAt' | 'status'>) => {
    const newHandover: ShiftHandover = {
      ...handoverData,
      id: `handover-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setHandovers(prev => [newHandover, ...prev]);
    showToast('บันทึกการส่งมอบเวรเรียบร้อย รอผู้รับผิดชอบถัดไปยืนยันรับทราบ');
  };

  const handleAcknowledgeHandover = (id: string, note?: string) => {
    const ackName = currentUser?.name || 'ผู้รับผิดชอบต่อ';
    setHandovers(prev => prev.map(h => {
      if (h.id === id) {
        return {
          ...h,
          status: 'acknowledged',
          acknowledgedBy: ackName,
          acknowledgedByName: ackName,
          acknowledgedByAssigneeId: currentUser?.id,
          acknowledgedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          acknowledgementNote: note || h.acknowledgementNote || h.acknowledgmentNote,
          acknowledgmentNote: note || h.acknowledgmentNote || h.acknowledgementNote
        };
      }
      return h;
    }));
    showToast(`ยืนยันรับทราบการส่งเวรเรียบร้อยแล้ว`);
  };

  const handleDeleteHandover = (id: string) => {
    setHandovers(prev => prev.filter(h => h.id !== id));
    showToast('ลบบันทึกการส่งมอบเวรเรียบร้อย');
  };

  // Shift Swap Handlers
  const handleAddSwap = (swapData: Omit<ShiftSwap, 'id' | 'createdAt' | 'status'>) => {
    const newSwap: ShiftSwap = {
      ...swapData,
      id: `swap-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setSwaps(prev => [newSwap, ...prev]);
    showToast('สร้างคำขอแลกเวรเรียบร้อย รอผู้รับผิดชอบปลายทางยืนยันรับทราบ');
  };

  const handleAcknowledgeSwap = (id: string, accepted: boolean, note?: string) => {
    setSwaps(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          status: accepted ? 'approved' : 'rejected',
          respondedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          responseNote: note || s.responseNote
        };
      }
      return s;
    }));
    showToast(accepted ? 'ยืนยันตกลงแลกเวร & รับทราบเรียบร้อย' : 'ปฏิเสธคำขอแลกเวรเรียบร้อย');
  };

  const handleDeleteSwap = (id: string) => {
    setSwaps(prev => prev.filter(s => s.id !== id));
    showToast('ลบรายการคำขอแลกเวรเรียบร้อย');
  };

  // Lab Announcement Handlers (ประกาศแจ้งในปฏิทิน)
  const handleAddAnnouncement = (ann: Omit<LabAnnouncement, 'id'>) => {
    const newAnn: LabAnnouncement = {
      ...ann,
      id: 'ann-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    showToast(`เพิ่มประกาศแล็บใหม่เรียบร้อยแล้ว: "${newAnn.title}"`);
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    showToast('ลบประกาศเรียบร้อยแล้ว');
  };

  // Custom targeted LINE message handler (รายบุคคล หรือ กลุ่ม)
  const handleSendCustomLineNotification = async (
    message: string, 
    recipient?: { type: 'group' | 'individual'; name?: string; destinationId?: string }
  ) => {
    const res = await sendCustomLineMessage(lineConfig, message, recipient);
    showToast(`LINE (${recipient?.type === 'individual' ? `ส่วนตัว: ${recipient?.name || ''}` : 'กลุ่ม'}): ${res.statusText}`);
  };

  // Instant LINE alert send for a specific date
  const handleSendLineAlertForDate = async (targetDate: string) => {
    const dayEvents = events.filter(e => e.date === targetDate);
    const res = await sendLineNotification(lineConfig, targetDate, dayEvents, assignees);
    showToast(`LINE แจ้งเตือน: ${res.statusText}`);
  };

  // Reset to defaults
  const handleResetDefaults = () => {
    setEvents(INITIAL_SAMPLE_EVENTS);
    setNotes(INITIAL_SAMPLE_NOTES);
    setHandovers(INITIAL_SAMPLE_HANDOVERS);
    setSwaps(INITIAL_SAMPLE_SWAPS);
    setAssignees(DEFAULT_ASSIGNEES);
    setLineConfig(DEFAULT_LINE_CONFIG);
    showToast('รีเซ็ตข้อมูลตัวอย่างห้องปฏิบัติการเรียบร้อย');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      {/* Top Navigation Bar */}
      <Navbar
        todayIso={todayIso}
        cloudState={cloudState}
        currentUser={currentUser}
        onOpenAuthModal={() => {
          setAuthModalContext('เข้าสู่ระบบเพื่อยืนยันตัวตนจัดการกิจกรรม');
          setAuthModalCallback(null);
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onOpenNewEvent={() => handleOpenNewEvent(todayIso)}
        onOpenLineModal={() => setIsLineModalOpen(true)}
        onOpenGCalModal={() => setIsGCalModalOpen(true)}
        onOpenCloudModal={() => setIsCloudModalOpen(true)}
        onOpenAssigneeModal={() => setIsAssigneeModalOpen(true)}
        onOpenShiftModal={() => setIsShiftModalOpen(true)}
        tomorrowEventCount={tomorrowEvents.length}
        pendingShiftCount={pendingShiftCount}
      />

      {/* Main Single-Window Workstation Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 flex flex-col">
        {/* Toast alert notice */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium animate-in slide-in-from-bottom-5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 16:00 Advance Alert Banner Notice */}
        <div className="mb-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-teal-200/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span>ระบบเตือนล่วงหน้า 1 วัน เวลา 16.00 น. ไปในกลุ่มไลน์</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-semibold">
                  LINE API Active
                </span>
              </div>
              <p className="text-slate-600 text-[11px] mt-0.5">
                มี {tomorrowEvents.length} กิจกรรมที่พร้อมส่งแจ้งเตือนสำหรับวันพรุ่งนี้ ({formatThaiDate(addDays(todayIso, 1))})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLineModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors shadow-xs"
            >
              ดูตัวอย่าง & ส่งข้อความ
            </button>
          </div>
        </div>

        {/* Lab Announcements & Bulletin Channel (ช่องทางประกาศแจ้งในปฏิทินห้องแล็บ) */}
        <LabAnnouncementBanner
          announcements={announcements}
          assignees={assignees}
          currentUser={currentUser}
          lineConfig={lineConfig}
          onAddAnnouncement={handleAddAnnouncement}
          onDeleteAnnouncement={handleDeleteAnnouncement}
          onSendLineNotify={handleSendCustomLineNotification}
          onRequestAuth={requestAuth}
        />

        {/* Unified Calendar Container */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[680px]">
          {/* Calendar Controls & Filter Header */}
          <CalendarHeader
            currentDate={currentDate}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onPrev={handlePrev}
            onNext={handleNext}
            onToday={handleToday}
            assignees={assignees}
            selectedAssigneeId={selectedAssigneeId}
            onSelectAssignee={setSelectedAssigneeId}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            totalEventsInMonth={totalEventsInMonth}
          />

          {/* Views */}
          {viewMode === 'month' ? (
            <MonthView
              currentDate={currentDate}
              events={filteredEvents}
              notes={notes}
              handovers={handovers}
              swaps={swaps}
              assignees={assignees}
              todayIso={todayIso}
              onSelectDate={handleSelectDate}
              onSelectEvent={handleSelectEvent}
            />
          ) : (
            <WeekView
              currentDate={currentDate}
              events={filteredEvents}
              notes={notes}
              assignees={assignees}
              todayIso={todayIso}
              onSelectDate={handleSelectDate}
              onSelectEvent={handleSelectEvent}
              onAddNewEventOnDate={handleOpenNewEvent}
            />
          )}

          {/* Quick instructions bar */}
          <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-3">
              <span>💡 <strong>คำแนะนำ:</strong> คลิกที่ช่องวันที่เพื่อดูรายละเอียด, ส่งเวร-แลกเวร, เพิ่มนัดหมาย หรือจดบันทึกย่อประจำวันได้</span>
            </div>
            <div className="flex items-center gap-3 font-medium">
              <span className="flex items-center gap-1 text-teal-700">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                โหมดหน้าต่างเดียว (Single Window)
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600">พ.ศ. 2569</span>
            </div>
          </div>
        </div>
      </main>

      {/* Date Detail Single-Window Modal (คลิกที่ช่องวันที่นั้นๆ) */}
      <DateDetailModal
        isOpen={isDateDetailOpen}
        onClose={() => setIsDateDetailOpen(false)}
        dateIso={selectedDateIso}
        events={events}
        notes={notes}
        handovers={handovers}
        swaps={swaps}
        assignees={assignees}
        currentUser={currentUser}
        onAddNewEvent={(date) => {
          setIsDateDetailOpen(false);
          handleOpenNewEvent(date);
        }}
        onEditEvent={handleEditEvent}
        onDeleteEvent={handleDeleteEvent}
        onAddNote={handleAddNote}
        onDeleteNote={handleDeleteNote}
        onToggleNoteComplete={handleToggleNoteComplete}
        onAddHandover={handleAddHandover}
        onAcknowledgeHandover={handleAcknowledgeHandover}
        onDeleteHandover={handleDeleteHandover}
        onAddSwap={handleAddSwap}
        onAcknowledgeSwap={handleAcknowledgeSwap}
        onDeleteSwap={handleDeleteSwap}
        onSendLineAlertForDate={handleSendLineAlertForDate}
        onRequestAuth={requestAuth}
        onShowAccessDenied={(evt, action) => {
          setAccessDeniedEvent(evt);
          setAccessDeniedAction(action);
          setIsAccessDeniedOpen(true);
        }}
      />

      {/* Standalone Shift Handover & Swap Manager Modal (เปิดจากปุ่มแถบบน) */}
      <ShiftHandoverModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        handovers={handovers}
        swaps={swaps}
        assignees={assignees}
        currentUser={currentUser}
        defaultDate={selectedDateIso || todayIso}
        onAddHandover={handleAddHandover}
        onAcknowledgeHandover={handleAcknowledgeHandover}
        onDeleteHandover={handleDeleteHandover}
        onAddSwap={handleAddSwap}
        onAcknowledgeSwap={handleAcknowledgeSwap}
        onDeleteSwap={handleDeleteSwap}
        onRequestAuth={requestAuth}
        onSendLineNotify={handleSendCustomLineNotification}
      />

      {/* Add / Edit Event Form Modal */}
      <EventFormModal
        isOpen={isEventFormOpen}
        onClose={() => setIsEventFormOpen(false)}
        onSave={handleSaveEvent}
        initialDate={selectedDateIso || todayIso}
        editingEvent={editingEvent}
        assignees={assignees}
        currentUser={currentUser}
      />

      {/* LINE Notification Modal (16:00 alert preview, token setup & test dispatch) */}
      <LineNotificationModal
        isOpen={isLineModalOpen}
        onClose={() => setIsLineModalOpen(false)}
        config={lineConfig}
        onSaveConfig={(updated) => {
          setLineConfig(updated);
          showToast('บันทึกการตั้งค่า LINE สำเร็จ');
        }}
        todayIso={todayIso}
        events={events}
        assignees={assignees}
      />

      {/* Google Calendar Modal (1-Click Sync & .ICS Download) */}
      <GoogleCalendarModal
        isOpen={isGCalModalOpen}
        onClose={() => setIsGCalModalOpen(false)}
        events={events}
        assignees={assignees}
      />

      {/* Cloud Auto-Backup & Data Recovery Modal */}
      <CloudBackupModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        cloudState={cloudState}
        events={events}
        notes={notes}
        assignees={assignees}
        lineConfig={lineConfig}
        handovers={handovers}
        swaps={swaps}
        onSyncNow={() => {
          const updated: CloudBackupState = {
            ...cloudState,
            lastBackupTime: new Date().toISOString(),
            syncStatus: 'synced',
            backupVersion: cloudState.backupVersion + 1
          };
          setCloudState(updated);
          saveStoredData(STORAGE_KEYS.CLOUD_BACKUP, updated);
        }}
        onRestoreData={({ events: newEvents, notes: newNotes, assignees: newAssignees, lineConfig: newLineConfig, handovers: newHandovers, swaps: newSwaps }) => {
          setEvents(newEvents);
          if (newNotes) setNotes(newNotes);
          if (newAssignees) setAssignees(newAssignees);
          if (newLineConfig) setLineConfig(newLineConfig);
          if (newHandovers) setHandovers(newHandovers);
          if (newSwaps) setSwaps(newSwaps);
          showToast('กู้คืนข้อมูลสำเร็จ');
        }}
        onResetDefaults={handleResetDefaults}
      />

      {/* Assignee & Color Tag Manager Modal */}
      <AssigneeManagerModal
        isOpen={isAssigneeModalOpen}
        onClose={() => setIsAssigneeModalOpen(false)}
        assignees={assignees}
        onSaveAssignees={(updated) => {
          setAssignees(updated);
          showToast('บันทึกข้อมูลผู้รับผิดชอบและแถบสีเรียบร้อย');
        }}
        events={events}
      />

      {/* Authentication & PIN Verification Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        assignees={assignees}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onUpdateUserPin={handleUpdateAssigneePin}
        actionContextMessage={authModalContext}
      />

      {/* Access Denied Warning Modal */}
      <AccessDeniedModal
        isOpen={isAccessDeniedOpen}
        onClose={() => setIsAccessDeniedOpen(false)}
        event={accessDeniedEvent}
        eventOwner={assignees.find(a => a.id === accessDeniedEvent?.assigneeId)}
        currentUser={currentUser}
        actionType={accessDeniedAction}
        onSwitchToAdmin={() => {
          setIsAccessDeniedOpen(false);
          setAuthModalContext('กรุณาเลือกผู้ดูแลระบบ (Admin) เพื่อเข้าสู่ระบบและจัดการกิจกรรมของผู้อื่น');
          setIsAuthModalOpen(true);
        }}
      />
    </div>
  );
}
