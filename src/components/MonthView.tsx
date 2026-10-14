import React from 'react';
import { CalendarEvent, DailyNote, Assignee, ShiftHandover, ShiftSwap } from '../types/calendar';
import { THAI_DAYS_FULL, toISODateString } from '../utils/thaiDate';
import { getThaiHoliday } from '../data/thaiHolidays';
import { FileText, MapPin, Clock, Plus, AlertCircle, Sparkles, ArrowRightLeft } from 'lucide-react';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  notes: DailyNote[];
  handovers?: ShiftHandover[];
  swaps?: ShiftSwap[];
  assignees: Assignee[];
  todayIso: string;
  onSelectDate: (dateIso: string) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  notes,
  handovers = [],
  swaps = [],
  assignees,
  todayIso,
  onSelectDate,
  onSelectEvent
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of month & total days
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Days in previous month for padding
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Assignee lookup map
  const assigneeMap = React.useMemo(() => {
    return new Map(assignees.map(a => [a.id, a]));
  }, [assignees]);

  // Calendar cells array (42 cells = 6 rows x 7 days)
  const calendarCells = React.useMemo(() => {
    const cells: Array<{
      dateIso: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isWeekend: boolean;
    }> = [];

    // Previous month days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const dateIso = toISODateString(prevDate);
      cells.push({
        dateIso,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateIso === todayIso,
        isWeekend: prevDate.getDay() === 0 || prevDate.getDay() === 6
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, month, d);
      const dateIso = toISODateString(curDate);
      cells.push({
        dateIso,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateIso === todayIso,
        isWeekend: curDate.getDay() === 0 || curDate.getDay() === 6
      });
    }

    // Next month days to fill up to multiple of 7 (at least 35 or 42)
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateIso = toISODateString(nextDate);
      cells.push({
        dateIso,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateIso === todayIso,
        isWeekend: nextDate.getDay() === 0 || nextDate.getDay() === 6
      });
    }

    return cells;
  }, [year, month, daysInMonth, daysInPrevMonth, startingDayOfWeek, todayIso]);

  // Events grouped by date string
  const eventsByDate = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach(e => {
      const list = map.get(e.date) || [];
      list.push(e);
      map.set(e.date, list);
    });
    return map;
  }, [events]);

  // Notes grouped by date string
  const notesByDate = React.useMemo(() => {
    const map = new Map<string, DailyNote[]>();
    notes.forEach(n => {
      const list = map.get(n.date) || [];
      list.push(n);
      map.set(n.date, list);
    });
    return map;
  }, [notes]);

  // Handovers grouped by date string
  const handoversByDate = React.useMemo(() => {
    const map = new Map<string, ShiftHandover[]>();
    handovers.forEach(h => {
      const list = map.get(h.date) || [];
      list.push(h);
      map.set(h.date, list);
    });
    return map;
  }, [handovers]);

  // Swaps grouped by date string
  const swapsByDate = React.useMemo(() => {
    const map = new Map<string, ShiftSwap[]>();
    swaps.forEach(s => {
      const reqDate = s.requestDate || s.requesterDate || '';
      if (reqDate) {
        const listReq = map.get(reqDate) || [];
        listReq.push(s);
        map.set(reqDate, listReq);
      }
      if (s.targetDate && s.targetDate !== reqDate) {
        const listTar = map.get(s.targetDate) || [];
        listTar.push(s);
        map.set(s.targetDate, listTar);
      }
    });
    return map;
  }, [swaps]);

  return (
    <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden select-none">
      {/* Weekday Header */}
      <div className="grid grid-cols-7 bg-white border-b border-slate-200 text-center text-xs font-semibold py-2">
        {THAI_DAYS_FULL.map((dayName, idx) => (
          <div
            key={dayName}
            className={`py-1 ${
              idx === 0
                ? 'text-rose-600'
                : idx === 6
                ? 'text-indigo-600'
                : 'text-slate-700'
            }`}
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-px bg-slate-200">
        {calendarCells.map((cell) => {
          const holiday = getThaiHoliday(cell.dateIso);
          const dayEvents = eventsByDate.get(cell.dateIso) || [];
          const dayNotes = notesByDate.get(cell.dateIso) || [];
          const dayHandovers = handoversByDate.get(cell.dateIso) || [];
          const daySwaps = swapsByDate.get(cell.dateIso) || [];
          const hasPendingShift = dayHandovers.some(h => h.status === 'pending') || daySwaps.some(s => s.status === 'pending');

          return (
            <div
              key={cell.dateIso}
              onClick={() => onSelectDate(cell.dateIso)}
              className={`group relative flex flex-col justify-between p-1.5 min-h-[110px] transition-all cursor-pointer ${
                !cell.isCurrentMonth
                  ? 'bg-slate-50/80 text-slate-400 hover:bg-slate-100'
                  : cell.isToday
                  ? 'bg-teal-50/60 ring-1.5 ring-inset ring-teal-500 hover:bg-teal-50'
                  : 'bg-white hover:bg-slate-50'
              }`}
            >
              {/* Cell Top Bar: Date Number + Badges */}
              <div className="flex items-start justify-between gap-1">
                <div className="flex items-center gap-1 flex-wrap">
                  <span
                    className={`inline-flex items-center justify-center text-xs font-semibold rounded-full w-6 h-6 ${
                      cell.isToday
                        ? 'bg-teal-600 text-white font-bold shadow-xs'
                        : cell.isWeekend
                        ? 'text-rose-600'
                        : cell.isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {/* Holiday / Special day badge */}
                  {holiday && cell.isCurrentMonth && (
                    <span
                      className={`inline-flex items-center px-1.5 py-0.2 rounded-md text-[10px] font-medium truncate max-w-[120px] ${
                        holiday.isOfficialHoliday
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : holiday.category === 'medical'
                          ? 'bg-teal-100 text-teal-800 border border-teal-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                      title={holiday.name + (holiday.description ? ` (${holiday.description})` : '')}
                    >
                      {holiday.name}
                    </span>
                  )}
                </div>

                {/* Right badges: Note count, Shift count, or Hover Add icon */}
                <div className="flex items-center gap-1">
                  {(dayHandovers.length > 0 || daySwaps.length > 0) && (
                    <span
                      className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded-md text-[9px] font-semibold border ${
                        hasPendingShift
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                      }`}
                      title={`ส่งเวร ${dayHandovers.length} / แลกเวร ${daySwaps.length}${hasPendingShift ? ' (มีรายการรอรับทราบ)' : ''}`}
                    >
                      <ArrowRightLeft className="w-2.5 h-2.5 text-indigo-600" />
                      <span>{dayHandovers.length + daySwaps.length}</span>
                    </span>
                  )}

                  {dayNotes.length > 0 && (
                    <span
                      className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded-md text-[9px] font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                      title={`มี ${dayNotes.length} บันทึกย่อในวันนี้`}
                    >
                      <FileText className="w-2.5 h-2.5 text-amber-600" />
                      <span>{dayNotes.length}</span>
                    </span>
                  )}

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-sm bg-teal-100 text-teal-700 hover:bg-teal-200">
                    <Plus className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Event Pills List */}
              <div className="my-1 flex-1 flex flex-col gap-1 overflow-y-auto max-h-[85px] no-scrollbar">
                {dayEvents.slice(0, 3).map((evt) => {
                  const assignee = assigneeMap.get(evt.assigneeId);
                  const isStat = evt.priority === 'stat';

                  return (
                    <div
                      key={evt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(evt);
                      }}
                      style={{
                        borderLeftColor: assignee?.color || '#0d9488',
                        backgroundColor: assignee ? assignee.bgColor : '#f0fdfa'
                      }}
                      className="text-left px-1.5 py-1 rounded-sm border-l-[3.5px] shadow-2xs hover:shadow-xs transition-shadow cursor-pointer group/item"
                    >
                      <div className="flex items-center justify-between gap-1 text-[10px] leading-tight">
                        <span className="font-semibold truncate text-slate-800 flex items-center gap-1">
                          {isStat && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse shrink-0" />
                          )}
                          {evt.title}
                        </span>
                        <span className="text-slate-500 shrink-0 text-[9px] font-mono">
                          {evt.startTime}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-slate-500 mt-0.5 truncate">
                        <span className="truncate text-teal-800 font-medium">
                          {assignee ? assignee.name.split(' ')[0] : 'ไม่ระบุ'}
                        </span>
                        {evt.location && (
                          <span className="truncate max-w-[80px] text-slate-400">
                            {evt.location.replace('ห้องแล็บ', 'แล็บ')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* More events indicator */}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] font-medium text-teal-700 text-center py-0.5 bg-teal-50/80 rounded-sm">
                    +{dayEvents.length - 3} กิจกรรมเพิ่มเติม
                  </div>
                )}
              </div>

              {/* Bottom Subtle Status */}
              <div className="text-[9px] text-slate-400 text-right h-2.5">
                {cell.isToday && <span className="text-teal-600 font-semibold">วันนี้</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
