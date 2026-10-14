import React, { useState } from 'react';
import { 
  LabAnnouncement, 
  Assignee, 
  LineNotificationConfig 
} from '../types/calendar';
import { 
  Megaphone, 
  AlertTriangle, 
  Wrench, 
  ClipboardCheck, 
  Pin, 
  Plus, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Share2, 
  Send, 
  Trash2, 
  Calendar, 
  Sparkles,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { formatThaiDate } from '../utils/thaiDate';
import { buildAnnouncementLineMessage, generateLineShareUrl, sendCustomLineMessage } from '../utils/lineNotify';

interface LabAnnouncementBannerProps {
  announcements: LabAnnouncement[];
  assignees: Assignee[];
  currentUser: Assignee | null;
  lineConfig: LineNotificationConfig;
  onAddAnnouncement: (announcement: Omit<LabAnnouncement, 'id'>) => void;
  onDeleteAnnouncement: (id: string) => void;
  onSendLineNotify: (message: string, recipient?: { type: 'group' | 'individual'; name?: string; destinationId?: string }) => Promise<void>;
  onRequestAuth: (contextMessage?: string, onAuthenticated?: (user?: Assignee) => void) => void;
}

export const LabAnnouncementBanner: React.FC<LabAnnouncementBannerProps> = ({
  announcements,
  assignees,
  currentUser,
  lineConfig,
  onAddAnnouncement,
  onDeleteAnnouncement,
  onSendLineNotify,
  onRequestAuth
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Add Announcement Form state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<LabAnnouncement['category']>('urgent');
  const [newIsPinned, setNewIsPinned] = useState(true);
  const [newAuthor, setNewAuthor] = useState(currentUser?.name || assignees[0]?.name || 'หัวหน้าห้องปฏิบัติการ');
  const [notifyLineOnCreate, setNotifyLineOnCreate] = useState(true);
  const [sendTargetMode, setSendTargetMode] = useState<'group' | 'individual'>('group');
  const [selectedIndividualId, setSelectedIndividualId] = useState<string>(assignees[0]?.id || '');

  // Filtered announcements
  const filtered = announcements.filter(a => {
    if (selectedCategory === 'all') return true;
    return a.category === selectedCategory;
  });

  const pinnedCount = announcements.filter(a => a.isPinned).length;
  const urgentCount = announcements.filter(a => a.category === 'urgent').length;

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const authorStaff = assignees.find(a => a.name === newAuthor);
    const newAnnouncement: Omit<LabAnnouncement, 'id'> = {
      title: newTitle.trim(),
      content: newContent.trim(),
      date: new Date().toISOString().split('T')[0],
      category: newCategory,
      isPinned: newIsPinned,
      author: newAuthor,
      authorRole: authorStaff?.role || (currentUser?.isAdmin ? 'ผู้ดูแลระบบ (Admin)' : 'เจ้าหน้าที่ห้องปฏิบัติการ'),
      lineNotified: notifyLineOnCreate
    };

    onAddAnnouncement(newAnnouncement);

    // If opted to send LINE notification immediately
    if (notifyLineOnCreate) {
      const fullAnn: LabAnnouncement = { ...newAnnouncement, id: 'temp-' + Date.now() };
      const lineMsg = buildAnnouncementLineMessage(fullAnn);
      
      if (sendTargetMode === 'group') {
        await onSendLineNotify(lineMsg, { type: 'group', name: 'LINE กลุ่มห้องแล็บ' });
      } else {
        const targetStaff = assignees.find(a => a.id === selectedIndividualId);
        await onSendLineNotify(lineMsg, { 
          type: 'individual', 
          name: targetStaff?.name || 'เจ้าหน้าที่', 
          destinationId: targetStaff?.lineUserId 
        });
      }
    }

    // Reset and close
    setNewTitle('');
    setNewContent('');
    setIsAddModalOpen(false);
  };

  const handleShareToLine = (ann: LabAnnouncement, mode: 'group' | 'individual', targetStaff?: Assignee) => {
    const msg = buildAnnouncementLineMessage(ann);
    if (mode === 'group') {
      onSendLineNotify(msg, { type: 'group', name: 'LINE กลุ่มห้องแล็บ' });
    } else if (targetStaff) {
      onSendLineNotify(msg, { 
        type: 'individual', 
        name: targetStaff.name, 
        destinationId: targetStaff.lineUserId 
      });
    }
  };

  const getCategoryTheme = (cat: LabAnnouncement['category']) => {
    switch (cat) {
      case 'urgent':
        return {
          badge: 'bg-rose-100 text-rose-800 border-rose-200',
          card: 'bg-gradient-to-r from-rose-50/90 via-rose-50/50 to-white border-rose-300 ring-1 ring-rose-400/20',
          icon: <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />,
          label: '🚨 ด่วนพิเศษ / STAT'
        };
      case 'maintenance':
        return {
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          card: 'bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-white border-amber-300 ring-1 ring-amber-400/20',
          icon: <Wrench className="w-4 h-4 text-amber-600 shrink-0" />,
          label: '🔬 ซ่อมบำรุง / เครื่องมือ'
        };
      case 'audit':
        return {
          badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          card: 'bg-gradient-to-r from-indigo-50/90 via-indigo-50/50 to-white border-indigo-300 ring-1 ring-indigo-400/20',
          icon: <ClipboardCheck className="w-4 h-4 text-indigo-600 shrink-0" />,
          label: '📋 มาตรฐาน ISO 15189 / HA'
        };
      default:
        return {
          badge: 'bg-teal-100 text-teal-800 border-teal-200',
          card: 'bg-gradient-to-r from-teal-50/90 via-teal-50/50 to-white border-teal-300 ring-1 ring-teal-400/20',
          icon: <Megaphone className="w-4 h-4 text-teal-600 shrink-0" />,
          label: '📢 ประกาศทั่วไป'
        };
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl shadow-lg border border-slate-800 overflow-hidden mb-4 transition-all">
      {/* Header Bar */}
      <div className="p-3.5 sm:px-5 sm:py-3.5 bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md">
            <Megaphone className="w-4 h-4 animate-bounce" />
            {urgentCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-400 border-2 border-slate-900 animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>กระดานประกาศแจ้งเตือนห้องปฏิบัติการ</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Lab Announcement Hub
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-300">
              แจ้งข้อมูลด่วน, งานบำรุงรักษาเครื่องมือ, ตรวจประเมินคุณภาพ ISO และส่งต่อไปยัง LINE กลุ่มหรือรายบุคคล
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (!currentUser) {
                onRequestAuth('เพื่อลงประกาศแจ้งข่าวห้องปฏิบัติการ', (u) => {
                  if (u) setIsAddModalOpen(true);
                });
                return;
              }
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white shadow-sm transition-all hover:scale-[1.02]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ สร้างประกาศใหม่</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title={isExpanded ? 'ย่อแถบประกาศ' : 'ขยายแถบประกาศ'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Body */}
      {isExpanded && (
        <div className="p-3.5 sm:p-4 bg-slate-950/70 space-y-3">
          {/* Category Filter Pills */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 text-[11px] font-medium mr-1">หมวดหมู่:</span>
              {[
                { id: 'all', label: `ทั้งหมด (${announcements.length})` },
                { id: 'urgent', label: `🚨 ด่วนพิเศษ (${announcements.filter(a => a.category === 'urgent').length})` },
                { id: 'audit', label: `📋 ISO/HA (${announcements.filter(a => a.category === 'audit').length})` },
                { id: 'maintenance', label: `🔬 ซ่อมบำรุง (${announcements.filter(a => a.category === 'maintenance').length})` },
                { id: 'general', label: `📢 ทั่วไป (${announcements.filter(a => a.category === 'general').length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-2.5 py-1 rounded-lg transition-all text-xs font-semibold ${
                    selectedCategory === tab.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Pin className="w-3 h-3 text-amber-400" />
              <span>ปักหมุดสำคัญ {pinnedCount} รายการ</span>
            </div>
          </div>

          {/* Announcements Grid */}
          {filtered.length === 0 ? (
            <div className="p-6 text-center bg-slate-900/60 rounded-xl border border-dashed border-slate-800 text-slate-400 text-xs">
              ไม่มีรายการประกาศในหมวดหมู่นี้ คุณสามารถคลิก "+ สร้างประกาศใหม่" เพื่อแจ้งข่าวสารแก่ทีม
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(ann => {
                const theme = getCategoryTheme(ann.category);
                const shareUrl = generateLineShareUrl(buildAnnouncementLineMessage(ann));
                const canDelete = currentUser && (currentUser.isAdmin || currentUser.name === ann.author);

                return (
                  <div
                    key={ann.id}
                    className={`rounded-xl p-4 border transition-all relative flex flex-col justify-between ${theme.card} text-slate-900 shadow-sm`}
                  >
                    <div>
                      {/* Top status */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${theme.badge}`}>
                            {theme.icon}
                            <span>{theme.label}</span>
                          </span>
                          {ann.isPinned && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                              <Pin className="w-2.5 h-2.5" />
                              <span>สำคัญ</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-slate-500 font-medium">
                            {formatThaiDate(ann.date)}
                          </span>

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('คุณต้องการลบประกาศนี้หรือไม่?')) {
                                  onDeleteAnnouncement(ann.id);
                                }
                              }}
                              className="text-slate-400 hover:text-rose-600 p-0.5 rounded-md"
                              title="ลบประกาศ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-xs text-slate-900 leading-snug mb-1.5">
                        {ann.title}
                      </h4>

                      {/* Content */}
                      <p className="text-xs text-slate-700 leading-relaxed line-clamp-3 mb-3">
                        {ann.content}
                      </p>
                    </div>

                    {/* Footer / Author & LINE Share */}
                    <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-2 text-[11px]">
                      <div className="text-slate-500 truncate max-w-[140px]" title={ann.author}>
                        ✍️ <span className="font-semibold text-slate-700">{ann.author}</span>
                      </div>

                      {/* Quick LINE Share dropdown / buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleShareToLine(ann, 'group')}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-[#06C755] hover:bg-[#05b04b] text-white shadow-2xs transition-colors"
                          title="ส่งเข้า LINE กลุ่มห้องปฏิบัติการ"
                        >
                          <Send className="w-2.5 h-2.5" />
                          <span>กลุ่ม</span>
                        </button>

                        <a
                          href={shareUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs transition-colors"
                          title="เปิดแอป LINE เพื่อเลือกส่งให้รายบุคคลหรือกลุ่ม"
                        >
                          <Share2 className="w-2.5 h-2.5 text-[#06C755]" />
                          <span>แชร์</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Create Announcement */}
      {isAddModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div 
            className="bg-white text-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">ลงประกาศแจ้งในปฏิทินห้องปฏิบัติการ</h4>
                  <p className="text-[11px] text-slate-300">ประกาศจะแสดงบนแถบปฏิทินเด่นชัด และสามารถส่งต่อเข้า LINE ทันที</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateAnnouncement} className="p-5 space-y-4">
              {/* Category & Pin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    หมวดหมู่ประกาศ <span className="text-rose-600">*</span>:
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as LabAnnouncement['category'])}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="urgent">🚨 ด่วนพิเศษ / STAT (วิกฤต)</option>
                    <option value="audit">📋 มาตรฐาน ISO 15189 / HA</option>
                    <option value="maintenance">🔬 ซ่อมบำรุงเครื่องมือ / PM</option>
                    <option value="general">📢 ประกาศข่าวประชาสัมพันธ์ทั่วไป</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ผู้ลงประกาศ:
                  </label>
                  <select
                    value={newAuthor}
                    onChange={e => setNewAuthor(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    {assignees.map(a => (
                      <option key={a.id} value={a.name}>
                        {a.name} ({a.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  หัวข้อเรื่องประกาศ <span className="text-rose-600">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="เช่น มาตรการรายงานผลตรวจวิกฤต Dengue NS1 หรือ แจ้ง PM เครื่องตรวจวิเคราะห์..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รายละเอียดข้อความประกาศ <span className="text-rose-600">*</span>:
                </label>
                <textarea
                  rows={4}
                  required
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="ระบุข้อความประกาศแจ้งให้เจ้าหน้าที่ทุกท่านทราบอย่างละเอียด..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 leading-relaxed"
                />
              </div>

              {/* Pinned switch */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIsPinned}
                  onChange={e => setNewIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-amber-900 block">ปักหมุดประกาศนี้ไว้ด้านบนสุด</span>
                  <span className="text-amber-700 text-[11px]">เน้นให้เห็นชัดเจนตลอดเวลาเมื่อเปิดปฏิทิน</span>
                </div>
              </label>

              {/* LINE Notification Dispatch Section */}
              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyLineOnCreate}
                    onChange={e => setNotifyLineOnCreate(e.target.checked)}
                    className="w-4 h-4 rounded text-[#06C755] focus:ring-[#06C755]"
                  />
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-[#06C755]" />
                    <span>ส่งแจ้งเตือนประกาศนี้เข้า LINE ทันทีเมื่อบันทึก</span>
                  </span>
                </label>

                {notifyLineOnCreate && (
                  <div className="pl-6 space-y-2 pt-1 border-t border-emerald-200/60">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="targetMode"
                          checked={sendTargetMode === 'group'}
                          onChange={() => setSendTargetMode('group')}
                          className="text-[#06C755]"
                        />
                        <span className="font-semibold text-slate-700">👥 ส่ง LINE กลุ่มแล็บ</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="targetMode"
                          checked={sendTargetMode === 'individual'}
                          onChange={() => setSendTargetMode('individual')}
                          className="text-[#06C755]"
                        />
                        <span className="font-semibold text-slate-700">👤 ส่ง LINE ส่วนตัวรายบุคคล</span>
                      </label>
                    </div>

                    {sendTargetMode === 'individual' && (
                      <div className="pt-1">
                        <select
                          value={selectedIndividualId}
                          onChange={e => setSelectedIndividualId(e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-emerald-300 rounded-lg text-slate-800"
                        >
                          {assignees.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({a.role}) {a.lineUserId ? '• มี LINE ID' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all hover:scale-[1.02]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>บันทึกและประกาศแจ้ง</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
