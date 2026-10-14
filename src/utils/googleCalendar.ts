import { CalendarEvent, Assignee } from '../types/calendar';
import { toBuddhistYear } from './thaiDate';

/**
 * Converts date string and time into Google Calendar format (YYYYMMDDTHHmm00)
 */
function toGCalDateTimeString(dateStr: string, timeStr: string): string {
  // dateStr is YYYY-MM-DD, timeStr is HH:mm
  const cleanDate = dateStr.replace(/-/g, '');
  const cleanTime = (timeStr || '00:00').replace(':', '') + '00';
  return `${cleanDate}T${cleanTime}`;
}

/**
 * Creates a direct Google Calendar 1-click Web URL for an event
 */
export function createGoogleCalendarUrl(event: CalendarEvent, assignee?: Assignee): string {
  const title = encodeURIComponent(`[แล็บ] ${event.title}`);
  const startTime = toGCalDateTimeString(event.date, event.startTime || '08:00');
  const endTime = toGCalDateTimeString(event.date, event.endTime || (event.startTime ? event.startTime : '09:00'));
  
  const dates = `${startTime}/${endTime}`;
  const location = encodeURIComponent(event.location || 'ห้องปฏิบัติการทางการแพทย์');
  
  const yearNum = parseInt(event.date.split('-')[0], 10);
  const bYear = toBuddhistYear(yearNum);
  
  const detailsParts = [
    `📅 วันที่: ${event.date} (พ.ศ. ${bYear})`,
    `⏰ เวลา: ${event.startTime || '08:00'} - ${event.endTime || '09:00'} น.`,
    `📍 สถานที่: ${event.location || '-'}`,
    `👤 ผู้รับผิดชอบ: ${assignee ? `${assignee.name} (${assignee.role})` : 'ไม่ระบุ'}`,
    `🏷️ ประเภทงาน: ${event.category}`,
    `⚡ ความสำคัญ: ${event.priority.toUpperCase()}`,
    event.description ? `\n📝 รายละเอียด:\n${event.description}` : '',
    `\n--\nซิงค์จาก: ปฏิทินห้องปฏิบัติการทางการแพทย์ (Medical Lab Calendar)`
  ];
  
  const details = encodeURIComponent(detailsParts.filter(Boolean).join('\n'));
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}&add=`;
}

/**
 * Generates an iCalendar (.ics) RFC 5545 formatted string for events
 */
export function generateIcsCalendar(events: CalendarEvent[], assignees: Assignee[]): string {
  const assigneeMap = new Map(assignees.map(a => [a.id, a]));
  
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Medical Lab Calendar Thailand//TH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:ปฏิทินห้องปฏิบัติการทางการแพทย์',
    'X-WR-TIMEZONE:Asia/Bangkok'
  ];

  events.forEach(evt => {
    const assignee = assigneeMap.get(evt.assigneeId);
    const start = toGCalDateTimeString(evt.date, evt.startTime || '08:00');
    const end = toGCalDateTimeString(evt.date, evt.endTime || '09:00');
    const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const desc = [
      `ผู้รับผิดชอบ: ${assignee?.name || '-'} (${assignee?.role || '-'})`,
      `สถานที่: ${evt.location || '-'}`,
      evt.description ? `รายละเอียด: ${evt.description}` : ''
    ].filter(Boolean).join('\\n');

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:lab-event-${evt.id}@medlab.app`);
    lines.push(`DTSTAMP:${nowStamp}`);
    lines.push(`DTSTART:${start}`);
    lines.push(`DTEND:${end}`);
    lines.push(`SUMMARY:${evt.title.replace(/[,;]/g, ' ')}`);
    lines.push(`LOCATION:${(evt.location || '').replace(/[,;]/g, ' ')}`);
    lines.push(`DESCRIPTION:${desc.replace(/[,;]/g, ' ')}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Downloads a text file with a specified mime type
 */
export function downloadTextFile(filename: string, content: string, mimeType: string = 'text/calendar;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
