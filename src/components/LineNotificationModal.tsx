import React, { useState } from 'react';
import { LineNotificationConfig, CalendarEvent, Assignee } from '../types/calendar';
import { buildLineNotificationMessage, sendLineNotification, getTomorrowEvents } from '../utils/lineNotify';
import { formatThaiDate, formatThaiLongWithDay } from '../utils/thaiDate';
import { 
  X, 
  Send, 
  Bell, 
  Clock, 
  Calendar as CalendarIcon, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Copy, 
  Check,
  MessageSquare,
  Settings,
  Sparkles
} from 'lucide-react';

interface LineNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LineNotificationConfig;
  onSaveConfig: (config: LineNotificationConfig) => void;
  todayIso: string;
  events: CalendarEvent[];
  assignees: Assignee[];
}

export const LineNotificationModal: React.FC<LineNotificationModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  todayIso,
  events,
  assignees
}) => {
  const [token, setToken] = useState(config.channelAccessToken || '');
  const [destId, setDestId] = useState(config.destinationId || '');
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl || '');
  const [alertTime, setAlertTime] = useState(config.alertTime || '16:00');
  const [autoSend, setAutoSend] = useState(config.autoSendEnabled ?? true);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'settings' | 'logs'>('preview');

  if (!isOpen) return null;

  const { tomorrowDate, tomorrowEvents } = getTomorrowEvents(todayIso, events);
  const previewMessage = buildLineNotificationMessage(tomorrowDate, tomorrowEvents, assignees);
  const tomorrowFormatted = formatThaiLongWithDay(tomorrowDate);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: LineNotificationConfig = {
      ...config,
      channelAccessToken: token.trim(),
      destinationId: destId.trim(),
      webhookUrl: webhookUrl.trim(),
      alertTime,
      autoSendEnabled: autoSend,
    };
    onSaveConfig(updated);
    setSendResult({ success: true, text: 'บันทึกการตั้งค่าระบบ LINE API เรียบร้อยแล้ว' });
  };

  const handleTestSend = async () => {
    setIsSending(true);
    setSendResult(null);

    const tempConfig: LineNotificationConfig = {
      ...config,
      channelAccessToken: token.trim(),
      destinationId: destId.trim(),
      webhookUrl: webhookUrl.trim(),
      alertTime,
      autoSendEnabled: autoSend
    };

    try {
      const result = await sendLineNotification(tempConfig, tomorrowDate, tomorrowEvents, assignees);
      
      const newLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        targetDate: tomorrowDate,
        eventCount: tomorrowEvents.length,
        status: result.success ? ('success' as const) : ('failed' as const),
        messagePreview: result.message.slice(0, 100) + '...'
      };

      const updatedLogs = [newLog, ...(config.logs || [])].slice(0, 20);
      onSaveConfig({ ...tempConfig, logs: updatedLogs, lastRunDate: todayIso });

      setSendResult({
        success: result.success,
        text: result.statusText
      });
    } catch (err: any) {
      setSendResult({
        success: false,
        text: `เกิดข้อผิดพลาด: ${err?.message || 'Unknown error'}`
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(previewMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Bell className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">ระบบแจ้งเตือนกิจกรรมเข้ากลุ่ม LINE</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-800/60 text-emerald-200 border border-emerald-400/30">
                  LINE Messaging API
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                แจ้งเตือนล่วงหน้า 1 วัน ประจำเวลา 16:00 น. อัตโนมัติ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rule Highlight Banner */}
        <div className="bg-emerald-50/80 border-b border-emerald-100 p-3 sm:px-6 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-900">
            <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>เงื่อนไขการแจ้งเตือน:</strong> ล่วงหน้า 1 วัน ณ เวลา <strong>16:00 น.</strong> (ส่งสรุปงานวันพรุ่งนี้)
            </span>
          </div>
          <div className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-200/60 text-emerald-800">
            พบ {tomorrowEvents.length} กิจกรรมสำหรับพรุ่งนี้
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'preview'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>ตัวอย่างข้อความ LINE ({tomorrowEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'settings'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>ตั้งค่า Bot & กลุ่มไลน์</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'logs'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ประวัติการส่ง ({config.logs?.length || 0})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs space-y-4">
          {sendResult && (
            <div className={`p-3 rounded-xl border flex items-center gap-2 ${
              sendResult.success 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {sendResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{sendResult.text}</span>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-semibold text-slate-800">
                  กำหนดส่งสำหรับ: <span className="text-teal-700">{tomorrowFormatted}</span>
                </span>
                <button
                  onClick={handleCopyText}
                  className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-800 font-medium"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกข้อความ'}</span>
                </button>
              </div>

              {/* Mock LINE Chat Bubble */}
              <div className="bg-[#798e9c]/20 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    🧪
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 max-w-lg shadow-sm border border-slate-200 text-slate-800 space-y-1 font-sans">
                    <div className="text-[11px] font-bold text-emerald-700 border-b border-slate-100 pb-1 flex items-center justify-between">
                      <span>LINE Medical Lab Bot</span>
                      <span className="text-[9px] text-slate-400 font-normal">16:00 น.</span>
                    </div>
                    <pre className="text-xs whitespace-pre-wrap font-sans text-slate-700 leading-relaxed pt-1">
                      {previewMessage}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
                <p className="text-[11px] text-slate-500">
                  ระบบจะตรวจสอบและส่งสรุปนี้อัตโนมัติทุกวันเมื่อถึงเวลา 16:00 น.
                </p>
                <button
                  onClick={handleTestSend}
                  disabled={isSending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'กำลังส่งแจ้งเตือน...' : 'ทดสอบส่งเข้า LINE ทันที'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  เวลาส่งแจ้งเตือนประจำวัน (ค่าเริ่มต้น: 16:00 น.)
                </label>
                <input
                  type="time"
                  value={alertTime}
                  onChange={(e) => setAlertTime(e.target.value)}
                  className="w-full sm:w-48 text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  * กำหนดการแจ้งเตือนล่วงหน้า 1 วัน ณ เวลา 16.00 น.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  LINE Messaging API: Channel Access Token
                </label>
                <input
                  type="password"
                  placeholder="ใส่ Channel Access Token (Long-lived) จาก LINE Developers Console"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Destination ID (Group ID หรือ User ID กลุ่มไลน์ห้องปฏิบัติการ)
                </label>
                <input
                  type="text"
                  placeholder="เช่น c1234567890abcdef... หรือ u12345..."
                  value={destId}
                  onChange={(e) => setDestId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  หรือใช้ Webhook Proxy URL (เช่น Google Apps Script / Make / Cloud Function)
                </label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/... หรือ https://hook.eu1.make.com/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  หากเรียก LINE API จาก Browser โดยตรงอาจติด CORS การใส่ Webhook Proxy จะช่วยให้ส่งเข้ากลุ่มไลน์ได้ 100%
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoSendCheck"
                  checked={autoSend}
                  onChange={(e) => setAutoSend(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                />
                <label htmlFor="autoSendCheck" className="text-slate-700 font-medium">
                  เปิดระบบแจ้งเตือนอัตโนมัติล่วงหน้า 1 วัน ณ เวลา 16.00 น.
                </label>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  บันทึกการตั้งค่า
                </button>
              </div>
            </form>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-2">
              {(!config.logs || config.logs.length === 0) ? (
                <p className="text-slate-400 text-center py-6">ยังไม่มีประวัติการส่งแจ้งเตือน</p>
              ) : (
                config.logs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-800">
                        สำหรับวันที่: {log.targetDate} ({log.eventCount} รายการ)
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        log.status === 'success' ? 'bg-emerald-100 text-emerald-800' :
                        log.status === 'simulated' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {log.status === 'success' ? 'ส่งสำเร็จ' : log.status === 'simulated' ? 'จำลองสำเร็จ' : 'ล้มเหลว'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      เวลาส่ง: {new Date(log.timestamp).toLocaleString('th-TH')}
                    </div>
                    <p className="text-[11px] text-slate-600 truncate">{log.messagePreview}</p>
                  </div>
                ))
              )}
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
