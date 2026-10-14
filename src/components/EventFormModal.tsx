import React, { useState, useEffect } from 'react';
import { CalendarEvent, Assignee, LabCategory, EventPriority } from '../types/calendar';
import { formatThaiLongWithDay } from '../utils/thaiDate';
import { LAB_CATEGORY_LABELS } from '../data/defaultAssignees';
import { 
  X, 
  Clock, 
  MapPin, 
  User, 
  Calendar as CalendarIcon, 
  AlertTriangle, 
  Tag, 
  FileText,
  Check,
  Building
} from 'lucide-react';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id' | 'createdAt'>, eventId?: string) => void;
  initialDate?: string;
  editingEvent?: CalendarEvent | null;
  assignees: Assignee[];
  currentUser: Assignee | null;
}

const COMMON_LAB_LOCATIONS = [
  'ห้องแล็บ 3B เคมีคลินิก ชั้น 3',
  'ห้องปฏิบัติการชีวโมเลกุล (PCR Clean Room)',
  'ธนาคารเลือดและห้องเตรียมโลหิต (Blood Bank)',
  'ห้องปฏิบัติการจุลชีววิทยาและการทดสอบเชื้อ',
  'ห้องปฏิบัติการควบคุมคุณภาพ QC Lab',
  'ห้องประชุมวิชาการพยาธิวิทยา อาคารเฉลิมพระเกียรติ',
  'จุดรับ-ส่งสิ่งส่งตรวจภายนอก (Send-out)',
  'ห้องแล็บฉุกเฉิน STAT Lab ชั้น 1'
];

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDate,
  editingEvent,
  assignees,
  currentUser
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('11:30');
  const [location, setLocation] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [category, setCategory] = useState<LabCategory>('lab_run');
  const [priority, setPriority] = useState<EventPriority>('normal');
  const [description, setDescription] = useState('');

  const isAdmin = currentUser?.isAdmin || false;

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setDate(editingEvent.date);
      setStartTime(editingEvent.startTime || '08:30');
      setEndTime(editingEvent.endTime || '11:30');
      setLocation(editingEvent.location || '');
      setAssigneeId(editingEvent.assigneeId || assignees[0]?.id || '');
      setCategory(editingEvent.category || 'lab_run');
      setPriority(editingEvent.priority || 'normal');
      setDescription(editingEvent.description || '');
    } else {
      setTitle('');
      setDate(initialDate || new Date().toISOString().split('T')[0]);
      setStartTime('08:30');
      setEndTime('11:30');
      setLocation('');
      // If user is logged in and not admin, force default to themselves
      if (currentUser && !currentUser.isAdmin) {
        setAssigneeId(currentUser.id);
      } else {
        setAssigneeId(currentUser?.id || assignees[0]?.id || '');
      }
      setCategory('lab_run');
      setPriority('normal');
      setDescription('');
    }
  }, [editingEvent, initialDate, assignees, currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    onSave(
      {
        title: title.trim(),
        date,
        startTime,
        endTime,
        location: location.trim(),
        assigneeId: assigneeId || assignees[0]?.id || 'staff-1',
        category,
        priority,
        description: description.trim(),
      },
      editingEvent ? editingEvent.id : undefined
    );

    onClose();
  };

  const selectedAssignee = assignees.find(a => a.id === assigneeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-slate-800 text-white p-4 sm:p-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">
              {editingEvent ? 'แก้ไขกิจกรรม / ตารางงาน' : 'เพิ่มนัดหมายกิจกรรมใหม่'}
            </h3>
            <p className="text-xs text-teal-200 mt-0.5">
              กำหนดช่วงเวลา สถานที่ และผู้รับผิดชอบงานในห้องปฏิบัติการ
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              ชื่องาน / กิจกรรม <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น ตรวจสอบสารเคมี, รันตัวอย่าง Routine, ประชุม Case Conference"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            />
          </div>

          {/* Date & Times */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                วันที่ <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/30"
              />
              {date && (
                <div className="text-[10px] text-teal-700 font-medium mt-1 truncate">
                  {formatThaiLongWithDay(date)}
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                เวลาเริ่มต้น <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/30"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                เวลาสิ้นสุด <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/30"
              />
            </div>
          </div>

          {/* Location with suggestions */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              สถานที่จัดกิจกรรมให้ชัดเจน <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="เช่น ห้องแล็บ 3B อาคารเคมีคลินิก ชั้น 3"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
            </div>

            {/* Quick location chips */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              <span className="text-[10px] text-slate-400 py-0.5">เลือกสถานที่แนะนำ:</span>
              {COMMON_LAB_LOCATIONS.slice(0, 4).map((loc) => (
                <button
                  type="button"
                  key={loc}
                  onClick={() => setLocation(loc)}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 border border-slate-200 transition-colors"
                >
                  {loc.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Responsible Person (Assignee) with Color Preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">
                ผู้รับผิดชอบงาน (พร้อมแถบสีประจำตัว) <span className="text-rose-500">*</span>
              </label>
              {isAdmin ? (
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  🛡️ สิทธิ์ Admin: เลือกมอบหมายให้ทุกคนได้
                </span>
              ) : currentUser ? (
                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  👤 เจ้าหน้าที่: จัดการเฉพาะงานของตนเอง
                </span>
              ) : null}
            </div>

            {!isAdmin && currentUser && (
              <div className="mb-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
                คุณเข้าสู่ระบบในชื่อ <strong>{currentUser.name}</strong> จึงสามารถสร้างงานสำหรับตนเองได้ หากต้องการมอบหมายงานให้ผู้อื่น กรุณาติดต่อผู้ดูแลระบบ (Admin): <strong>นางสาวอังคณา สักกะโต</strong> หรือ <strong>นายมณเฑียร ดีขุนทด</strong>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {assignees.map((assignee) => {
                const isSelected = assigneeId === assignee.id;
                // If user is logged in, not admin, and this assignee is not current user
                const isLockedForStaff = currentUser && !isAdmin && assignee.id !== currentUser.id;

                return (
                  <div
                    key={assignee.id}
                    onClick={() => {
                      if (isLockedForStaff) {
                        alert(`คุณไม่มีสิทธิ์เลือกมอบหมายงานให้ผู้อื่น\nเฉพาะผู้ดูแลระบบ (Admin) ได้แก่ นางสาวอังคณา สักกะโต และ นายมณเฑียร ดีขุนทด เท่านั้นที่มีสิทธิ์มอบหมายงานให้บุคคลอื่น`);
                        return;
                      }
                      setAssigneeId(assignee.id);
                    }}
                    style={{
                      borderColor: isSelected ? assignee.color : '#e2e8f0',
                      backgroundColor: isSelected ? assignee.bgColor : isLockedForStaff ? '#f8fafc' : '#ffffff',
                      opacity: isLockedForStaff ? 0.6 : 1
                    }}
                    className={`p-2 rounded-xl border flex items-center gap-2.5 transition-all ${
                      isLockedForStaff 
                        ? 'cursor-not-allowed' 
                        : 'cursor-pointer hover:bg-slate-50'
                    } ${
                      isSelected ? 'ring-2 ring-offset-1 shadow-xs' : ''
                    }`}
                    title={isLockedForStaff ? 'เฉพาะ Admin เท่านั้นที่สามารถมอบหมายงานให้ผู้อื่นได้' : undefined}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: assignee.color }}
                    />
                    <div className="truncate flex-1">
                      <div className="font-semibold text-slate-800 truncate leading-tight flex items-center gap-1">
                        <span className="truncate">{assignee.name}</span>
                        {assignee.isAdmin && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-100 text-indigo-700 shrink-0 font-bold">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {assignee.role}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-teal-700 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ประเภทกิจกรรม
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as LabCategory)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                {Object.entries(LAB_CATEGORY_LABELS).map(([key, info]) => (
                  <option key={key} value={key}>{info.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ระดับความสำคัญ
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as EventPriority)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
              >
                <option value="normal">ปกติ (Routine)</option>
                <option value="high">ความสำคัญสูง (High)</option>
                <option value="stat">🚨 ด่วนพิเศษ (STAT)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              รายละเอียดเพิ่มเติม / ข้อควรระวังในการตรวจ
            </label>
            <textarea
              rows={3}
              placeholder="ระบุรายละเอียด เช่น จำนวนตัวอย่าง, ชนิดของสารเคมี, หมายเหตุสำหรับเวรต่อไป..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 resize-y"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-600/30 transition-all"
            >
              {editingEvent ? 'บันทึกการแก้ไข' : 'เพิ่มนัดหมายกิจกรรม'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
