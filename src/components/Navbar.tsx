import React from 'react';
import { 
  FlaskConical, 
  Calendar as CalendarIcon, 
  Cloud, 
  Plus, 
  Users, 
  CheckCircle2, 
  RefreshCw,
  Bell,
  Lock,
  ShieldCheck,
  UserCheck,
  LogOut,
  ArrowRightLeft
} from 'lucide-react';
import { formatThaiDate } from '../utils/thaiDate';
import { CloudBackupState, Assignee } from '../types/calendar';
import { LabIcon } from './LabIcons';

interface NavbarProps {
  todayIso: string;
  cloudState: CloudBackupState;
  currentUser: Assignee | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onOpenNewEvent: () => void;
  onOpenLineModal: () => void;
  onOpenGCalModal: () => void;
  onOpenCloudModal: () => void;
  onOpenAssigneeModal: () => void;
  onOpenShiftModal: () => void;
  tomorrowEventCount: number;
  pendingShiftCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  todayIso,
  cloudState,
  currentUser,
  onOpenAuthModal,
  onLogout,
  onOpenNewEvent,
  onOpenLineModal,
  onOpenGCalModal,
  onOpenCloudModal,
  onOpenAssigneeModal,
  onOpenShiftModal,
  tomorrowEventCount,
  pendingShiftCount
}) => {
  const formattedToday = formatThaiDate(todayIso);

  return (
    <header className="bg-white border-b border-teal-100 shadow-xs sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Date */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white flex items-center justify-center shadow-sm shadow-teal-500/20">
            <FlaskConical className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                ปฏิทินห้องปฏิบัติการทางการแพทย์
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
                ระบบ พ.ศ. & วันสำคัญไทย
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>วันนี้: <strong className="text-teal-700 font-semibold">{formattedToday}</strong></span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">Medical Laboratory Schedule Hub</span>
            </div>
          </div>
        </div>

        {/* Quick Actions & Auth */}
        <div className="flex items-center flex-wrap gap-2">
          {/* User Auth State Pill */}
          {currentUser ? (
            <div className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100/80 p-1 rounded-xl border border-slate-200 transition-colors">
              <button
                onClick={onOpenAuthModal}
                className="inline-flex items-center gap-2 px-2 py-1 text-left text-xs"
                title="คลิกเพื่อสลับผู้ใช้ หรือดูสิทธิ์การใช้งาน"
              >
                <div 
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: currentUser.bgColor, color: currentUser.textColor }}
                >
                  <LabIcon name={currentUser.avatarIcon} className="w-3.5 h-3.5" />
                </div>
                <div className="leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-slate-900 text-xs truncate max-w-[130px]">
                      {currentUser.name}
                    </span>
                    {currentUser.isAdmin ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-600 text-white shadow-2xs">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-200 text-slate-700">
                        Staff
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 block truncate max-w-[130px]">
                    {currentUser.role}
                  </span>
                </div>
              </button>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                title="ออกจากระบบ"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors shadow-2xs"
              title="เข้าสู่ระบบด้วยรหัส PIN เพื่อเพิ่ม แก้ไข หรือลบกิจกรรม"
            >
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>เข้าสู่ระบบ (ใส่รหัส PIN)</span>
            </button>
          )}

          {/* Cloud Auto-Backup Status Indicator */}
          <button
            onClick={onOpenCloudModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
            title="คลิกเพื่อดูประวัติและการสำรองข้อมูลอัตโนมัติบนคลาวด์"
          >
            {cloudState.syncStatus === 'syncing' ? (
              <RefreshCw className="w-3.5 h-3.5 text-teal-600 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <Cloud className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">คลาวด์:</span>
            <span className="text-emerald-700 font-semibold hidden sm:inline">สำรองอัตโนมัติ</span>
          </button>

          {/* LINE Notification Alert 16:00 Button */}
          <button
            onClick={onOpenLineModal}
            className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors"
            title="ระบบแจ้งเตือนไลน์ล่วงหน้า 1 วัน เวลา 16.00 น."
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute -top-0.5 -right-0.5" />
            <Bell className="w-3.5 h-3.5 text-emerald-600" />
            <span>LINE แจ้งเตือน 16:00</span>
            {tomorrowEventCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-emerald-600 text-white rounded-full text-[10px] font-bold">
                พรุ่งนี้ {tomorrowEventCount}
              </span>
            )}
          </button>

          {/* Google Calendar Sync Button */}
          <button
            onClick={onOpenGCalModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">ซิงค์ G-Cal</span>
          </button>

          {/* Shift Handover & Swap Button */}
          <button
            onClick={onOpenShiftModal}
            className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 transition-all hover:scale-[1.02]"
            title="บันทึกการส่งมอบเวรและการแลกเวรห้องปฏิบัติการ"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
            <span>ส่งเวร & แลกเวร</span>
            {pendingShiftCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold animate-pulse" title={`มี ${pendingShiftCount} รายการรอการยืนยันรับทราบ`}>
                รอรับทราบ {pendingShiftCount}
              </span>
            )}
          </button>

          {/* Assignees & Color Tags Button */}
          <button
            onClick={onOpenAssigneeModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
            title="จัดการรายชื่อและแถบสีเฉพาะของผู้รับผิดชอบ"
          >
            <Users className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden md:inline">ผู้รับผิดชอบ & สี</span>
          </button>

          {/* Add New Event Button */}
          <button
            onClick={onOpenNewEvent}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>+ นัดหมายกิจกรรม</span>
          </button>
        </div>
      </div>
    </header>
  );
};
