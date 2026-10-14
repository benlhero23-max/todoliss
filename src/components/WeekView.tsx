import React from 'react';
import { CalendarEvent, DailyNote, Assignee } from '../types/calendar';
import { THAI_DAYS_FULL, toISODateString, formatThaiDate } from '../utils/thaiDate';
import { getThaiHoliday } from '../data/thaiHolidays';
import { MapPin, Clock, User, Plus, FileText } from 'lucide-react';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  notes: DailyNote[];
  assignees: Assignee[];
  todayIso: string;
  onSelectDate: (dateIso: string) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onAddNewEventOnDate: (dateIso: string) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  notes,
  assignees,
  todayIso,
  onSelectDate,
  onSelectEvent,
  onAddNewEventOnDate
}) => {
  const assigneeMap = React.useMemo(() => {
    return new Map(assignees.map(a => [a.id, a]));
  }, [assignees]);

  // Calculate week days (Sunday to Saturday)
  const weekDays = React.useMemo(() => {
    const days: Array<{
      date: Date;
      dateIso: string;
      dayName: string;
      dayNumber: number;
      isToday: boolean;
    }> = [];

    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay(); // 0 is Sunday
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - dayOfWeek);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateIso = toISODateString(d);
      days.push({
        date: d,
        dateIso,
        dayName: THAI_DAYS_FULL[i],
        dayNumber: d.getDate(),
        isToday: dateIso === todayIso
      });
    }

    return days;
  }, [currentDate, todayIso]);

  // Events grouped by date
  const eventsByDate = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach(e => {
      const list = map.get(e.date) || [];
      list.push(e);
      map.set(e.date, list);
    });
    return map;
  }, [events]);

  // Notes grouped by date
  const notesByDate = React.useMemo(() => {
    const map = new Map<string, DailyNote[]>();
    notes.forEach(n => {
      const list = map.get(n.date) || [];
      list.push(n);
      map.set(n.date, list);
    });
    return map;
  }, [notes]);

  return (
    <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden select-none">
      {/* 7 Columns for the week */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-px bg-slate-200 overflow-y-auto">
        {weekDays.map((day, idx) => {
          const holiday = getThaiHoliday(day.dateIso);
          const dayEvents = (eventsByDate.get(day.dateIso) || []).sort((a, b) => 
            (a.startTime || '00:00').localeCompare(b.startTime || '00:00')
          );
          const dayNotes = notesByDate.get(day.dateIso) || [];

          return (
            <div
              key={day.dateIso}
              className={`flex flex-col bg-white min-h-[500px] transition-colors ${
                day.isToday ? 'bg-teal-50/30' : ''
              }`}
            >
              {/* Day Header Column */}
              <div
                onClick={() => onSelectDate(day.dateIso)}
                className={`p-3 border-b border-slate-200 cursor-pointer text-center transition-colors hover:bg-slate-50 ${
                  day.isToday ? 'bg-teal-100/50 border-teal-300' : 'bg-slate-50'
                }`}
              >
                <div
                  className={`text-xs font-semibold ${
                    idx === 0
                      ? 'text-rose-600'
                      : idx === 6
                      ? 'text-indigo-600'
                      : 'text-slate-600'
                  }`}
                >
                  {day.dayName}
                </div>

                <div className="flex items-center justify-center gap-1.5 my-1">
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 text-sm font-bold rounded-full ${
                      day.isToday
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-800'
                    }`}
                  >
                    {day.dayNumber}
                  </span>
                </div>

                {/* Holiday Badge */}
                {holiday && (
                  <div
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-md mt-1 truncate ${
                      holiday.isOfficialHoliday
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                    title={holiday.name}
                  >
                    {holiday.name}
                  </div>
                )}

                {/* Daily Notes Count Badge */}
                {dayNotes.length > 0 && (
                  <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-amber-700 font-medium">
                    <FileText className="w-3 h-3" />
                    <span>{dayNotes.length} บันทึกย่อ</span>
                  </div>
                )}
              </div>

              {/* Day Events Column */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {dayEvents.map((evt) => {
                  const assignee = assigneeMap.get(evt.assigneeId);
                  const isStat = evt.priority === 'stat';

                  return (
                    <div
                      key={evt.id}
                      onClick={() => onSelectEvent(evt)}
                      style={{
                        borderLeftColor: assignee?.color || '#0d9488',
                        backgroundColor: assignee ? assignee.bgColor : '#f0fdfa'
                      }}
                      className="p-2.5 rounded-lg border-l-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer group text-left"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-semibold text-slate-800 leading-snug flex items-center gap-1">
                          {isStat && (
                            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse shrink-0" />
                          )}
                          {evt.title}
                        </span>
                      </div>

                      {/* Time & Location */}
                      <div className="mt-1 space-y-0.5 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1 font-mono text-teal-800">
                          <Clock className="w-3 h-3 text-teal-600 shrink-0" />
                          <span>{evt.startTime} - {evt.endTime} น.</span>
                        </div>

                        {evt.location && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{evt.location}</span>
                          </div>
                        )}

                        {assignee && (
                          <div className="flex items-center gap-1 pt-1">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: assignee.color }}
                            />
                            <span className="font-semibold text-slate-700 truncate">
                              {assignee.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Empty State / Add Action */}
                {dayEvents.length === 0 && (
                  <div
                    onClick={() => onAddNewEventOnDate(day.dateIso)}
                    className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-3 text-slate-400 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50/50 transition-all cursor-pointer group"
                  >
                    <Plus className="w-5 h-5 text-slate-300 group-hover:text-teal-600 mb-1" />
                    <span className="text-xs font-medium">เพิ่มกิจกรรม</span>
                  </div>
                )}

                {/* Quick Add Button on Hover */}
                {dayEvents.length > 0 && (
                  <button
                    onClick={() => onAddNewEventOnDate(day.dateIso)}
                    className="w-full py-1.5 border border-dashed border-slate-200 rounded-lg text-xs text-slate-500 hover:text-teal-700 hover:border-teal-300 hover:bg-teal-50 transition-colors flex items-center justify-center gap-1 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มนัดหมาย</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
