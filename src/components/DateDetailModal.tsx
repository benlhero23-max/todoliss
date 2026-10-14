import React, { useState } from 'react';
import { 
  CalendarEvent, 
  DailyNote, 
  Assignee, 
  ShiftHandover, 
  ShiftSwap, 
  ShiftType, 
  ShiftHandoverChecklist 
} from '../types/calendar';
import { formatThaiLongWithDay } from '../utils/thaiDate';
import { getThaiHoliday } from '../data/thaiHolidays';
import { createGoogleCalendarUrl } from '../utils/googleCalendar';
import { 
  X, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Trash2, 
  Edit3, 
  Share2, 
  FileText, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  Check,
  Lock,
  ShieldCheck,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  CheckSquare,
  Square
} from 'lucide-react';
import { LAB_CATEGORY_LABELS } from '../data/defaultAssignees';

interface DateDetailModalProps {
  dateIso: string | null;
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  notes: DailyNote[];
  handovers?: ShiftHandover[];
  swaps?: ShiftSwap[];
  assignees: Assignee[];
  currentUser: Assignee | null;
  onAddNewEvent: (dateIso: string) => void;
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onAddNote: (note: Omit<DailyNote, 'id' | 'createdAt'>) => void;
  onDeleteNote: (noteId: string) => void;
  onToggleNoteComplete: (noteId: string) => void;
  onAddHandover?: (handover: Omit<ShiftHandover, 'id' | 'createdAt'>) => void;
  onAcknowledgeHandover?: (handoverId: string, note?: string) => void;
  onDeleteHandover?: (handoverId: string) => void;
  onAddSwap?: (swap: Omit<ShiftSwap, 'id' | 'createdAt'>) => void;
  onAcknowledgeSwap?: (swapId: string, accepted: boolean, note?: string) => void;
  onDeleteSwap?: (swapId: string) => void;
  onSendLineAlertForDate: (dateIso: string) => void;
  onRequestAuth: (contextMessage?: string, onAuthenticated?: (user?: Assignee) => void) => void;
  onShowAccessDenied: (event: CalendarEvent, actionType: 'edit' | 'delete') => void;
}

