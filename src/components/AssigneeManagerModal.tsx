import React, { useState } from 'react';
import { Assignee, CalendarEvent } from '../types/calendar';
import { 
  X, 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  Palette,
  ShieldAlert
} from 'lucide-react';
import { LabIcon } from './LabIcons';

interface AssigneeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignees: Assignee[];
  onSaveAssignees: (assignees: Assignee[]) => void;
  events: CalendarEvent[];
}

const PRESET_COLORS = [
  { color: '#0284c7', bgColor: '#e0f2fe', borderColor: '#38bdf8', textColor: '#0369a1', name: 'สีฟ้าแล็บเคมี' },
  { color: '#059669', bgColor: '#d1fae5', borderColor: '#34d399', textColor: '#047857', name: 'สีเขียวมิ้นต์จุลชีวะ' },
  { color: '#7c3aed', bgColor: '#ede9fe', borderColor: '#a78bfa', textColor: '#6d28d9', name: 'สีม่วงชีวโมเลกุล' },
  { color: '#e11d48', bgColor: '#ffe4e6', borderColor: '#fb7185', textColor: '#be123c', name: 'สีแดงกุหลาบธนาคารเลือด' },
  { color: '#ea580c', bgColor: '#ffedd5', borderColor: '#fb923c', textColor: '#c2410c', name: 'สีส้มแอมเบอร์พยาธิวิทยา' },
  { color: '#0891b2', bgColor: '#cffafe', borderColor: '#22d3ee', textColor: '#0e7490', name: 'สีไซแอนควบคุมคุณภาพ' },
  { color: '#4f46e5', bgColor: '#e0e7ff', borderColor: '#818cf8', textColor: '#3730a3', name: 'สีครามงานวิจัย' },
  { color: '#db2777', bgColor: '#fce7f3', borderColor: '#f472b6', textColor: '#9d174d', name: 'สีชมพูเซลล์วิทยา' },
  { color: '#ca8a04', bgColor: '#fef9c3', borderColor: '#facc15', textColor: '#854d0e', name: 'สีทองงานบริการ' },
  { color: '#475569', bgColor: '#f1f5f9', borderColor: '#94a3b8', textColor: '#1e293b', name: 'สีเทากลางธุรการ' },
];

