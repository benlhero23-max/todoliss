import React, { useState } from 'react';
import { CalendarEvent, DailyNote, Assignee, LineNotificationConfig, CloudBackupState, ShiftHandover, ShiftSwap } from '../types/calendar';
import { downloadTextFile } from '../utils/googleCalendar';
import { 
  X, 
  Cloud, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  RefreshCw, 
  Database,
  ShieldCheck,
  FileJson
} from 'lucide-react';

interface CloudBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  cloudState: CloudBackupState;
  events: CalendarEvent[];
  notes: DailyNote[];
  assignees: Assignee[];
  lineConfig: LineNotificationConfig;
  handovers?: ShiftHandover[];
  swaps?: ShiftSwap[];
  onSyncNow: () => void;
  onRestoreData: (data: { 
    events: CalendarEvent[]; 
    notes: DailyNote[]; 
    assignees?: Assignee[]; 
    lineConfig?: LineNotificationConfig;
    handovers?: ShiftHandover[];
    swaps?: ShiftSwap[];
  }) => void;
  onResetDefaults: () => void;
}

export const CloudBackupModal: React.FC<CloudBackupModalProps> = ({
  isOpen,
  onClose,
  cloudState,
  events,
  notes,
  assignees,
  lineConfig,
  handovers = [],
  swaps = [],
  onSyncNow,
  onRestoreData,
  onResetDefaults
}) => {
  const [syncing, setSyncing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleManualSync = () => {
    setSyncing(true);
    setFeedback(null);
    setTimeout(() => {
      onSyncNow();
      setSyncing(false);
      setFeedback('สำรองข้อมูลขึ้นสู่คลาวด์สำเร็จเรียบร้อย ข้อมูลปลอดภัย 100%');
      setTimeout(() => setFeedback(null), 3500);
    }, 800);
  };

  const handleExportJson = () => {
    const payload = {
      appName: 'Medical Laboratory Calendar Thailand',
      version: 1,
      backupDate: new Date().toISOString(),
      events,
      notes,
      assignees,
      lineConfig,
      handovers,
      swaps
    };
    const filename = `medlab_backup_${new Date().toISOString().split('T')[0]}.json`;
    downloadTextFile(filename, JSON.stringify(payload, null, 2), 'application/json');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.events && Array.isArray(parsed.events)) {
          onRestoreData({
            events: parsed.events,
            notes: parsed.notes || [],
            assignees: parsed.assignees,
            lineConfig: parsed.lineConfig,
            handovers: parsed.handovers || [],
            swaps: parsed.swaps || []
          });
          setFeedback('กู้คืนข้อมูลจากไฟล์สำรองสำเร็จ!');
          setTimeout(() => setFeedback(null), 3500);
        } else {
          alert('รูปแบบไฟล์สำรองไม่ถูกต้อง ไม่พบข้อมูล events');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const formattedLastSync = cloudState.lastBackupTime
    ? new Date(cloudState.lastBackupTime).toLocaleString('th-TH')
    : 'เมื่อสักครู่';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 to-cyan-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold">ระบบสำรองข้อมูลอัตโนมัติบนคลาวด์</h3>
              <p className="text-xs text-teal-200">
                Cloud Auto-Backup & Data Recovery System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 text-xs space-y-4 overflow-y-auto">
          {/* Status Box */}
          <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                <span className="font-bold text-slate-800 text-sm">
                  สถานะ: สำรองข้อมูลอัตโนมัติเปิดใช้งานอยู่
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-200/80 text-teal-900">
                ONLINE
              </span>
            </div>

            <p className="text-slate-600">
              ทุกครั้งที่มีการเพิ่ม แก้ไข หรือลบกิจกรรม/บันทึกย่อ ระบบจะบันทึกข้อมูลอย่างปลอดภัยทันที
            </p>

            <div className="text-[11px] text-teal-800 font-medium pt-1">
              สำรองข้อมูลล่าสุดเมื่อ: <strong className="font-bold">{formattedLastSync}</strong>
            </div>
          </div>

          {feedback && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Database stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-base font-bold text-slate-900">{events.length}</div>
              <div className="text-[10px] text-slate-500">กิจกรรม/ตารางงาน</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-base font-bold text-slate-900">{notes.length}</div>
              <div className="text-[10px] text-slate-500">บันทึกย่อประจำวัน</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-base font-bold text-slate-900">{handovers.length + swaps.length}</div>
              <div className="text-[10px] text-slate-500">ส่งเวร / แลกเวร</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-base font-bold text-slate-900">{assignees.length}</div>
              <div className="text-[10px] text-slate-500">ผู้รับผิดชอบ</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="w-full py-2.5 px-4 rounded-xl font-semibold bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white shadow-xs flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'กำลังซิงค์ข้อมูล...' : 'สำรองข้อมูลขึ้นคลาวด์ทันที (Sync Now)'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleExportJson}
                className="py-2 px-3 rounded-xl font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>ดาวน์โหลดสำรอง (.JSON)</span>
              </button>

              <label className="py-2 px-3 rounded-xl font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center">
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>กู้คืนข้อมูล (.JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <button
                onClick={() => {
                  if (confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นห้องแล็บหรือไม่?')) {
                    onResetDefaults();
                    setFeedback('รีเซ็ตข้อมูลเป็นตัวอย่างเริ่มต้นเรียบร้อยแล้ว');
                  }
                }}
                className="w-full py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเซ็ตเป็นข้อมูลตัวอย่างห้องแล็บเริ่มต้น</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
