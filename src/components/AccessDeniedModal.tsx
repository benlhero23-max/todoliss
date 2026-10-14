import React from 'react';
import { Assignee, CalendarEvent } from '../types/calendar';
import { 
  ShieldAlert, 
  X, 
  Lock, 
  User, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { LabIcon } from './LabIcons';

interface AccessDeniedModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  eventOwner: Assignee | undefined;
  currentUser: Assignee | null;
  onSwitchToAdmin: () => void;
  actionType: 'edit' | 'delete' | 'add_for_other';
}

export const AccessDeniedModal: React.FC<AccessDeniedModalProps> = ({
  isOpen,
  onClose,
  event,
  eventOwner,
  currentUser,
  onSwitchToAdmin,
  actionType
}) => {
  if (!isOpen) return null;

  const actionText = actionType === 'edit' 
    ? 'แก้ไขกิจกรรม' 
    : actionType === 'delete' 
      ? 'ลบกิจกรรม' 
      : 'มอบหมายงานให้ผู้อื่น';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-700 to-amber-700 text-white p-4 sm:p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-rose-100 shadow-inner">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">สงวนสิทธิ์การ{actionText}</h3>
              <p className="text-xs text-rose-100/90 mt-0.5">
                การจัดการกิจกรรมของผู้อื่นต้องใช้สิทธิ์ Admin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Target Event Info */}
          {event && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="font-semibold text-slate-900 text-xs truncate">
                📌 {event.title}
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                <span>วันที่: {event.date}</span>
                <span>•</span>
                <span>เวลา: {event.startTime} - {event.endTime} น.</span>
              </div>
              <div className="pt-1 flex items-center gap-2">
                <span className="text-slate-500">ผู้รับผิดชอบงาน:</span>
                <span className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  <User className="w-3 h-3 text-teal-600" />
                  {eventOwner?.name || 'ไม่ระบุชื่อ'}
                </span>
              </div>
            </div>
          )}

          {/* Current User Status */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>สถานะของคุณในปัจจุบัน:</span>
            </div>
            <p className="text-slate-700 leading-relaxed text-[11px]">
              {currentUser ? (
                <>
                  เข้าสู่ระบบในชื่อ <strong>{currentUser.name}</strong> ({currentUser.role})
                  <br />
                  <span className="text-amber-800 font-medium">
                    คุณมีสิทธิ์{actionText}เฉพาะกิจกรรมที่เป็นของตนเองเท่านั้น
                  </span>
                </>
              ) : (
                <>ยังไม่ได้ยืนยันตัวตน กรุณาใส่รหัสเพื่อดำเนินการ</>
              )}
            </p>
          </div>

          {/* Admin Policy explanation */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-indigo-950 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-indigo-900">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>ผู้ดูแลระบบ (Admin) ที่มีสิทธิ์แก้ไขงานของผู้อื่น:</span>
            </div>
            <ul className="space-y-1.5 pl-1 text-[11px]">
              <li className="flex items-center gap-2 bg-white/80 px-2.5 py-1.5 rounded-lg border border-indigo-100">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                <strong className="text-slate-900">นางสาวอังคณา สักกะโต</strong>
                <span className="text-slate-500 text-[10px]">(Admin)</span>
              </li>
              <li className="flex items-center gap-2 bg-white/80 px-2.5 py-1.5 rounded-lg border border-indigo-100">
                <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                <strong className="text-slate-900">นายมณเฑียร ดีขุนทด</strong>
                <span className="text-slate-500 text-[10px]">(Admin)</span>
              </li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              ปิดหน้าต่าง
            </button>
            <button
              onClick={() => {
                onClose();
                onSwitchToAdmin();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>สลับเข้าใช้งานด้วยสิทธิ์ Admin (ใส่รหัส)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