export const AssigneeManagerModal: React.FC<AssigneeManagerModalProps> = ({
  isOpen,
  onClose,
  assignees,
  onSaveAssignees,
  events
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [selectedColorPreset, setSelectedColorPreset] = useState(PRESET_COLORS[0]);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setEditingId('new');
    setName('');
    setRole('นักเทคนิคการแพทย์');
    setSelectedColorPreset(PRESET_COLORS[assignees.length % PRESET_COLORS.length]);
  };

  const handleStartEdit = (a: Assignee) => {
    setEditingId(a.id);
    setName(a.name);
    setRole(a.role);
    const match = PRESET_COLORS.find(c => c.color.toLowerCase() === a.color.toLowerCase()) || {
      color: a.color,
      bgColor: a.bgColor,
      borderColor: a.borderColor,
      textColor: a.textColor,
      name: 'กำหนดเอง'
    };
    setSelectedColorPreset(match);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId === 'new') {
      const newAssignee: Assignee = {
        id: `staff-${Date.now()}`,
        name: name.trim(),
        role: role.trim() || 'นักเทคนิคการแพทย์',
        color: selectedColorPreset.color,
        bgColor: selectedColorPreset.bgColor,
        borderColor: selectedColorPreset.borderColor,
        textColor: selectedColorPreset.textColor,
        avatarIcon: 'microscope'
      };
      onSaveAssignees([...assignees, newAssignee]);
    } else if (editingId) {
      const updated = assignees.map(a => {
        if (a.id === editingId) {
          return {
            ...a,
            name: name.trim(),
            role: role.trim() || a.role,
            color: selectedColorPreset.color,
            bgColor: selectedColorPreset.bgColor,
            borderColor: selectedColorPreset.borderColor,
            textColor: selectedColorPreset.textColor
          };
        }
        return a;
      });
      onSaveAssignees(updated);
    }

    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const assignedCount = events.filter(e => e.assigneeId === id).length;
    if (assignedCount > 0) {
      if (!confirm(`เจ้าหน้าที่ท่านนี้มี ${assignedCount} กิจกรรมที่ได้รับมอบหมาย คุณแน่ใจหรือไม่ว่าต้องการลบ?`)) {
        return;
      }
    }
    onSaveAssignees(assignees.filter(a => a.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-teal-800 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Users className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold">จัดการผู้รับผิดชอบงาน & แถบสีเฉพาะตัว</h3>
              <p className="text-xs text-teal-200">
                กำหนดแถบสีสำหรับแสดงผลในปฏิทินของแต่ละบุคคล
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 text-xs space-y-4 overflow-y-auto flex-1">
          {editingId ? (
            <form onSubmit={handleSave} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between font-bold text-slate-800 text-sm">
                <span>{editingId === 'new' ? '+ เพิ่มผู้รับผิดชอบใหม่' : 'แก้ไขข้อมูลผู้รับผิดชอบ'}</span>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  ยกเลิก
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ชื่อ-นามสกุล / ตำแหน่งวิชาชีพ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ทนพ.สมชาย พงษ์สิทธิ์"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  บทบาทหน้าที่ในห้องปฏิบัติการ
                </label>
                <input
                  type="text"
                  placeholder="เช่น หัวหน้างานเคมีคลินิก, นักจุลชีววิทยา, ควบคุมคุณภาพ QA"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-teal-600" />
                  <span>เลือกแถบสีเฉพาะบุคคล (Color Tag):</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                  {PRESET_COLORS.map((preset) => {
                    const isSelected = selectedColorPreset.color === preset.color;
                    return (
                      <button
                        type="button"
                        key={preset.color}
                        onClick={() => setSelectedColorPreset(preset)}
                        style={{
                          backgroundColor: preset.bgColor,
                          borderColor: isSelected ? preset.color : preset.borderColor,
                          color: preset.textColor
                        }}
                        className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center gap-1 ${
                          isSelected ? 'ring-2 ring-offset-1 font-bold' : 'opacity-80 hover:opacity-100'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full shadow-xs"
                          style={{ backgroundColor: preset.color }}
                        />
                        <span className="text-[10px] truncate max-w-full">{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              <div className="pt-2">
                <span className="text-[10px] text-slate-400 font-medium">ตัวอย่างป้ายกิจกรรมในปฏิทิน:</span>
                <div
                  style={{
                    borderLeftColor: selectedColorPreset.color,
                    backgroundColor: selectedColorPreset.bgColor,
                    color: selectedColorPreset.textColor
                  }}
                  className="p-2.5 rounded-lg border-l-4 mt-1 flex items-center justify-between"
                >
                  <span className="font-semibold text-xs text-slate-800">
                    [ตัวอย่างงานแล็บ] 08:30 น.
                  </span>
                  <span className="text-xs font-bold">
                    {name || 'ชื่อผู้รับผิดชอบ'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg font-semibold bg-teal-600 hover:bg-teal-700 text-white"
                >
                  บันทึก
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">รายชื่อเจ้าหน้าที่ ({assignees.length} ท่าน)</span>
                <button
                  onClick={handleStartAdd}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold bg-teal-600 hover:bg-teal-700 text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ เพิ่มผู้รับผิดชอบ</span>
                </button>
              </div>

              <div className="space-y-2 pt-1">
                {assignees.map((assignee) => {
                  const assignedCount = events.filter(e => e.assigneeId === assignee.id).length;

                  return (
                    <div
                      key={assignee.id}
                      style={{
                        borderLeftColor: assignee.color,
                        borderLeftWidth: '4px'
                      }}
                      className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-4 h-4 rounded-full shadow-xs shrink-0"
                          style={{ backgroundColor: assignee.color }}
                        />
                        <div>
                          <div className="font-bold text-slate-800 text-xs">
                            {assignee.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {assignee.role}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                          {assignedCount} งาน
                        </span>

                        <button
                          onClick={() => handleStartEdit(assignee)}
                          className="p-1.5 text-slate-400 hover:text-teal-700 rounded-lg hover:bg-teal-50"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {assignees.length > 1 && (
                          <button
                            onClick={() => handleDelete(assignee.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            title="ลบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
