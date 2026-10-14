import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Search, 
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';
import { ViewMode, Assignee } from '../types/calendar';
import { formatThaiMonthYear, toBuddhistYear } from '../utils/thaiDate';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  assignees: Assignee[];
  selectedAssigneeId: string | null;
  onSelectAssignee: (id: string | null) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  totalEventsInMonth: number;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  viewMode,
  onViewModeChange,
  onPrev,
  onNext,
  onToday,
  assignees,
  selectedAssigneeId,
  onSelectAssignee,
  searchTerm,
  onSearchChange,
  totalEventsInMonth
}) => {
  const thaiTitle = formatThaiMonthYear(currentDate.getFullYear(), currentDate.getMonth());
  const bYear = toBuddhistYear(currentDate.getFullYear());

  return (
    <div className="bg-white border-b border-slate-200 p-4 space-y-3">
      {/* Top row: Navigation & View Mode */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Month Title & Nav */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={onPrev}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
              title="ก่อนหน้า"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={onToday}
              className="px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-white rounded-lg transition-colors"
            >
              วันนี้
            </button>
            <button
              onClick={onNext}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
              title="ถัดไป"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-baseline gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{thaiTitle}</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 font-semibold border border-teal-200">
                พ.ศ. {bYear}
              </span>
            </h2>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              ({totalEventsInMonth} กิจกรรม)
            </span>
          </div>
        </div>

        {/* View Mode Toggle & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search box */}
          <div className="relative min-w-[190px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหากิจกรรม, สถานที่, งาน..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            />
          </div>

          {/* Monthly / Weekly toggle tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              onClick={() => onViewModeChange('month')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-teal-800 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>รายเดือน</span>
            </button>
            <button
              onClick={() => onViewModeChange('week')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                viewMode === 'week'
                  ? 'bg-white text-teal-800 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>รายสัปดาห์</span>
            </button>
          </div>
        </div>
      </div>

      {/* Assignee Filter Chips (แทบสีเฉพาะของแต่ละคนที่รับผิดชอบ) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 text-xs">
        <div className="flex items-center gap-1 text-slate-500 font-medium shrink-0 pr-1">
          <Filter className="w-3.5 h-3.5 text-teal-600" />
          <span>กรองตามผู้รับผิดชอบ:</span>
        </div>

        <button
          onClick={() => onSelectAssignee(null)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
            selectedAssigneeId === null
              ? 'bg-slate-800 text-white font-semibold shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
          }`}
        >
          ทั้งหมด ({assignees.length} ท่าน)
        </button>

        {assignees.map((assignee) => {
          const isSelected = selectedAssigneeId === assignee.id;
          return (
            <button
              key={assignee.id}
              onClick={() => onSelectAssignee(isSelected ? null : assignee.id)}
              style={{
                borderColor: assignee.borderColor,
                backgroundColor: isSelected ? assignee.color : assignee.bgColor,
                color: isSelected ? '#ffffff' : assignee.textColor
              }}
              className="px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all shrink-0 hover:opacity-90"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: isSelected ? '#ffffff' : assignee.color }}
              />
              <span className="font-medium">{assignee.name.split(' ')[0]} {assignee.name.split(' ')[1]?.charAt(0)}.</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
