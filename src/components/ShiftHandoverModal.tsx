import React, { useState } from 'react';
import { 
  ShiftHandover, 
  ShiftSwap, 
  Assignee, 
  ShiftType 
} from '../types/calendar';
import { 
  X, 
  ArrowRightLeft, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  ShieldCheck, 
  User, 
  Calendar, 
  Search, 
  Filter, 
  Check, 
  FileText, 
  Trash2, 
  Lock,
  Send,
  Share2,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { 
  buildShiftHandoverLineMessage, 
  buildShiftSwapLineMessage, 
  generateLineShareUrl 
} from '../utils/lineNotify';

interface ShiftHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  handovers: ShiftHandover[];
  swaps: ShiftSwap[];
  assignees: Assignee[];
  currentUser: Assignee | null;
  onAddHandover: (handover: Omit<ShiftHandover, 'id' | 'createdAt'>) => void;
  onAcknowledgeHandover: (handoverId: string, note?: string) => void;
  onDeleteHandover: (handoverId: string) => void;
  onAddSwap: (swap: Omit<ShiftSwap, 'id' | 'createdAt'>) => void;
  onAcknowledgeSwap: (swapId: string, accepted: boolean, note?: string) => void;
  onDeleteSwap: (swapId: string) => void;
  onRequestAuth: (contextMessage?: string, onAuthenticated?: (user?: Assignee) => void) => void;
  defaultDate?: string;
  onSendLineNotify?: (message: string, recipient?: { type: 'group' | 'individual'; name?: string; destinationId?: string }) => Promise<void>;
}

