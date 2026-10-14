import { CalendarEvent, DailyNote, Assignee, LineNotificationConfig, CloudBackupState, ShiftHandover, ShiftSwap, LabAnnouncement } from '../types/calendar';

const STORAGE_KEYS = {
  EVENTS: 'medlab_calendar_events_v1',
  NOTES: 'medlab_calendar_notes_v1',
  ASSIGNEES: 'medlab_calendar_assignees_v2', // bump key to ensure fresh admins loaded
  LINE_CONFIG: 'medlab_calendar_line_config_v1',
  CLOUD_BACKUP: 'medlab_calendar_cloud_backup_v1',
  CURRENT_USER: 'medlab_calendar_current_user_v1',
  HANDOVERS: 'medlab_calendar_handovers_v1',
  SWAPS: 'medlab_calendar_swaps_v1',
  ANNOUNCEMENTS: 'medlab_calendar_announcements_v1'
};

export interface FullBackupPayload {
  version: number;
  appName: string;
  backupDate: string;
  events: CalendarEvent[];
  notes: DailyNote[];
  assignees: Assignee[];
  lineConfig: LineNotificationConfig;
  handovers?: ShiftHandover[];
  swaps?: ShiftSwap[];
  announcements?: LabAnnouncement[];
}

export const initialBackupState: CloudBackupState = {
  lastBackupTime: new Date().toISOString(),
  autoBackupEnabled: true,
  syncStatus: 'synced',
  backupVersion: 1
};

export function loadStoredData<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Failed to parse storage key ${key}`, e);
    return defaultValue;
  }
}

export function saveStoredData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to write storage key ${key}`, e);
  }
}

export { STORAGE_KEYS };