export const DateDetailModal: React.FC<DateDetailModalProps> = ({
  dateIso,
  isOpen,
  onClose,
  events,
  notes,
  handovers = [],
  swaps = [],
  assignees,
  currentUser,
  onAddNewEvent,
  onEditEvent,
  onDeleteEvent,
  onAddNote,
  onDeleteNote,
  onToggleNoteComplete,
  onAddHandover,
  onAcknowledgeHandover,
  onDeleteHandover,
  onAddSwap,
  onAcknowledgeSwap,
  onDeleteSwap,
  onSendLineAlertForDate,
  onRequestAuth,
  onShowAccessDenied
}) => {
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteAuthor, setNewNoteAuthor] = useState(assignees[0]?.name || 'เจ้าหน้าที่แล็บ');
  const [newNoteCategory, setNewNoteCategory] = useState<DailyNote['category']>('general');
  const [activeTab, setActiveTab] = useState<'events' | 'notes' | 'shifts'>('events');
  const [eventPendingDelete, setEventPendingDelete] = useState<CalendarEvent | null>(null);

  // Shift Management State inside Date Modal
  const [shiftSubTab, setShiftSubTab] = useState<'handover' | 'swap'>('handover');
  const [showAddShiftForm, setShowAddShiftForm] = useState(false);
  const [handoverShiftType, setHandoverShiftType] = useState<ShiftType>('evening');
  const [handoverFromId, setHandoverFromId] = useState(currentUser?.id || assignees[0]?.id || '');
  const [handoverToId, setHandoverToId] = useState(assignees[1]?.id || assignees[0]?.id || '');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [handoverPendingTests, setHandoverPendingTests] = useState('');
  const [handoverEquipmentIssues, setHandoverEquipmentIssues] = useState('');
  const [handoverCriticalAlerts, setHandoverCriticalAlerts] = useState('');
  const [handoverChecklist, setHandoverChecklist] = useState<ShiftHandoverChecklist>({
    reagentsChecked: true,
    qcCompleted: true,
    maintenanceDone: true,
    wasteDisposed: true,
    criticalValuesReported: true,
  });

  // Swap Form State
  const [swapRequesterId, setSwapRequesterId] = useState(currentUser?.id || assignees[0]?.id || '');
  const [swapRequesterShift, setSwapRequesterShift] = useState<ShiftType>('morning');
  const [swapTargetId, setSwapTargetId] = useState(assignees[1]?.id || assignees[0]?.id || '');
  const [swapTargetDate, setSwapTargetDate] = useState(dateIso || '');
  const [swapTargetShift, setSwapTargetShift] = useState<ShiftType>('evening');
  const [swapReason, setSwapReason] = useState('');

  // Acknowledge note dialog
  const [ackTarget, setAckTarget] = useState<{
    type: 'handover' | 'swap';
    id: string;
    accepted?: boolean;
    toName: string;
    toId: string;
  } | null>(null);
  const [ackNoteText, setAckNoteText] = useState('');

  if (!isOpen || !dateIso) return null;

  const holiday = getThaiHoliday(dateIso);
  const formattedDate = formatThaiLongWithDay(dateIso);
  const dayEvents = events.filter(e => e.date === dateIso).sort((a, b) => 
    (a.startTime || '00:00').localeCompare(b.startTime || '00:00')
  );
  const dayNotes = notes.filter(n => n.date === dateIso);
  const dayHandovers = handovers.filter(h => h.date === dateIso);
  const daySwaps = swaps.filter(s => s.requesterDate === dateIso || s.targetDate === dateIso);
  const pendingHandovers = dayHandovers.filter(h => h.status === 'pending');
  const pendingSwaps = daySwaps.filter(s => s.status === 'pending');
  const totalDayPendingShifts = pendingHandovers.length + pendingSwaps.length;

  const assigneeMap = new Map(assignees.map(a => [a.id, a]));

  const handleAddNewEventClick = () => {
    if (!currentUser) {
      onRequestAuth('เพื่อเพิ่มนัดหมายกิจกรรมในวันนี้', () => onAddNewEvent(dateIso));
      return;
    }
    onAddNewEvent(dateIso);
  };

  const handleEditClick = (evt: CalendarEvent, canModify: boolean) => {
    if (!currentUser) {
      onRequestAuth(`เพื่อแก้ไขกิจกรรม "${evt.title}"`, () => onEditEvent(evt));
      return;
    }
    if (canModify) {
      onEditEvent(evt);
    } else {
      onShowAccessDenied(evt, 'edit');
    }
  };

  const handleDeleteClick = (evt: CalendarEvent, canModify: boolean) => {
    if (!currentUser) {
      onRequestAuth(`เพื่อยืนยันตัวตนเจ้าของกิจกรรมหรือ Admin ก่อนลบกิจกรรม "${evt.title}"`, (authenticatedUser) => {
        const user = authenticatedUser || currentUser;
        if (!user) return;
        const isUserOwner = user.id === evt.assigneeId;
        const isUserAdmin = user.isAdmin || false;
        if (isUserOwner || isUserAdmin) {
          setEventPendingDelete(evt);
        } else {
          onShowAccessDenied(evt, 'delete');
        }
      });
      return;
    }
    if (canModify) {
      setEventPendingDelete(evt);
    } else {
      onShowAccessDenied(evt, 'delete');
    }
  };

  const handleCreateHandoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddHandover) return;
    if (!currentUser) {
      onRequestAuth('เพื่อบันทึกการส่งมอบเวร', () => {
        submitHandoverData();
      });
      return;
    }
    submitHandoverData();
  };

  const submitHandoverData = () => {
    if (!onAddHandover || !dateIso) return;
    onAddHandover({
      date: dateIso,
      shift: handoverShiftType,
      department: 'ห้องปฏิบัติการทางการแพทย์ (Medical Laboratory)',
      fromAssigneeId: handoverFromId || currentUser?.id || assignees[0]?.id || '',
      toAssigneeId: handoverToId || assignees[1]?.id || assignees[0]?.id || '',
      status: 'pending',
      generalNotes: handoverNotes.trim(),
      pendingTests: handoverPendingTests.trim() || undefined,
      equipmentStatus: handoverEquipmentIssues.trim() || undefined,
      criticalAlerts: handoverCriticalAlerts.trim() || undefined,
      checklist: handoverChecklist,
    });
    setHandoverNotes('');
    setHandoverPendingTests('');
    setHandoverEquipmentIssues('');
    setHandoverCriticalAlerts('');
    setShowAddShiftForm(false);
  };

  const handleCreateSwapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddSwap) return;
    if (!currentUser) {
      onRequestAuth('เพื่อบันทึกการขอแลกเปลี่ยนเวร', () => {
        submitSwapData();
      });
      return;
    }
    submitSwapData();
  };

  const submitSwapData = () => {
    if (!onAddSwap || !dateIso) return;
    onAddSwap({
      requesterId: swapRequesterId || currentUser?.id || assignees[0]?.id || '',
      requestDate: dateIso,
      requesterDate: dateIso,
      requestShift: swapRequesterShift,
      requesterShift: swapRequesterShift,
      swapType: 'exchange',
      department: 'ห้องปฏิบัติการทางการแพทย์ (Medical Laboratory)',
      targetAssigneeId: swapTargetId || assignees[1]?.id || assignees[0]?.id || '',
      targetDate: swapTargetDate || dateIso,
      targetShift: swapTargetShift,
      reason: swapReason.trim() || 'มีความจำเป็นต้องแลกเวรปฏิบัติหน้าที่',
      status: 'pending',
    });
    setSwapReason('');
    setShowAddShiftForm(false);
  };

  const handleRequestHandoverAck = (handover: ShiftHandover) => {
    const toAssignee = assigneeMap.get(handover.toAssigneeId);
    const toName = toAssignee?.name || 'ผู้รับผิดชอบต่อ';

    const proceedWithAck = () => {
      setAckTarget({
        type: 'handover',
        id: handover.id,
        toName,
        toId: handover.toAssigneeId
      });
      setAckNoteText('');
    };

    if (!currentUser || (currentUser.id !== handover.toAssigneeId && !currentUser.isAdmin)) {
      onRequestAuth(`เพื่อยืนยันรับทราบการส่งเวรในฐานะ "${toName}" (หรือผู้ดูแลระบบ)`, (authedUser) => {
        const user = authedUser || currentUser;
        if (user && (user.id === handover.toAssigneeId || user.isAdmin)) {
          proceedWithAck();
        }
      });
      return;
    }

    proceedWithAck();
  };

  const handleRequestSwapAck = (swap: ShiftSwap, accept: boolean) => {
    const targetAssignee = assigneeMap.get(swap.targetAssigneeId);
    const toName = targetAssignee?.name || 'ผู้รับผิดชอบเวรที่ถูกขอแลก';

    const proceedWithAck = () => {
      setAckTarget({
        type: 'swap',
        id: swap.id,
        accepted: accept,
        toName,
        toId: swap.targetAssigneeId
      });
      setAckNoteText('');
    };

    if (!currentUser || (currentUser.id !== swap.targetAssigneeId && !currentUser.isAdmin)) {
      onRequestAuth(`เพื่อยืนยันการตอบรับ/ปฏิเสธแลกเวรในฐานะ "${toName}" (หรือผู้ดูแลระบบ)`, (authedUser) => {
        const user = authedUser || currentUser;
        if (user && (user.id === swap.targetAssigneeId || user.isAdmin)) {
          proceedWithAck();
        }
      });
      return;
    }

    proceedWithAck();
  };

  const handleConfirmAckModal = () => {
    if (!ackTarget) return;
    if (ackTarget.type === 'handover' && onAcknowledgeHandover) {
      onAcknowledgeHandover(ackTarget.id, ackNoteText.trim() || undefined);
    } else if (ackTarget.type === 'swap' && onAcknowledgeSwap) {
      onAcknowledgeSwap(ackTarget.id, ackTarget.accepted ?? true, ackNoteText.trim() || undefined);
    }
    setAckTarget(null);
    setAckNoteText('');
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    onAddNote({
      date: dateIso,
      content: newNoteText.trim(),
      author: newNoteAuthor,
      category: newNoteCategory,
      isCompleted: false
    });
    setNewNoteText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 to-slate-900 text-white p-4 sm:p-5 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-teal-500/30 text-teal-200 border border-teal-400/30">
                หน้าต่างจัดการกิจกรรม & บันทึกประจำวัน
              </span>
              {holiday && (
                <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                  holiday.isOfficialHoliday
                    ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                    : 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                }`}>
                  🎉 {holiday.name} {holiday.isOfficialHoliday ? '(วันหยุดราชการ)' : ''}
                </span>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mt-1 text-white tracking-tight">
              {formattedDate}
            </h3>
            {holiday?.description && (
              <p className="text-xs text-teal-200/80 mt-0.5">{holiday.description}</p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 px-5 bg-slate-50 gap-2">
          <div className="flex gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('events')}
              className={`py-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap ${
                activeTab === 'events'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>ตารางกิจกรรม ({dayEvents.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`py-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap ${
                activeTab === 'notes'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>บันทึกย่อ ({dayNotes.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('shifts')}
              className={`py-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap ${
                activeTab === 'shifts'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>ส่งเวร & แลกเวร ({dayHandovers.length + daySwaps.length})</span>
              {totalDayPendingShifts > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold animate-pulse">
                  รอรับทราบ {totalDayPendingShifts}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2 sm:pb-0">
            {activeTab === 'events' && (
              <>
                <button
                  onClick={() => onSendLineAlertForDate(dateIso)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition-colors"
                  title="ส่งสรุปกำหนดการวันนี้เข้ากลุ่ม LINE"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">แจ้งเตือน LINE</span>
                </button>
                <button
                  onClick={handleAddNewEventClick}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ เพิ่มกิจกรรม</span>
                </button>
              </>
            )}
            {activeTab === 'shifts' && (
              <button
                onClick={() => setShowAddShiftForm(!showAddShiftForm)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddShiftForm ? 'ปิดฟอร์ม' : '+ ส่งเวร / แลกเวร'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {activeTab === 'events' && (
            <div className="space-y-4">
              {dayEvents.length === 0 ? (
                <div className="p-10 text-center bg-white rounded-xl border border-dashed border-slate-200">
                  <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-slate-700">ยังไม่มีกิจกรรมที่กำหนดไว้ในวันนี้</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    คลิกปุ่ม "เพิ่มกิจกรรม" ด้านบนเพื่อเพิ่มตารางตรวจวิเคราะห์, สอบเทียบเครื่องมือ หรือการประชุม
                  </p>
                  <button
                    onClick={handleAddNewEventClick}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>เพิ่มกิจกรรมแรกของวัน</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {dayEvents.map((evt) => {
                    const assignee = assigneeMap.get(evt.assigneeId);
                    const catInfo = LAB_CATEGORY_LABELS[evt.category] || LAB_CATEGORY_LABELS.general;
                    const gcalUrl = createGoogleCalendarUrl(evt, assignee);
                    const isOwner = currentUser ? currentUser.id === evt.assigneeId : false;
                    const isAdmin = currentUser?.isAdmin || false;
                    const canModify = isOwner || isAdmin;

                    return (
                      <div
                        key={evt.id}
                        style={{
                          borderLeftColor: assignee?.color || '#0d9488',
                          borderLeftWidth: '5px'
                        }}
                        className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div className="space-y-1">
                            {/* Badges */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                                <Clock className="w-3.5 h-3.5 text-teal-600" />
                                <span>{evt.startTime} - {evt.endTime} น.</span>
                              </span>

                              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${catInfo.color}`}>
                                {catInfo.label}
                              </span>

                              {evt.priority === 'stat' && (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                                  STAT ด่วน
                                </span>
                              )}

                              {/* Auth & Role Status Badge */}
                              {currentUser && (
                                isOwner ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    <Check className="w-2.5 h-2.5" /> งานของคุณ (แก้ไขได้)
                                  </span>
                                ) : isAdmin ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                                    <ShieldCheck className="w-2.5 h-2.5" /> สิทธิ์ Admin (แก้ไขได้)
                                  </span>
                                ) : (
                                  <span 
                                    className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200" 
                                    title="งานของผู้อื่น: เฉพาะเจ้าของงาน หรือ Admin (นางสาวอังคณา / นายมณเฑียร) เท่านั้นที่สามารถแก้ไขได้"
                                  >
                                    <Lock className="w-2.5 h-2.5 text-slate-400" /> งานของผู้อื่น
                                  </span>
                                )
                              )}
                            </div>

                            {/* Title */}
                            <h4 className="text-base font-bold text-slate-900 pt-1">
                              {evt.title}
                            </h4>

                            {/* Location & Details */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span>{evt.location || 'ห้องปฏิบัติการกลาง'}</span>
                              </div>

                              {assignee && (
                                <div 
                                  style={{
                                    backgroundColor: assignee.bgColor,
                                    borderColor: assignee.borderColor,
                                    color: assignee.textColor
                                  }}
                                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold"
                                >
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: assignee.color }}
                                  />
                                  <span>{assignee.name}</span>
                                  {assignee.isAdmin && (
                                    <span className="text-[9px] px-1 py-0.1 rounded bg-indigo-100 text-indigo-800 font-bold">
                                      Admin
                                    </span>
                                  )}
                                  <span className="text-[10px] opacity-75 font-normal">({assignee.role})</span>
                                </div>
                              )}
                            </div>

                            {evt.description && (
                              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
                                {evt.description}
                              </p>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center sm:flex-col gap-1.5 shrink-0 pt-2 sm:pt-0">
                            {/* 1-Click Google Calendar Sync */}
                            <a
                              href={gcalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                              title="เพิ่มกิจกรรมนี้ลงใน Google Calendar ทันที"
                            >
                              <Share2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>ซิงค์ G-Cal</span>
                            </a>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEditClick(evt, canModify)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  canModify || !currentUser
                                    ? 'text-slate-500 hover:text-teal-700 hover:bg-teal-50'
                                    : 'text-slate-300 hover:text-rose-600 hover:bg-rose-50'
                                }`}
                                title={
                                  !currentUser
                                    ? 'คลิกเพื่อใส่รหัสยืนยันตัวตนก่อนแก้ไข'
                                    : canModify
                                      ? 'แก้ไขกิจกรรม'
                                      : 'เฉพาะเจ้าของงานหรือ Admin เท่านั้นที่แก้ไขได้ (คลิกเพื่อดู)'
                                }
                              >
                                {canModify || !currentUser ? (
                                  <Edit3 className="w-4 h-4" />
                                ) : (
                                  <div className="relative">
                                    <Edit3 className="w-4 h-4 opacity-40" />
                                    <Lock className="w-2.5 h-2.5 text-rose-500 absolute -bottom-1 -right-1" />
                                  </div>
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteClick(evt, canModify)}
                                className={`p-1.5 rounded-lg transition-all ${
                                  canModify
                                    ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-100/90 bg-rose-50 border border-rose-200/80 shadow-2xs'
                                    : !currentUser
                                      ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent'
                                      : 'text-slate-300 hover:text-rose-600 hover:bg-rose-50 border border-transparent opacity-60'
                                }`}
                                title={
                                  !currentUser
                                    ? 'คลิกเพื่อยืนยันตัวตนเจ้าของกิจกรรมหรือ Admin ก่อนลบ'
                                    : isOwner
                                      ? 'ลบกิจกรรมนี้ (ในฐานะเจ้าของงาน)'
                                      : isAdmin
                                        ? 'ลบกิจกรรมนี้ (ในฐานะ Admin)'
                                        : 'เฉพาะเจ้าของงานหรือ Admin เท่านั้นที่ลบได้ (คลิกเพื่อดู)'
                                }
                              >
                                {canModify || !currentUser ? (
                                  <Trash2 className="w-4 h-4" />
                                ) : (
                                  <div className="relative">
                                    <Trash2 className="w-4 h-4 opacity-40" />
                                    <Lock className="w-2.5 h-2.5 text-rose-500 absolute -bottom-1 -right-1" />
                                  </div>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              {/* Add Note Form */}
              <form onSubmit={handleCreateNote} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>เพิ่มบันทึกย่อประจำวัน (ไม่จำกัดจำนวนข้อความ)</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">บันทึกอัตโนมัติลงคลาวด์</span>
                </div>

                <textarea
                  rows={3}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="เขียนบันทึกย่อ เช่น ส่งมอบเวร, แจ้งเตือนน้ำยา Reagent, สถานะเครื่องมือชำรุด หรือข้อควรระวัง..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-y"
                />

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Author selector */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>ผู้บันทึก:</span>
                      <select
                        value={newNoteAuthor}
                        onChange={(e) => setNewNoteAuthor(e.target.value)}
                        className="text-xs py-1 px-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700"
                      >
                        {assignees.map(a => (
                          <option key={a.id} value={a.name}>{a.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Category selector */}
                    <div className="flex items-center gap-1 text-xs">
                      <span>ประเภท:</span>
                      <select
                        value={newNoteCategory}
                        onChange={(e) => setNewNoteCategory(e.target.value as any)}
                        className="text-xs py-1 px-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-medium"
                      >
                        <option value="general">บันทึกทั่วไป</option>
                        <option value="handover">ส่งมอบเวร (Handover)</option>
                        <option value="reagent">สต็อกน้ำยา (Reagent)</option>
                        <option value="maintenance">เครื่องมือ/ซ่อมบำรุง</option>
                        <option value="urgent">ข้อความด่วน (Urgent)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!newNoteText.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>บันทึกข้อความ</span>
                  </button>
                </div>
              </form>

              {/* Notes List */}
              <div className="space-y-2.5">
                {dayNotes.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-400">ยังไม่มีบันทึกย่อในวันนี้ คุณสามารถเพิ่มบันทึกได้ไม่จำกัดข้อความ</p>
                  </div>
                ) : (
                  dayNotes.map((note) => {
                    const catBg = 
                      note.category === 'urgent' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      note.category === 'handover' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      note.category === 'reagent' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      note.category === 'maintenance' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      'bg-slate-100 text-slate-700 border-slate-200';

                    return (
                      <div
                        key={note.id}
                        className={`p-3.5 rounded-xl border bg-white shadow-xs transition-all ${
                          note.isCompleted ? 'opacity-60 bg-slate-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onToggleNoteComplete(note.id)}
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                  note.isCompleted ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 hover:border-teal-500'
                                }`}
                              >
                                {note.isCompleted && <Check className="w-3 h-3" />}
                              </button>

                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${catBg}`}>
                                {note.category === 'handover' ? 'ส่งมอบเวร' :
                                 note.category === 'reagent' ? 'สต็อกน้ำยา' :
                                 note.category === 'maintenance' ? 'ซ่อมบำรุง' :
                                 note.category === 'urgent' ? 'ด่วน' : 'บันทึก'}
                              </span>

                              <span className="text-xs font-semibold text-slate-800">
                                {note.author}
                              </span>
                            </div>

                            <p className={`text-xs text-slate-700 whitespace-pre-wrap pl-6 ${
                              note.isCompleted ? 'line-through text-slate-400' : ''
                            }`}>
                              {note.content}
                            </p>
                          </div>

                          <button
                            onClick={() => onDeleteNote(note.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                            title="ลบบันทึกนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'shifts' && (
            <div className="space-y-4">
              {/* Sub-tab switcher */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShiftSubTab('handover')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      shiftSubTab === 'handover'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    บันทึกส่งมอบเวร ({dayHandovers.length})
                  </button>
                  <button
                    onClick={() => setShiftSubTab('swap')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      shiftSubTab === 'swap'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    การขอแลกเวร ({daySwaps.length})
                  </button>
                </div>

                <span className="text-xs text-slate-500 hidden sm:inline">
                  วันที่: {formattedDate}
                </span>
              </div>

              {/* Inline Form when showAddShiftForm is true */}
              {showAddShiftForm && (
                <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-sm space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-900">เพิ่มรายการใหม่:</span>
                      <button
                        type="button"
                        onClick={() => setShiftSubTab('handover')}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                          shiftSubTab === 'handover'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        ส่งมอบเวร
                      </button>
                      <button
                        type="button"
                        onClick={() => setShiftSubTab('swap')}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                          shiftSubTab === 'swap'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        ขอแลกเวร
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddShiftForm(false)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {shiftSubTab === 'handover' ? (
                    <form onSubmit={handleCreateHandoverSubmit} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">กะ/เวรปฏิบัติงาน</label>
                          <select
                            value={handoverShiftType}
                            onChange={(e) => setHandoverShiftType(e.target.value as ShiftType)}
                            className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                          >
                            <option value="morning">เวรเช้า (08:00 - 16:00)</option>
                            <option value="evening">เวรบ่าย (16:00 - 00:00)</option>
                            <option value="night">เวรดึก (00:00 - 08:00)</option>
                            <option value="oncall">เวร On-call / นอกเวลา</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">ผู้ส่งมอบเวร (เวรปัจจุบัน)</label>
                          <select
                            value={handoverFromId}
                            onChange={(e) => setHandoverFromId(e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                          >
                            {assignees.map(a => (
                              <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-indigo-700 mb-1">
                            ผู้รับมอบเวรต่อ <span className="text-rose-500 font-bold">*ต้องยืนยัน</span>
                          </label>
                          <select
                            value={handoverToId}
                            onChange={(e) => setHandoverToId(e.target.value)}
                            className="w-full text-xs rounded-lg border border-indigo-300 bg-indigo-50/50 p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-semibold text-indigo-900"
                          >
                            {assignees.map(a => (
                              <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Quality & Safety Checklists */}
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                        <span className="text-xs font-bold text-slate-700 block">
                          รายการตรวจสอบคุณภาพและความปลอดภัยก่อนส่งเวร:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={handoverChecklist.reagentsChecked}
                              onChange={(e) => setHandoverChecklist({...handoverChecklist, reagentsChecked: e.target.checked})}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>ตรวจเช็คระดับสต็อกน้ำยาเครื่องตรวจ</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={handoverChecklist.qcCompleted}
                              onChange={(e) => setHandoverChecklist({...handoverChecklist, qcCompleted: e.target.checked})}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>รัน QC เครื่องวิเคราะห์ครบและผ่านเกณฑ์</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={handoverChecklist.maintenanceDone}
                              onChange={(e) => setHandoverChecklist({...handoverChecklist, maintenanceDone: e.target.checked})}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>ล้าง/ซ่อมบำรุงประจำวัน (Daily Maintenance)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={handoverChecklist.criticalValuesReported}
                              onChange={(e) => setHandoverChecklist({...handoverChecklist, criticalValuesReported: e.target.checked})}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>โทรแจ้งค่าวิกฤต (Critical Value) ครบทุกราย</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={handoverChecklist.wasteDisposed}
                              onChange={(e) => setHandoverChecklist({...handoverChecklist, wasteDisposed: e.target.checked})}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>คัดแยกและทิ้งขยะติดเชื้อเรียบร้อย</span>
                          </label>
                        </div>
                      </div>

                      {/* Detail Textboxes */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-amber-800 mb-1">
                            สิ่งส่งตรวจค้างตรวจ / รอรีพีท (Pending Tests)
                          </label>
                          <input
                            type="text"
                            value={handoverPendingTests}
                            onChange={(e) => setHandoverPendingTests(e.target.value)}
                            placeholder="เช่น มี CBC ค้าง 2 รายการ รอเจาะซ้ำ..."
                            className="w-full text-xs rounded-lg border border-amber-300 p-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-rose-800 mb-1">
                            ค่าวิกฤต / เคสด่วนเฝ้าระวัง (Critical Alerts)
                          </label>
                          <input
                            type="text"
                            value={handoverCriticalAlerts}
                            onChange={(e) => setHandoverCriticalAlerts(e.target.value)}
                            placeholder="เช่น โทรแจ้ง K+ 6.8 หอผู้ป่วยอายุรกรรม..."
                            className="w-full text-xs rounded-lg border border-rose-300 p-2 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          บันทึกรายละเอียดการส่งมอบงาน & สรุปภาพรวม
                        </label>
                        <textarea
                          rows={2}
                          value={handoverNotes}
                          onChange={(e) => setHandoverNotes(e.target.value)}
                          placeholder="ระบุข้อความสรุปการส่งมอบเวร..."
                          className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddShiftForm(false)}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-xs"
                        >
                          บันทึกส่งมอบเวร
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleCreateSwapSubmit} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 space-y-2">
                          <span className="text-xs font-bold text-amber-900 block">เวรที่ต้องการขอแลก (ต้นทาง):</span>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">ผู้ขอแลก</label>
                            <select
                              value={swapRequesterId}
                              onChange={(e) => setSwapRequesterId(e.target.value)}
                              className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                            >
                              {assignees.map(a => (
                                <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">เวรเดิมของวันที่นี้</label>
                            <select
                              value={swapRequesterShift}
                              onChange={(e) => setSwapRequesterShift(e.target.value as ShiftType)}
                              className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                            >
                              <option value="morning">เวรเช้า (08:00 - 16:00)</option>
                              <option value="evening">เวรบ่าย (16:00 - 00:00)</option>
                              <option value="night">เวรดึก (00:00 - 08:00)</option>
                              <option value="oncall">เวร On-call</option>
                            </select>
                          </div>
                        </div>

                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 space-y-2">
                          <span className="text-xs font-bold text-indigo-900 block">เวรที่ขอแลกด้วย (ปลายทาง):</span>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">ผู้ที่ต้องการแลกด้วย</label>
                            <select
                              value={swapTargetId}
                              onChange={(e) => setSwapTargetId(e.target.value)}
                              className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white font-semibold text-indigo-900"
                            >
                              {assignees.map(a => (
                                <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">วันที่ต้องการเข้าแทน</label>
                              <input
                                type="date"
                                value={swapTargetDate}
                                onChange={(e) => setSwapTargetDate(e.target.value)}
                                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">เวรที่ต้องการเข้าแทน</label>
                              <select
                                value={swapTargetShift}
                                onChange={(e) => setSwapTargetShift(e.target.value as ShiftType)}
                                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                              >
                                <option value="morning">เวรเช้า</option>
                                <option value="evening">เวรบ่าย</option>
                                <option value="night">เวรดึก</option>
                                <option value="oncall">On-call</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">เหตุผลในการขอแลกเวร</label>
                        <input
                          type="text"
                          value={swapReason}
                          onChange={(e) => setSwapReason(e.target.value)}
                          placeholder="เช่น ติดอบรมภายนอก, ธุระส่วนตัว..."
                          className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddShiftForm(false)}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-xs"
                        >
                          ส่งคำขอแลกเวร
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Sub-Tab 1: Handovers List */}
              {shiftSubTab === 'handover' && (
                <div className="space-y-3">
                  {dayHandovers.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
                      <ArrowRightLeft className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                      <h4 className="text-sm font-semibold text-slate-700">ยังไม่มีบันทึกส่งมอบเวรในวันนี้</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        สามารถคลิกปุ่ม "+ ส่งเวร / แลกเวร" เพื่อบันทึกการส่งมอบเวร รายการตรวจสอบ และส่งต่อให้ผู้รับผิดชอบเวรถัดไปยืนยันรับทราบ
                      </p>
                      <button
                        onClick={() => {
                          setShiftSubTab('handover');
                          setShowAddShiftForm(true);
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>บันทึกส่งมอบเวรแรก</span>
                      </button>
                    </div>
                  ) : (
                    dayHandovers.map((handover) => {
                      const fromAssignee = assigneeMap.get(handover.fromAssigneeId);
                      const toAssignee = assigneeMap.get(handover.toAssigneeId);
                      const isPending = handover.status === 'pending';
                      const canAck = currentUser && (currentUser.id === handover.toAssigneeId || currentUser.isAdmin);
                      const canDelete = currentUser && (currentUser.id === handover.fromAssigneeId || currentUser.isAdmin);

                      const shiftTitle = 
                        handover.shift === 'morning' ? 'เวรเช้า (08:00 - 16:00)' :
                        handover.shift === 'evening' ? 'เวรบ่าย (16:00 - 00:00)' :
                        handover.shift === 'night' ? 'เวรดึก (00:00 - 08:00)' : 'เวร On-Call';

                      return (
                        <div
                          key={handover.id}
                          className={`bg-white rounded-xl border p-4 shadow-xs transition-all ${
                            isPending 
                              ? 'border-amber-300 ring-1 ring-amber-200/60' 
                              : 'border-slate-200'
                          }`}
                        >
                          {/* Card Top Bar */}
                          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                {shiftTitle}
                              </span>
                              {isPending ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                  รอผู้รับผิดชอบต่อยืนยันรับทราบ
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  ยืนยันรับทราบแล้ว
                                </span>
                              )}
                            </div>

                            {onDeleteHandover && (
                              <button
                                onClick={() => {
                                  if (!currentUser) {
                                    onRequestAuth('เพื่อยืนยันสิทธิ์ลบบันทึกส่งเวร', (u) => {
                                      if (u && (u.id === handover.fromAssigneeId || u.isAdmin)) {
                                        onDeleteHandover(handover.id);
                                      }
                                    });
                                    return;
                                  }
                                  if (canDelete) {
                                    onDeleteHandover(handover.id);
                                  } else {
                                    alert('คุณไม่มีสิทธิ์ลบบันทึกนี้ (เฉพาะผู้ส่งเวรหรือ Admin เท่านั้น)');
                                  }
                                }}
                                className="text-slate-300 hover:text-rose-600 p-1 transition-colors"
                                title="ลบบันทึกส่งเวร"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Staff Handover Flow */}
                          <div className="my-3 flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                            <div className="flex items-center gap-1.5 min-w-[120px]">
                              <span className="text-slate-500 font-medium">ผู้ส่งเวร:</span>
                              <strong className="text-slate-800">{fromAssignee?.name || 'ไม่ระบุ'}</strong>
                            </div>
                            <span className="text-slate-400 font-bold">➡️</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-indigo-700 font-medium">ผู้รับมอบเวรต่อ:</span>
                              <strong className="text-indigo-900 bg-indigo-100/70 px-2 py-0.5 rounded-md">
                                {toAssignee?.name || 'ไม่ระบุ'}
                              </strong>
                            </div>
                          </div>

                          {/* Handover Message */}
                          <div className="my-2 p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-800 space-y-1.5">
                            <div className="font-bold text-slate-700 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <span>📝 ข้อความส่งเวร (พิมพ์โดยผู้ส่งมอบ):</span>
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap leading-relaxed text-slate-700 font-medium">
                              {handover.handoverMessage || handover.notes || handover.pendingStatCases || 'ไม่มีข้อความส่งมอบเวรเพิ่มเติม'}
                            </p>
                          </div>

                          {/* Acknowledgment Action Box */}
                          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            {isPending ? (
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200">
                                <div className="text-xs text-amber-900">
                                  <span>รอการยืนยันรับทราบจาก: </span>
                                  <strong className="text-indigo-900 font-bold">{toAssignee?.name}</strong>
                                  <span className="text-slate-500 ml-1">(หรือ Admin)</span>
                                </div>
                                <button
                                  onClick={() => handleRequestHandoverAck(handover)}
                                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>ยืนยันรับทราบการส่งเวร</span>
                                </button>
                              </div>
                            ) : (
                              <div className="text-xs text-emerald-800 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                <div>
                                  <span>รับทราบโดย <strong>{handover.acknowledgedByName || toAssignee?.name}</strong></span>
                                  {handover.acknowledgedAt && (
                                    <span className="text-slate-500 ml-1">({handover.acknowledgedAt})</span>
                                  )}
                                  {handover.acknowledgedNote && (
                                    <span className="block text-slate-600 italic mt-0.5">
                                      บันทึกรับทราบ: "{handover.acknowledgedNote}"
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Sub-Tab 2: Swaps List */}
              {shiftSubTab === 'swap' && (
                <div className="space-y-3">
                  {daySwaps.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
                      <ArrowRightLeft className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                      <h4 className="text-sm font-semibold text-slate-700">ยังไม่มีรายการขอแลกเวรในวันนี้</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        สามารถส่งคำขอแลกเวรปฏิบัติงานกับเจ้าหน้าที่ท่านอื่น และรอให้ผู้รับผิดชอบเวรนั้นกดยืนยันรับทราบและตกลง
                      </p>
                      <button
                        onClick={() => {
                          setShiftSubTab('swap');
                          setShowAddShiftForm(true);
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ขอแลกเวร</span>
                      </button>
                    </div>
                  ) : (
                    daySwaps.map((swap) => {
                      const reqAssignee = assigneeMap.get(swap.requesterId);
                      const targetAssignee = assigneeMap.get(swap.targetAssigneeId);
                      const isPending = swap.status === 'pending';
                      const isAccepted = swap.status === 'accepted';
                      const canDelete = currentUser && (currentUser.id === swap.requesterId || currentUser.isAdmin);

                      return (
                        <div
                          key={swap.id}
                          className={`bg-white rounded-xl border p-4 shadow-xs space-y-3 ${
                            isPending ? 'border-amber-300' : isAccepted ? 'border-emerald-300' : 'border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800">คำขอแลกเปลี่ยนเวร</span>
                              {isPending ? (
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                                  รอการตอบรับ
                                </span>
                              ) : isAccepted ? (
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-200">
                                  ตกลงแลกเวรแล้ว
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-900 border border-rose-200">
                                  ปฏิเสธ
                                </span>
                              )}
                            </div>

                            {onDeleteSwap && (
                              <button
                                onClick={() => {
                                  if (!currentUser) {
                                    onRequestAuth('เพื่อยืนยันสิทธิ์ลบรายการแลกเวร', (u) => {
                                      if (u && (u.id === swap.requesterId || u.isAdmin)) {
                                        onDeleteSwap(swap.id);
                                      }
                                    });
                                    return;
                                  }
                                  if (canDelete) {
                                    onDeleteSwap(swap.id);
                                  } else {
                                    alert('เฉพาะผู้ขอแลกหรือ Admin เท่านั้นที่มีสิทธิ์ลบ');
                                  }
                                }}
                                className="text-slate-300 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Swap Details Card */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                              <span className="text-amber-800 font-bold block mb-1">เวรของผู้ขอแลก:</span>
                              <div className="text-slate-800">
                                <strong>{reqAssignee?.name}</strong> ({reqAssignee?.role})
                              </div>
                              <div className="text-slate-500 mt-0.5">
                                วันที่ {swap.requesterDate} (กะ: {swap.requesterShift})
                              </div>
                            </div>

                            <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200">
                              <span className="text-indigo-800 font-bold block mb-1">ขอแลกกับเวรของ:</span>
                              <div className="text-indigo-900">
                                <strong>{targetAssignee?.name}</strong> ({targetAssignee?.role})
                              </div>
                              <div className="text-slate-500 mt-0.5">
                                วันที่ {swap.targetDate} (กะ: {swap.targetShift})
                              </div>
                            </div>
                          </div>

                          <div className="text-xs text-slate-600">
                            <span className="font-semibold text-slate-700">เหตุผล: </span>
                            <span>{swap.reason}</span>
                          </div>

                          {/* Swap Actions */}
                          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            {isPending ? (
                              <div className="flex items-center justify-between w-full gap-2">
                                <span className="text-xs text-slate-500">
                                  รอให้ <strong>{targetAssignee?.name}</strong> หรือ Admin กดยืนยัน
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleRequestSwapAck(swap, false)}
                                    className="px-3 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                                  >
                                    ปฏิเสธ
                                  </button>
                                  <button
                                    onClick={() => handleRequestSwapAck(swap, true)}
                                    className="px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                                  >
                                    ตกลงแลกเวร & รับทราบ
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-500">
                                ดำเนินการแล้วเมื่อ: {swap.respondedAt || 'เรียบร้อย'}
                                {swap.responseNote && (
                                  <span className="italic block mt-0.5">"{swap.responseNote}"</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>สถานะระบบ: เชื่อมต่อคลาวด์และพร้อมแจ้งเตือน LINE</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* In-App Delete Confirmation Modal (ไม่ใช้ window.confirm เพื่อรองรับ sandbox iframe) */}
      {eventPendingDelete && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            e.stopPropagation();
            setEventPendingDelete(null);
          }}
        >
          <div 
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-white shadow-xs">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">ยืนยันการลบกิจกรรม</h4>
                  <p className="text-xs text-rose-100">โปรดตรวจสอบรายละเอียดก่อนยืนยัน</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEventPendingDelete(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3.5 text-xs text-slate-700">
              {/* Event card summary */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-sm text-slate-900">
                  {eventPendingDelete.title}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 text-xs">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{eventPendingDelete.startTime} - {eventPendingDelete.endTime} น.</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{eventPendingDelete.location || 'ห้องปฏิบัติการกลาง'}</span>
                  </div>
                </div>

                {/* Assignee info */}
                {(() => {
                  const owner = assigneeMap.get(eventPendingDelete.assigneeId);
                  return (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500">ผู้รับผิดชอบงาน:</span>
                      <span 
                        style={{
                          backgroundColor: owner?.bgColor,
                          borderColor: owner?.borderColor,
                          color: owner?.textColor
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-semibold"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: owner?.color }} />
                        <span>{owner?.name || 'ไม่ระบุชื่อ'}</span>
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Permission Badge */}
              {currentUser && (
                currentUser.id === eventPendingDelete.assigneeId ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>คุณเป็น<strong>ผู้รับผิดชอบกิจกรรมนี้</strong> จึงมีสิทธิ์ลบกิจกรรมของตนเองได้</span>
                  </div>
                ) : currentUser.isAdmin ? (
                  <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>คุณมีสิทธิ์ <strong>ผู้ดูแลระบบ (Admin)</strong> สามารถลบกิจกรรมนี้ได้</span>
                  </div>
                ) : null
              )}

              <p className="text-slate-500 text-[11px] leading-relaxed">
                ⚠️ เมื่อลบแล้ว ข้อมูลกิจกรรมนี้จะถูกนำออกจากปฏิทินและบันทึกการเปลี่ยนแปลงลงฐานข้อมูลทันที
              </p>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEventPendingDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  const idToDelete = eventPendingDelete.id;
                  setEventPendingDelete(null);
                  onDeleteEvent(idToDelete);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันการลบกิจกรรม</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Shift Acknowledgement Note Dialog */}
      {ackTarget && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            e.stopPropagation();
            setAckTarget(null);
          }}
        >
          <div 
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-emerald-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {ackTarget.type === 'handover' ? 'ยืนยันรับทราบการส่งมอบเวร' : 'ยืนยันการตอบรับแลกเวร'}
                  </h3>
                  <p className="text-[11px] text-emerald-100">
                    ผู้ยืนยัน: {ackTarget.toName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAckTarget(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                {ackTarget.type === 'handover' 
                  ? 'คุณกำลังยืนยันรับทราบงาน รายการตรวจสอบ สต็อกน้ำยา และเคสค้างตรวจเพื่อรับผิดชอบเวรถัดไป'
                  : ackTarget.accepted 
                  ? 'คุณกำลังตกลงเข้าเวรแทนตามคำขอแลกเวรนี้'
                  : 'คุณกำลังปฏิเสธคำขอแลกเวรนี้'}
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  บันทึกรับทราบเพิ่มเติม (ถ้ามี):
                </label>
                <textarea
                  rows={2}
                  value={ackNoteText}
                  onChange={(e) => setAckNoteText(e.target.value)}
                  placeholder={
                    ackTarget.type === 'handover'
                      ? 'เช่น "รับทราบผล CBC ค้าง 2 ตัวอย่าง กำลังรันต่อ...", "ตรวจเช็คเครื่องมือพร้อมปฏิบัติการ"'
                      : 'เช่น "ตกลงเข้าแทนเรียบร้อยครับ", "ติดภารกิจอื่นไม่สะดวก"'
                  }
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAckTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmAckModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>ยืนยันบันทึกรับทราบ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
