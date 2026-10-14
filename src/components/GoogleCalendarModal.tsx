import React, { useState } from 'react';
import { CalendarEvent, Assignee } from '../types/calendar';
import { generateIcsCalendar, downloadTextFile, createGoogleCalendarUrl } from '../utils/googleCalendar';
import { 
  X, 
  Calendar as CalendarIcon, 
  Download, 
  Share2, 
  CheckCircle2, 
  ExternalLink,
  HelpCircle,
  FileCheck,
  Sparkles
} from 'lucide-react';

interface GoogleCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  assignees: Assignee[];
}

export const GoogleCalendarModal: React.FC<GoogleCalendarModalProps> = ({
  isOpen,
  onClose,
  events,
  assignees
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownloadIcs = () => {
    const icsContent = generateIcsCalendar(events, assignees);
    const filename = `medlab_calendar_${new Date().toISOString().split('T')[0]}.ics`;
    downloadTextFile(filename, icsContent, 'text/calendar;charset=utf-8');
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const sampleEvent = events[0];
  const sampleUrl = sampleEvent ? createGoogleCalendarUrl(sampleEvent, assignees.find(a => a.id === sampleEvent.assigneeId)) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <h3 className="text-lg font-bold">ซิงค์ข้อมูลกับ Google Calendar</h3>
              <p className="text-xs text-blue-100">
                เชื่อมต่อตารางงานแล็บและกิจกรรมเข้ากับปฏิทิน Google ได้อย่างสะดวก
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs space-y-4">
          {/* Method 1: Export .ICS */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-800 text-sm">
                  วิธีที่ 1: ดาวน์โหลดไฟล์ปฏิทิน .ICS เพื่อนำเข้า Google Calendar
                </span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                มี {events.length} กิจกรรม
              </span>
            </div>

            <p className="text-slate-600">
              สร้างไฟล์มาตรฐาน iCalendar (.ics) บันทึกกิจกรรมทั้งหมดพร้อมสถานที่, ผู้รับผิดชอบ และช่วงเวลา รองรับทั้ง Google Calendar, Outlook และ Apple Calendar
            </p>

            <button
              onClick={handleDownloadIcs}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลดไฟล์ .ICS สำหรับ Google Calendar</span>
            </button>

            {downloadSuccess && (
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs pt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>ดาวน์โหลดไฟล์สำเร็จแล้ว! สามารถนำเข้า Google Calendar ได้ทันที</span>
              </div>
            )}
          </div>

          {/* Method 2: 1-Click Sync Web Template */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-teal-600" />
              <span className="font-bold text-slate-800 text-sm">
                วิธีที่ 2: เพิ่มลง Google Calendar โดยตรงแบบรายกิจกรรม (1-Click)
              </span>
            </div>
            <p className="text-slate-600">
              เมื่อคลิกที่วันใดๆ ในปฏิทิน จะมีปุ่ม <strong>"ซิงค์ G-Cal"</strong> ในแต่ละกิจกรรม เมื่อคลิกจะเปิด Google Calendar ขึ้นมาพร้อมกรอกหัวข้อ, เวลา, สถานที่ และผู้รับผิดชอบให้อัตโนมัติ
            </p>

            {sampleUrl && (
              <div className="pt-2">
                <a
                  href={sampleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  <span>ทดสอบซิงค์กิจกรรมแรก: "{sampleEvent?.title.slice(0, 30)}..."</span>
                </a>
              </div>
            )}
          </div>

          {/* Step by step guide */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <span>ขั้นตอนการนำเข้าสู่ Google Calendar:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed pl-1">
              <li>คลิกปุ่ม <strong>"ดาวน์โหลดไฟล์ .ICS"</strong> ด้านบน</li>
              <li>เปิดเว็บไซต์ <strong>Google Calendar (calendar.google.com)</strong></li>
              <li>คลิกที่ไอคอน ⚙️ <strong>การตั้งค่า (Settings)</strong> ที่มุมขวาบน</li>
              <li>เลือกเมนู <strong>"นำเข้าและส่งออก (Import & Export)"</strong> ที่แถบด้านซ้าย</li>
              <li>กด <strong>"เลือกไฟล์จากคอมพิวเตอร์ของคุณ"</strong> แล้วเลือกไฟล์ .ics ที่เพิ่งดาวน์โหลด</li>
              <li>กดปุ่ม <strong>"นำเข้า (Import)"</strong> กิจกรรมห้องปฏิบัติการทั้งหมดจะปรากฏใน Google Calendar ทันที!</li>
            </ol>
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