const SHIFT_LABELS: Record<ShiftType, { label: string; time: string; color: string; bg: string }> = {
  morning: { label: 'เวรเช้า (Morning)', time: '08:00 - 16:00 น.', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  afternoon: { label: 'เวรบ่าย (Afternoon)', time: '16:00 - 24:00 น.', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' },
  evening: { label: 'เวรบ่าย/เย็น (Evening)', time: '16:00 - 24:00 น.', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' },
  night: { label: 'เวรดึก (Night)', time: '00:00 - 08:00 น.', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  full_day: { label: 'เวร 24 ชม. (24 Hours)', time: '08:00 - 08:00 น. (วันถัดไป)', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' }
};

const DEPARTMENTS = [
  'ห้องปฏิบัติการเคมีคลินิก (Clinical Chemistry)',
  'โลหิตวิทยาและจุลทรรศน์ศาสตร์ (Hematology)',
  'ธนาคารเลือดและห้องเตรียมโลหิต (Blood Bank)',
  'จุลชีววิทยาและวิทยาภูมิคุ้มกัน (Microbiology)',
  'ห้องปฏิบัติการชีวโมเลกุล (PCR & Molecular)',
  'ห้องปฏิบัติการควบคุมคุณภาพและตรวจวิเคราะห์กลาง (Central Lab)'
];

export const ShiftHandoverModal: React.FC<ShiftHandoverModalProps> = ({
  isOpen,
  onClose,
  handovers,
  swaps,
  assignees,
  currentUser,
  onAddHandover,
  onAcknowledgeHandover,
  onDeleteHandover,
  onAddSwap,
  onAcknowledgeSwap,
  onDeleteSwap,
  onRequestAuth,
  defaultDate = new Date().toISOString().split('T')[0],
  onSendLineNotify
}) => {
  const [activeTab, setActiveTab] = useState<'handovers' | 'swaps'>('handovers');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'acknowledged'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Forms states
  const [showHandoverForm, setShowHandoverForm] = useState(false);
  const [showSwapForm, setShowSwapForm] = useState(false);

  // Handover form fields (Replacing checklist & separated inputs with direct typing handover message)
  const [handoverDate, setHandoverDate] = useState(defaultDate);
  const [handoverShift, setHandoverShift] = useState<ShiftType>('morning');
  const [handoverDept, setHandoverDept] = useState(DEPARTMENTS[0]);
  const [handoverFrom, setHandoverFrom] = useState(currentUser?.id || assignees[0]?.id || '');
  const [handoverTo, setHandoverTo] = useState(assignees[1]?.id || assignees[0]?.id || '');
  const [handoverMessage, setHandoverMessage] = useState('');
  const [notifyLineOnHandover, setNotifyLineOnHandover] = useState(true);
  const [handoverNotifyTarget, setHandoverNotifyTarget] = useState<'individual' | 'group'>('individual');

  // Swap form fields
  const [swapRequesterId, setSwapRequesterId] = useState(currentUser?.id || assignees[0]?.id || '');
  const [swapTargetId, setSwapTargetId] = useState(assignees[1]?.id || assignees[0]?.id || '');
  const [swapRequestDate, setSwapRequestDate] = useState(defaultDate);
  const [swapRequestShift, setSwapRequestShift] = useState<ShiftType>('morning');
  const [swapType, setSwapType] = useState<'exchange' | 'cover'>('exchange');
  const [swapTargetDate, setSwapTargetDate] = useState(defaultDate);
  const [swapTargetShift, setSwapTargetShift] = useState<ShiftType>('afternoon');
  const [swapDepartment, setSwapDepartment] = useState(DEPARTMENTS[0]);
  const [swapReason, setSwapReason] = useState('');
  const [notifyLineOnSwap, setNotifyLineOnSwap] = useState(true);
  const [swapNotifyTarget, setSwapNotifyTarget] = useState<'individual' | 'group'>('individual');

  // Acknowledgement dialog prompt
  const [acknowledgingHandover, setAcknowledgingHandover] = useState<ShiftHandover | null>(null);
  const [acknowledgingSwap, setAcknowledgingSwap] = useState<ShiftSwap | null>(null);
  const [ackNoteText, setAckNoteText] = useState('');

  if (!isOpen) return null;

  const assigneeMap = new Map(assignees.map(a => [a.id, a]));

  const formatThaiDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10) + 543;
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const months = [
          'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
          'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];
        return `${day} ${months[monthIndex]} ${year}`;
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  const handleCreateHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverTo) {
      alert('กรุณาเลือกผู้รับผิดชอบต่อ');
      return;
    }
    if (!handoverMessage.trim()) {
      alert('กรุณากรอกข้อความส่งเวร');
      return;
    }

    const handoverData = {
      date: handoverDate,
      shift: handoverShift,
      department: handoverDept,
      fromAssigneeId: handoverFrom,
      toAssigneeId: handoverTo,
      handoverMessage: handoverMessage.trim(),
      notes: handoverMessage.trim(),
      pendingStatCases: undefined,
      equipmentStatus: undefined,
      reagentsAlert: undefined,
      specialInstructions: undefined,
      status: 'pending' as const
    };

    onAddHandover(handoverData);

    // Send LINE Notification if checked
    if (notifyLineOnHandover && onSendLineNotify) {
      const fullHandover: ShiftHandover = {
        ...handoverData,
        id: 'ho-' + Date.now(),
        createdAt: new Date().toISOString()
      };
      const lineMsg = buildShiftHandoverLineMessage(fullHandover, assignees);
      const toStaff = assigneeMap.get(handoverTo);

      if (handoverNotifyTarget === 'individual' && toStaff) {
        await onSendLineNotify(lineMsg, {
          type: 'individual',
          name: toStaff.name,
          destinationId: toStaff.lineUserId
        });
      } else {
        await onSendLineNotify(lineMsg, {
          type: 'group',
          name: 'LINE กลุ่มห้องแล็บ'
        });
      }
    }

    setShowHandoverForm(false);
    setHandoverMessage('');
  };

  const handleCreateSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (swapRequesterId === swapTargetId) {
      alert('ผู้ขอแลกเวรและผู้รับแลกเวรต้องไม่เป็นคนเดียวกัน');
      return;
    }
    if (!swapReason.trim()) {
      alert('กรุณาระบุเหตุผลในการขอแลกเวร');
      return;
    }

    const swapData = {
      requesterId: swapRequesterId,
      targetAssigneeId: swapTargetId,
      requestDate: swapRequestDate,
      requestShift: swapRequestShift,
      swapType,
      targetDate: swapType === 'exchange' ? swapTargetDate : undefined,
      targetShift: swapType === 'exchange' ? swapTargetShift : undefined,
      department: swapDepartment,
      reason: swapReason.trim(),
      status: 'pending_target' as const
    };

    onAddSwap(swapData);

    // Send LINE Notification for swap request
    if (notifyLineOnSwap && onSendLineNotify) {
      const fullSwap: ShiftSwap = {
        ...swapData,
        id: 'sw-' + Date.now(),
        createdAt: new Date().toISOString()
      };
      const lineMsg = buildShiftSwapLineMessage(fullSwap, assignees);
      const targetStaff = assigneeMap.get(swapTargetId);

      if (swapNotifyTarget === 'individual' && targetStaff) {
        await onSendLineNotify(lineMsg, {
          type: 'individual',
          name: targetStaff.name,
          destinationId: targetStaff.lineUserId
        });
      } else {
        await onSendLineNotify(lineMsg, {
          type: 'group',
          name: 'LINE กลุ่มห้องแล็บ'
        });
      }
    }

    setShowSwapForm(false);
    setSwapReason('');
  };

  const handleQuickSendHandoverLine = async (ho: ShiftHandover, mode: 'individual' | 'group') => {
    if (!onSendLineNotify) return;
    const msg = buildShiftHandoverLineMessage(ho, assignees);
    const toStaff = assigneeMap.get(ho.toAssigneeId);
    if (mode === 'individual' && toStaff) {
      await onSendLineNotify(msg, {
        type: 'individual',
        name: toStaff.name,
        destinationId: toStaff.lineUserId
      });
    } else {
      await onSendLineNotify(msg, {
        type: 'group',
        name: 'LINE กลุ่มห้องแล็บ'
      });
    }
  };

  const handleQuickSendSwapLine = async (sw: ShiftSwap, mode: 'individual' | 'group') => {
    if (!onSendLineNotify) return;
    const msg = buildShiftSwapLineMessage(sw, assignees);
    const targetStaff = assigneeMap.get(sw.targetAssigneeId);
    if (mode === 'individual' && targetStaff) {
      await onSendLineNotify(msg, {
        type: 'individual',
        name: targetStaff.name,
        destinationId: targetStaff.lineUserId
      });
    } else {
      await onSendLineNotify(msg, {
        type: 'group',
        name: 'LINE กลุ่มห้องแล็บ'
      });
    }
  };

  // Check auth before acknowledging handover
  const promptAcknowledgeHandover = (handover: ShiftHandover) => {
    const toPerson = assigneeMap.get(handover.toAssigneeId);
    const targetName = toPerson?.name || 'ผู้รับผิดชอบต่อ';

    const executeAck = (user?: Assignee | null) => {
      const activeUser = user !== undefined ? user : currentUser;
      if (!activeUser) return;
      const isTarget = activeUser.id === handover.toAssigneeId;
      const isAdmin = activeUser.isAdmin || false;

      if (!isTarget && !isAdmin) {
        alert(`เฉพาะ ${targetName} (ผู้รับมอบเวรต่อ) หรือ ผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถกดยืนยันรับทราบได้`);
        return;
      }

      setAcknowledgingHandover(handover);
      setAckNoteText('');
    };

    if (!currentUser) {
      onRequestAuth(`เพื่อยืนยันตัวตนในฐานะ ${targetName} หรือ Admin ก่อนลงนามรับมอบเวร`, (authenticatedUser) => {
        executeAck(authenticatedUser);
      });
      return;
    }

    executeAck(currentUser);
  };

  // Check auth before acknowledging swap
  const promptAcknowledgeSwap = (swap: ShiftSwap) => {
    const targetPerson = assigneeMap.get(swap.targetAssigneeId);
    const targetName = targetPerson?.name || 'ผู้รับผิดชอบต่อ';

    const executeAck = (user?: Assignee | null) => {
      const activeUser = user !== undefined ? user : currentUser;
      if (!activeUser) return;
      const isTarget = activeUser.id === swap.targetAssigneeId;
      const isAdmin = activeUser.isAdmin || false;

      if (!isTarget && !isAdmin) {
        alert(`เฉพาะ ${targetName} (ผู้รับแลกเวร) หรือ ผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถกดยืนยันรับทราบและตกลงได้`);
        return;
      }

      setAcknowledgingSwap(swap);
      setAckNoteText('');
    };

    if (!currentUser) {
      onRequestAuth(`เพื่อยืนยันตัวตนในฐานะ ${targetName} หรือ Admin ก่อนตอบรับการแลกเวร`, (authenticatedUser) => {
        executeAck(authenticatedUser);
      });
      return;
    }

    executeAck(currentUser);
  };

  // Filtered lists
  const filteredHandovers = handovers.filter(h => {
    if (filterStatus === 'pending' && h.status !== 'pending') return false;
    if (filterStatus === 'acknowledged' && h.status !== 'acknowledged') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const fromName = assigneeMap.get(h.fromAssigneeId)?.name.toLowerCase() || '';
      const toName = assigneeMap.get(h.toAssigneeId)?.name.toLowerCase() || '';
      const dept = h.department.toLowerCase();
      const content = `${h.pendingStatCases || ''} ${h.equipmentStatus || ''} ${h.specialInstructions || ''}`.toLowerCase();
      return fromName.includes(q) || toName.includes(q) || dept.includes(q) || content.includes(q) || h.date.includes(q);
    }
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const filteredSwaps = swaps.filter(s => {
    if (filterStatus === 'pending' && s.status !== 'pending_target') return false;
    if (filterStatus === 'acknowledged' && s.status !== 'approved') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const reqName = assigneeMap.get(s.requesterId)?.name.toLowerCase() || '';
      const tgtName = assigneeMap.get(s.targetAssigneeId)?.name.toLowerCase() || '';
      const dept = s.department.toLowerCase();
      const reason = s.reason.toLowerCase();
      return reqName.includes(q) || tgtName.includes(q) || dept.includes(q) || reason.includes(q) || s.requestDate.includes(q);
    }
    return true;
  }).sort((a, b) => b.requestDate.localeCompare(a.requestDate));

  const pendingHandoverCount = handovers.filter(h => h.status === 'pending').length;
  const pendingSwapCount = swaps.filter(s => s.status === 'pending_target').length;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-indigo-900 text-white p-4 sm:p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-inner">
              <ArrowRightLeft className="w-6 h-6 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">บันทึกการส่งเวร & การแลกเวร</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/30 text-teal-200 border border-teal-400/30 font-medium">
                  ห้องปฏิบัติการทางการแพทย์
                </span>
              </div>
              <p className="text-xs text-teal-100/90 mt-0.5">
                ระบบส่งมอบงานห้องแล็บ ตรวจสอบสถานะสิ่งส่งตรวจ STAT และการแลกเวรพร้อมระบบยืนยันรับทราบ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current user banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">ผู้ใช้งานปัจจุบัน:</span>
            {currentUser ? (
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentUser.color }} />
                <span>{currentUser.name}</span>
                {currentUser.isAdmin && (
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold">
                    Admin
                  </span>
                )}
              </div>
            ) : (
              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>ยังไม่ได้เข้าสู่ระบบ (จะถามรหัส PIN เมื่อกดยืนยันรับทราบ)</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px]">รอยืนยันรับทราบ:</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              ส่งเวร: {pendingHandoverCount} รายการ
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
              แลกเวร: {pendingSwapCount} รายการ
            </span>
          </div>
        </div>

        {/* Navigation Tabs & Actions Toolbar */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('handovers')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'handovers'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>บันทึกการส่งเวร (Handovers)</span>
              {pendingHandoverCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                  {pendingHandoverCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('swaps')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'swaps'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>การแลกเวร / เปลี่ยนเวร (Shift Swaps)</span>
              {pendingSwapCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-600 text-white font-bold">
                  {pendingSwapCount}
                </span>
              )}
            </button>
          </div>

          {/* New Button */}
          {activeTab === 'handovers' ? (
            <button
              type="button"
              onClick={() => setShowHandoverForm(!showHandoverForm)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{showHandoverForm ? 'ปิดแบบฟอร์ม' : 'สร้างบันทึกส่งมอบเวรใหม่'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowSwapForm(!showSwapForm)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{showSwapForm ? 'ปิดแบบฟอร์ม' : 'ขอแลกเวร / อยู่เวรแทน'}</span>
            </button>
          )}
        </div>

        {/* Filter bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อเจ้าหน้าที่, แผนก, รายละเอียด หรือวันที่..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">สถานะ:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('pending')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  filterStatus === 'pending'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                }`}
              >
                ⏳ รอยืนยันรับทราบ
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('acknowledged')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  filterStatus === 'acknowledged'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                ✅ ยืนยันรับทราบแล้ว
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-100/70">
          {/* Form: Add Handover */}
          {activeTab === 'handovers' && showHandoverForm && (
            <form 
              onSubmit={handleCreateHandover}
              className="bg-white p-5 rounded-2xl border-2 border-teal-500/40 shadow-md space-y-4 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">บันทึกการส่งมอบงานในเวร (Shift Handover)</h4>
                    <p className="text-[11px] text-slate-500">บันทึกการส่งต่องานห้องแล็บ เพื่อให้ผู้รับผิดชอบต่อตรวจสอบและกดยืนยันรับทราบ</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHandoverForm(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Row 1: Date & Shift & Dept */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">วันที่ส่งเวร:</label>
                  <input
                    type="date"
                    value={handoverDate}
                    onChange={(e) => setHandoverDate(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ผลัดเวร / กะเวร:</label>
                  <select
                    value={handoverShift}
                    onChange={(e) => setHandoverShift(e.target.value as ShiftType)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                  >
                    <option value="morning">🌅 เวรเช้า (08:00 - 16:00 น.)</option>
                    <option value="afternoon">☀️ เวรบ่าย (16:00 - 24:00 น.)</option>
                    <option value="night">🌙 เวรดึก (00:00 - 08:00 น.)</option>
                    <option value="full_day">⏰ เวร 24 ชั่วโมง</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ห้องปฏิบัติการ / แผนก:</label>
                  <select
                    value={handoverDept}
                    onChange={(e) => setHandoverDept(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: From & To Assignees */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-teal-50/50 rounded-xl border border-teal-100">
                <div>
                  <label className="block text-xs font-bold text-teal-900 mb-1">ผู้ส่งมอบเวร (Outgoing Staff):</label>
                  <select
                    value={handoverFrom}
                    onChange={(e) => setHandoverFrom(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-teal-200 rounded-lg text-slate-800 font-semibold"
                  >
                    {assignees.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-indigo-900 mb-1">
                    ผู้รับผิดชอบต่อ / ผู้รับมอบเวร (Incoming Staff) <span className="text-rose-600">*</span>:
                  </label>
                  <select
                    value={handoverTo}
                    onChange={(e) => setHandoverTo(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 bg-white border border-indigo-200 rounded-lg text-slate-800 font-semibold"
                  >
                    {assignees.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.role}) {a.isAdmin ? '👑 Admin' : ''}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-indigo-700 mt-1 block">
                    * ผู้รับผิดชอบต่อคนนี้จะเป็นผู้กดยืนยันรับทราบ
                  </span>
                </div>
              </div>

              {/* Direct Handover Typing Message (ข้อความส่งเวร โดยวิธีการพิมพ์) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>ข้อความส่งเวร โดยวิธีการพิมพ์ (Handover Message)</span>
                    <span className="text-rose-600">*</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    พิมพ์รายละเอียดทั้งหมดในช่องเดียวอย่างอิสระ
                  </span>
                </label>
                <textarea
                  rows={5}
                  required
                  value={handoverMessage}
                  onChange={(e) => setHandoverMessage(e.target.value)}
                  placeholder="พิมพ์ข้อความส่งเวรอย่างละเอียด เช่น:
- รายการสิ่งส่งตรวจ STAT / งานค้างตรวจหรือเคสรอผล
- สถานะเครื่องมือวิเคราะห์และผลการควบคุมคุณภาพ (QC)
- การเบิกจ่ายน้ำยา Reagent และอุปกรณ์ที่ต้องติดตามต่อ
- ข้อควรระวังพิเศษ หรือคำสั่งแพทย์เวรที่สำคัญ..."
                  className="w-full text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 leading-relaxed focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-inner"
                />
              </div>

              {/* LINE Notification Dispatch Section */}
              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyLineOnHandover}
                    onChange={(e) => setNotifyLineOnHandover(e.target.checked)}
                    className="w-4 h-4 rounded text-[#06C755] focus:ring-[#06C755]"
                  />
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-[#06C755]" />
                    <span>ส่งบันทึกการส่งเวรนี้เข้า LINE ทันทีเมื่อบันทึก</span>
                  </span>
                </label>

                {notifyLineOnHandover && (
                  <div className="pl-6 space-y-2 pt-1 border-t border-emerald-200/60">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white border border-emerald-200/80">
                        <input
                          type="radio"
                          name="handoverNotifyTarget"
                          checked={handoverNotifyTarget === 'individual'}
                          onChange={() => setHandoverNotifyTarget('individual')}
                          className="text-[#06C755]"
                        />
                        <div className="text-[11px]">
                          <span className="font-bold text-emerald-950 block">👤 ส่ง LINE ส่วนตัว</span>
                          <span className="text-slate-500">
                            ส่งตรงถึง {assigneeMap.get(handoverTo)?.name || 'ผู้รับผิดชอบต่อ'}
                          </span>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white border border-emerald-200/80">
                        <input
                          type="radio"
                          name="handoverNotifyTarget"
                          checked={handoverNotifyTarget === 'group'}
                          onChange={() => setHandoverNotifyTarget('group')}
                          className="text-[#06C755]"
                        />
                        <div className="text-[11px]">
                          <span className="font-bold text-emerald-950 block">👥 ส่ง LINE กลุ่มห้องแล็บ</span>
                          <span className="text-slate-500">แจ้งเตือนรวมในกลุ่มประจำห้องปฏิบัติการ</span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowHandoverForm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกการส่งเวร (รอผู้รับผิดชอบต่อยืนยัน)</span>
                </button>
              </div>
            </form>
          )}

          {/* Form: Add Swap */}
          {activeTab === 'swaps' && showSwapForm && (
            <form 
              onSubmit={handleCreateSwap}
              className="bg-white p-5 rounded-2xl border-2 border-indigo-500/40 shadow-md space-y-4 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">บันทึกการขอแลกเวร / อยู่เวรแทน (Shift Swap)</h4>
                    <p className="text-[11px] text-slate-500">สร้างคำขอแลกเปลี่ยนเวร เพื่อส่งให้ผู้รับผิดชอบต่อหรือผู้รับแลกยืนยันรับทราบและยินยอม</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSwapForm(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Swap Type & Dept */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ประเภทการแลกเปลี่ยน:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSwapType('exchange')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                        swapType === 'exchange'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                        <span>แลกเวรกัน (Exchange)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-normal">สลับวัน/เวรซึ่งกันและกัน</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSwapType('cover')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left ${
                        swapType === 'cover'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                        <span>ขอให้อยู่แทน (Cover)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-normal">ให้ผู้รับผิดชอบต่อมาขึ้นเวรแทน</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">แผนก / ห้องปฏิบัติการ:</label>
                  <select
                    value={swapDepartment}
                    onChange={(e) => setSwapDepartment(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* People & Shifts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100">
                {/* Requester side */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
                    <span>ผู้ขอแลกเวร:</span>
                  </div>

                  <select
                    value={swapRequesterId}
                    onChange={(e) => setSwapRequesterId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium"
                  >
                    {assignees.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">วันที่ต้องการแลก:</label>
                      <input
                        type="date"
                        value={swapRequestDate}
                        onChange={(e) => setSwapRequestDate(e.target.value)}
                        required
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">เวรของผู้ขอ:</label>
                      <select
                        value={swapRequestShift}
                        onChange={(e) => setSwapRequestShift(e.target.value as ShiftType)}
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                      >
                        <option value="morning">🌅 เช้า</option>
                        <option value="afternoon">☀️ บ่าย</option>
                        <option value="night">🌙 ดึก</option>
                        <option value="full_day">⏰ 24 ชม.</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Target person side */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
                    <span>ผู้รับผิดชอบต่อ / ผู้รับแลกเวร (ต้องยืนยัน):</span>
                  </div>

                  <select
                    value={swapTargetId}
                    onChange={(e) => setSwapTargetId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-indigo-300 rounded-lg text-slate-800 font-bold"
                  >
                    {assignees.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.role}) {a.isAdmin ? '👑 Admin' : ''}
                      </option>
                    ))}
                  </select>

                  {swapType === 'exchange' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">วันที่มาแลก:</label>
                        <input
                          type="date"
                          value={swapTargetDate}
                          onChange={(e) => setSwapTargetDate(e.target.value)}
                          required
                          className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">เวรที่มาแลก:</label>
                        <select
                          value={swapTargetShift}
                          onChange={(e) => setSwapTargetShift(e.target.value as ShiftType)}
                          className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg"
                        >
                          <option value="morning">🌅 เช้า</option>
                          <option value="afternoon">☀️ บ่าย</option>
                          <option value="night">🌙 ดึก</option>
                          <option value="full_day">⏰ 24 ชม.</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-indigo-100/60 border border-indigo-200 text-xs text-indigo-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-700 shrink-0" />
                      <span>ขอให้ผู้รับผิดชอบต่อขึ้นเวรแทนในวันที่ {formatThaiDate(swapRequestDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เหตุผลในการขอแลกเวร / เปลี่ยนเวร <span className="text-rose-600">*</span>:
                </label>
                <textarea
                  rows={2}
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  placeholder="เช่น ติดราชการอบรมวิชาการ CME, ลาป่วย, ติดภารกิจจำเป็นส่วนตัว..."
                  required
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              {/* LINE Notification Dispatch Section for Swap */}
              <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyLineOnSwap}
                    onChange={(e) => setNotifyLineOnSwap(e.target.checked)}
                    className="w-4 h-4 rounded text-[#06C755] focus:ring-[#06C755]"
                  />
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-[#06C755]" />
                    <span>ส่งแจ้งเตือนการขอแลกเวรนี้เข้า LINE ทันที</span>
                  </span>
                </label>

                {notifyLineOnSwap && (
                  <div className="pl-6 space-y-2 pt-1 border-t border-indigo-200/60">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white border border-indigo-200/80">
                        <input
                          type="radio"
                          name="swapNotifyTarget"
                          checked={swapNotifyTarget === 'individual'}
                          onChange={() => setSwapNotifyTarget('individual')}
                          className="text-[#06C755]"
                        />
                        <div className="text-[11px]">
                          <span className="font-bold text-indigo-950 block">👤 ส่ง LINE ส่วนตัว</span>
                          <span className="text-slate-500">
                            ส่งตรงถึง {assigneeMap.get(swapTargetId)?.name || 'ผู้รับผิดชอบต่อ/ผู้รับแลก'}
                          </span>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white border border-indigo-200/80">
                        <input
                          type="radio"
                          name="swapNotifyTarget"
                          checked={swapNotifyTarget === 'group'}
                          onChange={() => setSwapNotifyTarget('group')}
                          className="text-[#06C755]"
                        />
                        <div className="text-[11px]">
                          <span className="font-bold text-indigo-950 block">👥 ส่ง LINE กลุ่มห้องแล็บ</span>
                          <span className="text-slate-500">แจ้งเตือนรวมในกลุ่มประจำห้องปฏิบัติการ</span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSwapForm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>ส่งคำขอแลกเวร (รอผู้รับผิดชอบต่อยืนยัน)</span>
                </button>
              </div>
            </form>
          )}

          {/* List: Handovers */}
          {activeTab === 'handovers' && (
            <div className="space-y-3.5">
              {filteredHandovers.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto text-teal-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">ไม่พบบันทึกการส่งเวรตามเงื่อนไขที่เลือก</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    คุณสามารถกดปุ่ม "สร้างบันทึกส่งมอบเวรใหม่" ด้านบนเพื่อเริ่มบันทึกส่งต่องานในห้องปฏิบัติการได้ทันที
                  </p>
                </div>
              ) : (
                filteredHandovers.map((handover) => {
                  const fromStaff = assigneeMap.get(handover.fromAssigneeId);
                  const toStaff = assigneeMap.get(handover.toAssigneeId);
                  const ackStaff = handover.acknowledgedByAssigneeId ? assigneeMap.get(handover.acknowledgedByAssigneeId) : null;
                  const shiftInfo = SHIFT_LABELS[handover.shift] || SHIFT_LABELS.morning;
                  const isPending = handover.status === 'pending';

                  return (
                    <div
                      key={handover.id}
                      className={`bg-white rounded-2xl border shadow-xs transition-all overflow-hidden ${
                        isPending 
                          ? 'border-amber-300 ring-2 ring-amber-400/20' 
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${shiftInfo.bg} ${shiftInfo.color}`}>
                            {shiftInfo.label}
                          </span>
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatThaiDate(handover.date)}</span>
                          </span>
                          <span className="text-xs text-slate-500">({shiftInfo.time})</span>
                          <span className="text-xs font-medium text-slate-600 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                            {handover.department}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs animate-pulse">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                              <span>รอยืนยันรับทราบ</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>ยืนยันรับทราบแล้ว</span>
                            </span>
                          )}

                          {/* Delete button (Admin or Creator) */}
                          {(currentUser?.isAdmin || currentUser?.id === handover.fromAssigneeId) && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('คุณต้องการลบบันทึกการส่งมอบเวรนี้หรือไม่?')) {
                                  onDeleteHandover(handover.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="ลบบันทึกการส่งเวร"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 sm:p-5 space-y-4">
                        {/* Handover Flow: From ➡️ To */}
                        <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                          {/* Outgoing */}
                          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <span className="text-slate-500">ผู้ส่งมอบ:</span>
                            <span 
                              style={{
                                backgroundColor: fromStaff?.bgColor,
                                borderColor: fromStaff?.borderColor,
                                color: fromStaff?.textColor
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-bold"
                            >
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: fromStaff?.color }} />
                              <span>{fromStaff?.name || 'ไม่ระบุชื่อ'}</span>
                            </span>
                          </div>

                          <div className="text-slate-400 font-bold px-2">➡️</div>

                          {/* Incoming / Responsible Person */}
                          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                            <span className="text-slate-500 font-semibold">ผู้รับผิดชอบต่อ:</span>
                            <span 
                              style={{
                                backgroundColor: toStaff?.bgColor,
                                borderColor: toStaff?.borderColor,
                                color: toStaff?.textColor
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-bold shadow-2xs"
                            >
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: toStaff?.color }} />
                              <span>{toStaff?.name || 'ไม่ระบุชื่อ'}</span>
                              {toStaff?.isAdmin && <span className="text-[10px] bg-white/70 px-1 rounded-sm">Admin</span>}
                            </span>
                          </div>
                        </div>

                        {/* Handover Message (ข้อความส่งเวร โดยวิธีการพิมพ์) */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-800 space-y-1.5">
                          <div className="font-bold text-slate-700 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-teal-600" />
                              <span>ข้อความส่งเวร (พิมพ์โดยผู้ส่งมอบ):</span>
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap leading-relaxed text-slate-800">
                            {handover.handoverMessage || handover.notes || handover.pendingStatCases || 'ไม่มีข้อความส่งมอบเวรเพิ่มเติม'}
                          </p>
                        </div>

                        {/* LINE Dispatch Action Bar for Handover */}
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <Send className="w-3 h-3 text-[#06C755]" />
                            <span>ส่งข้อความเข้า LINE:</span>
                          </span>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleQuickSendHandoverLine(handover, 'individual')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                              title="ส่งแจ้งเตือนเข้า LINE ส่วนตัวของผู้รับผิดชอบต่อ"
                            >
                              <span>👤 ส่ง LINE ส่วนตัว ({toStaff?.name || 'ผู้รับเวร'})</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleQuickSendHandoverLine(handover, 'group')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors"
                              title="ส่งแจ้งเตือนเข้า LINE กลุ่มห้องแล็บ"
                            >
                              <span>👥 ส่ง LINE กลุ่ม</span>
                            </button>

                            <a
                              href={generateLineShareUrl(buildShiftHandoverLineMessage(handover, assignees))}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#06C755] text-white hover:bg-[#05b34c] transition-colors shadow-2xs"
                              title="เปิดแอป LINE เพื่อแชร์ข้อความนี้โดยตรง"
                            >
                              <Share2 className="w-3 h-3" />
                              <span>แชร์ LINE</span>
                            </a>
                          </div>
                        </div>

                        {/* Acknowledgement Status / Action Footer */}
                        {isPending ? (
                          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-300/80 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-xs text-amber-900 space-y-0.5">
                              <p className="font-bold flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-amber-700" />
                                <span>รอการยืนยันรับทราบจาก: <strong>{toStaff?.name || 'ผู้รับผิดชอบต่อ'}</strong></span>
                              </p>
                              <p className="text-[11px] text-amber-800/80">
                                ผู้รับผิดชอบต่อหรือ Admin กรุณาตรวจสอบรายละเอียดและกดยืนยันรับมอบเวร
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => promptAcknowledgeHandover(handover)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all hover:scale-[1.02]"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>ยืนยันรับทราบการส่งเวร</span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-950">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>ยืนยันรับทราบโดย: {ackStaff?.name || toStaff?.name || 'ผู้รับผิดชอบต่อ'}</span>
                                {handover.acknowledgedAt && (
                                  <span className="text-[11px] text-emerald-700 font-normal">
                                    เมื่อ {new Date(handover.acknowledgedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น. ({formatThaiDate(handover.acknowledgedAt.split('T')[0])})
                                  </span>
                                )}
                              </div>
                              {handover.acknowledgementNote && (
                                <p className="text-[11px] text-emerald-800 pl-5 italic">
                                  "{handover.acknowledgementNote}"
                                </p>
                              )}
                            </div>
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-200/80 text-emerald-900 border border-emerald-300">
                              รับมอบเวรสมบูรณ์
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* List: Swaps */}
          {activeTab === 'swaps' && (
            <div className="space-y-3.5">
              {filteredSwaps.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
                    <ArrowRightLeft className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">ไม่พบรายการขอแลกเวรตามเงื่อนไขที่เลือก</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    คุณสามารถกดปุ่ม "ขอแลกเวร / อยู่เวรแทน" ด้านบนเพื่อส่งคำขอแลกเปลี่ยนเวรกับเพื่อนร่วมงานได้ทันที
                  </p>
                </div>
              ) : (
                filteredSwaps.map((swap) => {
                  const requester = assigneeMap.get(swap.requesterId);
                  const target = assigneeMap.get(swap.targetAssigneeId);
                  const isPending = swap.status === 'pending_target';
                  const isApproved = swap.status === 'approved';
                  const isRejected = swap.status === 'rejected';

                  const reqShiftInfo = SHIFT_LABELS[swap.requestShift] || SHIFT_LABELS.morning;
                  const tgtShiftInfo = swap.targetShift ? SHIFT_LABELS[swap.targetShift] : null;

                  return (
                    <div
                      key={swap.id}
                      className={`bg-white rounded-2xl border shadow-xs transition-all overflow-hidden ${
                        isPending 
                          ? 'border-indigo-300 ring-2 ring-indigo-400/20' 
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Swap Header */}
                      <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                            {swap.swapType === 'exchange' ? '🔄 แลกเวรกันสองทาง' : '🤝 ขอให้อยู่เวรแทน'}
                          </span>
                          <span className="text-xs font-semibold text-slate-600 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                            {swap.department}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs animate-pulse">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                              <span>รอยืนยันและยินยอมแลกเวร</span>
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>ยินยอมแลกเวรเรียบร้อย (อนุมัติ)</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300 shadow-2xs">
                              <X className="w-3.5 h-3.5 text-rose-700" />
                              <span>ปฏิเสธการแลกเวร</span>
                            </span>
                          )}

                          {/* Delete button (Admin or Requester) */}
                          {(currentUser?.isAdmin || currentUser?.id === swap.requesterId) && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('คุณต้องการลบรายการขอแลกเวรนี้หรือไม่?')) {
                                  onDeleteSwap(swap.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="ลบคำขอแลกเวร"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Swap Body */}
                      <div className="p-4 sm:p-5 space-y-4">
                        {/* Visual Exchange comparison */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                          {/* Side 1: Requester */}
                          <div className="space-y-1.5">
                            <span className="text-slate-500 font-medium">ผู้ขอแลกเวร:</span>
                            <div className="flex items-center gap-1.5">
                              <span 
                                style={{
                                  backgroundColor: requester?.bgColor,
                                  borderColor: requester?.borderColor,
                                  color: requester?.textColor
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border font-bold"
                              >
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: requester?.color }} />
                                <span>{requester?.name || 'ไม่ระบุชื่อ'}</span>
                              </span>
                            </div>
                            <div className="text-slate-700 font-semibold pt-1">
                              วันที่ {formatThaiDate(swap.requestDate)} ({reqShiftInfo.label})
                            </div>
                          </div>

                          {/* Side 2: Target */}
                          <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-3">
                            <span className="text-slate-500 font-semibold">ผู้รับผิดชอบต่อ / ผู้รับแลกเวร:</span>
                            <div className="flex items-center gap-1.5">
                              <span 
                                style={{
                                  backgroundColor: target?.bgColor,
                                  borderColor: target?.borderColor,
                                  color: target?.textColor
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border font-bold"
                              >
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: target?.color }} />
                                <span>{target?.name || 'ไม่ระบุชื่อ'}</span>
                                {target?.isAdmin && <span className="text-[10px] bg-white/70 px-1 rounded-sm">Admin</span>}
                              </span>
                            </div>
                            <div className="text-slate-700 font-semibold pt-1">
                              {swap.swapType === 'exchange' && swap.targetDate ? (
                                <span>แลกกับวันที่ {formatThaiDate(swap.targetDate)} ({tgtShiftInfo?.label || 'เวรที่ระบุ'})</span>
                              ) : (
                                <span className="text-indigo-700">ขึ้นเวรแทนในวันที่ {formatThaiDate(swap.requestDate)}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Reason */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 space-y-1">
                          <span className="font-bold text-slate-700">เหตุผลในการขอแลกเวร:</span>
                          <p className="whitespace-pre-wrap">{swap.reason}</p>
                        </div>

                        {/* LINE Dispatch Action Bar for Swap */}
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <Send className="w-3 h-3 text-[#06C755]" />
                            <span>ส่งบันทึกการขอแลกเวรเข้า LINE:</span>
                          </span>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleQuickSendSwapLine(swap, 'individual')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                              title="ส่งแจ้งเตือนเข้า LINE ส่วนตัวของผู้รับแลก"
                            >
                              <span>👤 ส่ง LINE ส่วนตัว ({target?.name || 'ผู้รับแลก'})</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleQuickSendSwapLine(swap, 'group')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors"
                              title="ส่งแจ้งเตือนเข้า LINE กลุ่มห้องแล็บ"
                            >
                              <span>👥 ส่ง LINE กลุ่ม</span>
                            </button>

                            <a
                              href={generateLineShareUrl(buildShiftSwapLineMessage(swap, assignees))}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#06C755] text-white hover:bg-[#05b34c] transition-colors shadow-2xs"
                              title="เปิดแอป LINE เพื่อแชร์ข้อความนี้โดยตรง"
                            >
                              <Share2 className="w-3 h-3" />
                              <span>แชร์ LINE</span>
                            </a>
                          </div>
                        </div>

                        {/* Swap Action Footer */}
                        {isPending ? (
                          <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-xs text-indigo-900 space-y-0.5">
                              <p className="font-bold flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-indigo-700" />
                                <span>รอการยืนยันรับทราบและยินยอมจาก: <strong>{target?.name || 'ผู้รับผิดชอบต่อ'}</strong></span>
                              </p>
                              <p className="text-[11px] text-indigo-800/80">
                                เจ้าหน้าที่ผู้ถูกขอแลกเวรหรือ Admin สามารถกดยืนยันรับทราบเพื่ออนุมัติการสลับเวร
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('คุณต้องการปฏิเสธคำขอแลกเวรนี้หรือไม่?')) {
                                    onAcknowledgeSwap(swap.id, false, 'ไม่สะดวกแลกเวร');
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 transition-colors"
                              >
                                ปฏิเสธ
                              </button>
                              <button
                                type="button"
                                onClick={() => promptAcknowledgeSwap(swap)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all hover:scale-[1.02]"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>ยืนยันรับทราบ & ตกลงแลกเวร</span>
                              </button>
                            </div>
                          </div>
                        ) : isApproved ? (
                          <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-950">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>ยืนยันรับทราบและยินยอมโดย: {target?.name}</span>
                                {swap.acknowledgedAt && (
                                  <span className="text-[11px] text-emerald-700 font-normal">
                                    เมื่อ {new Date(swap.acknowledgedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น. ({formatThaiDate(swap.acknowledgedAt.split('T')[0])})
                                  </span>
                                )}
                              </div>
                              {swap.targetNote && (
                                <p className="text-[11px] text-emerald-800 pl-5 italic">
                                  "{swap.targetNote}"
                                </p>
                              )}
                            </div>
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-200/80 text-emerald-900 border border-emerald-300">
                              การแลกเวรมีผลสมบูรณ์
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            แสดงผลรวม: ส่งเวร {handovers.length} รายการ | แลกเวร {swaps.length} รายการ
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* Confirmation Note Prompt Modal (For Handover Acknowledgement) */}
      {acknowledgingHandover && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setAcknowledgingHandover(null)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-emerald-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-white" />
                <h4 className="font-bold text-sm text-white">ยืนยันรับทราบการส่งมอบเวร</h4>
              </div>
              <button
                type="button"
                onClick={() => setAcknowledgingHandover(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-700">
              <p>
                คุณกำลังจะลงนามยืนยันรับทราบการส่งมอบงานในเวร <strong>{SHIFT_LABELS[acknowledgingHandover.shift]?.label}</strong> ประจำวันที่ <strong>{formatThaiDate(acknowledgingHandover.date)}</strong>
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  ข้อความตอบรับ / หมายเหตุเพิ่มเติมจากผู้รับเวร (ถ้ามี):
                </label>
                <textarea
                  rows={3}
                  value={ackNoteText}
                  onChange={(e) => setAckNoteText(e.target.value)}
                  placeholder="เช่น รับมอบเวรเรียบร้อย เคสวิกฤต ICU ทั้งหมดตรวจสอบแล้ว จะติดตามผลแล็บให้ต่อเนื่อง..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>ระบบจะบันทึกชื่อผู้ยืนยันและเวลาปัจจุบันลงในประวัติการส่งมอบเวร</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAcknowledgingHandover(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = acknowledgingHandover.id;
                  const note = ackNoteText.trim() || undefined;
                  setAcknowledgingHandover(null);
                  onAcknowledgeHandover(id, note);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
              >
                ยืนยันรับทราบเรียบร้อย
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Note Prompt Modal (For Swap Acknowledgement) */}
      {acknowledgingSwap && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setAcknowledgingSwap(null)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-indigo-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-white" />
                <h4 className="font-bold text-sm text-white">ยืนยันรับทราบและตกลงแลกเวร</h4>
              </div>
              <button
                type="button"
                onClick={() => setAcknowledgingSwap(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-700">
              <p>
                คุณกำลังจะกดยืนยันรับทราบและตกลงแลกเปลี่ยนเวรตามคำขอของ <strong>{assigneeMap.get(acknowledgingSwap.requesterId)?.name}</strong>
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  ข้อความตอบรับ / หมายเหตุ (ถ้ามี):
                </label>
                <textarea
                  rows={3}
                  value={ackNoteText}
                  onChange={(e) => setAckNoteText(e.target.value)}
                  placeholder="เช่น ยินดีแลกเวรครับ/ค่ะ, บันทึกลงตารางเวรส่วนตัวแล้ว..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-900 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-700 shrink-0" />
                <span>การแลกเวรจะมีผลสมบูรณ์และถูกบันทึกลงในระบบปฏิทินทันที</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAcknowledgingSwap(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = acknowledgingSwap.id;
                  const note = ackNoteText.trim() || undefined;
                  setAcknowledgingSwap(null);
                  onAcknowledgeSwap(id, true, note);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
              >
                ยืนยันตกลงแลกเวร
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
