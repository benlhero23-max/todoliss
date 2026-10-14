import React, { useState, useEffect } from 'react';
import { Assignee } from '../types/calendar';
import { 
  X, 
  Lock, 
  ShieldCheck, 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Info,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { LabIcon } from './LabIcons';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignees: Assignee[];
  currentUser: Assignee | null;
  onLogin: (user: Assignee) => void;
  onLogout: () => void;
  onUpdateUserPin: (userId: string, newPin: string) => void;
  actionContextMessage?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  assignees,
  currentUser,
  onLogin,
  onLogout,
  onUpdateUserPin,
  actionContextMessage
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Tab for change PIN
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');

  // Initial user selection
  useEffect(() => {
    if (isOpen) {
      if (currentUser) {
        setSelectedUserId(currentUser.id);
      } else if (assignees.length > 0) {
        // default select first admin if available, or first assignee
        const defaultAdmin = assignees.find(a => a.isAdmin) || assignees[0];
        setSelectedUserId(defaultAdmin.id);
      }
      setPin('');
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsChangingPin(false);
      setOldPin('');
      setNewPin('');
      setConfirmNewPin('');
    }
  }, [isOpen, currentUser, assignees]);

  if (!isOpen) return null;

  const selectedUser = assignees.find(a => a.id === selectedUserId) || assignees[0];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedUser) {
      setErrorMessage('กรุณาเลือกผู้ใช้งาน');
      return;
    }

    const expectedPin = selectedUser.pin || '1234';
    if (pin.trim() !== expectedPin) {
      setErrorMessage('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบหรือใช้รหัสเริ่มต้น 1234');
      return;
    }

    // Success login
    setSuccessMessage(`ยืนยันตัวตนสำเร็จ: ยินดีต้อนรับ ${selectedUser.name}`);
    setTimeout(() => {
      onLogin(selectedUser);
      onClose();
    }, 450);
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedUser) return;
    const currentExpectedPin = selectedUser.pin || '1234';

    if (oldPin.trim() !== currentExpectedPin) {
      setErrorMessage('รหัสผ่านเดิมไม่ถูกต้อง');
      return;
    }

    if (!newPin.trim() || newPin.trim().length < 4) {
      setErrorMessage('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }

    if (newPin !== confirmNewPin) {
      setErrorMessage('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    onUpdateUserPin(selectedUser.id, newPin.trim());
    setSuccessMessage('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสใหม่');
    setIsChangingPin(false);
    setPin(newPin.trim());
    setOldPin('');
    setNewPin('');
    setConfirmNewPin('');
  };

  const handleQuickFillPin = () => {
    const p = selectedUser?.pin || '1234';
    setPin(p);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-slate-900 text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-teal-200 shadow-inner">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">ระบบยืนยันตัวตนห้องปฏิบัติการ</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                  PIN Auth
                </span>
              </div>
              <p className="text-xs text-teal-100/80 mt-0.5">
                {actionContextMessage || 'กรุณาใส่รหัสเพื่อเพิ่ม แก้ไข หรือลบกิจกรรม'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Currently logged in alert */}
        {currentUser && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>เข้าสู่ระบบอยู่: <strong>{currentUser.name}</strong></span>
              {currentUser.isAdmin && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                  <ShieldCheck className="w-3 h-3" />
                  Admin
                </span>
              )}
            </div>
            <button
              onClick={() => {
                onLogout();
                setSuccessMessage('ออกจากระบบเรียบร้อยแล้ว');
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:underline"
            >
              <LogOut className="w-3 h-3" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        )}

        {/* Form Container */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Messages */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {!isChangingPin ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* User Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-teal-600" />
                    <span>เลือกผู้ใช้งาน / เจ้าหน้าที่</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    คลิกเพื่อเปลี่ยนผู้ใช้
                  </span>
                </label>

                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
                  {assignees.map((a) => {
                    const isSelected = a.id === selectedUserId;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setSelectedUserId(a.id);
                          setErrorMessage(null);
                        }}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-white border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                            : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: a.bgColor, color: a.textColor }}
                          >
                            <LabIcon name={a.avatarIcon} className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-xs text-slate-900 truncate">
                                {a.name}
                              </span>
                              {a.isAdmin && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  <ShieldCheck className="w-2.5 h-2.5" />
                                  Admin
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {a.role}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected User Info Card & Permissions explanation */}
              {selectedUser && (
                <div className={`p-3 rounded-xl border text-xs ${
                  selectedUser.isAdmin 
                    ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <div className="flex items-start gap-2">
                    {selectedUser.isAdmin ? (
                      <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1 text-[11px]">
                      <div className="font-semibold">
                        {selectedUser.isAdmin 
                          ? '🛡️ สิทธิ์ผู้ดูแลระบบ (System Admin)' 
                          : '👤 สิทธิ์เจ้าหน้าที่ผู้ปฏิบัติงาน (Staff)'}
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {selectedUser.isAdmin ? (
                          <>
                            <strong>{selectedUser.name}</strong> เป็นผู้ดูแลระบบที่ได้รับสิทธิ์พิเศษ
                            สามารถ<strong>เพิ่ม แก้ไข และลบกิจกรรมนัดหมายของทุกคนในห้องปฏิบัติการได้</strong>
                          </>
                        ) : (
                          <>
                            <strong>{selectedUser.name}</strong> สามารถ<strong>เพิ่ม แก้ไข หรือลบได้เฉพาะกิจกรรมนัดหมายของตนเอง</strong>เท่านั้น
                            (ไม่สามารถแก้ไขงานของผู้อื่นได้)
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* PIN input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                    <span>รหัสผ่าน / PIN ยืนยันตัวตน <span className="text-rose-500">*</span></span>
                  </label>
                  <button
                    type="button"
                    onClick={handleQuickFillPin}
                    className="text-[11px] font-medium text-teal-700 hover:text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200"
                  >
                    กดเพื่อกรอกรหัสเริ่มต้น (1234)
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="ใส่รหัสผ่าน 4 หลัก (ค่าเริ่มต้น: 1234)"
                    maxLength={10}
                    autoFocus
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-wider focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsChangingPin(true)}
                  className="text-xs text-slate-500 hover:text-slate-700 underline font-medium"
                >
                  ต้องการเปลี่ยนรหัสผ่าน?
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>ยืนยันเข้าสู่ระบบ</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Change PIN Form */
            <form onSubmit={handleChangePinSubmit} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <strong>เปลี่ยนรหัสผ่านสำหรับ:</strong> {selectedUser.name}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  รหัสผ่านเดิม <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="รหัสผ่านปัจจุบัน (ค่าเริ่มต้น 1234)"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  รหัสผ่านใหม่ (อย่างน้อย 4 หลัก) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="เช่น 5678"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ยืนยันรหัสผ่านใหม่อีกครั้ง <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsChangingPin(false)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  ย้อนกลับ
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsChangingPin(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                  >
                    บันทึกรหัสผ่านใหม่
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
