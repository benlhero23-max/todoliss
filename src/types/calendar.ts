export type ViewMode = 'month' | 'week';

export interface Assignee {
  id: string;
  name: string;
  role: string;
  color: string; // Hex color e.g. #0284c7
  bgColor: string; // Light background
  borderColor: string;
  textColor: string;
  avatarIcon?: string; // Icon key e.g. 'microscope', 'flask', 'dna'
  pin?: string; // 4-digit passcode for authentication e.g. '1234'
  isAdmin?: boolean; // True for system admins (นางสาวอังคณา สักกะโต and นายมณเฑียร ดีขุนทด)
  lineUserId?: string; // LINE User ID (U...) หรือ LINE ID ส่วนบุคคล
  lineNotifyToken?: string; // Token สำหรับแจ้งเตือนไลน์ส่วนตัว
  phone?: string; // หมายเลขติดต่อภายใน/มือถือ
}

export type LabCategory = 
  | 'lab_run'        // ตรวจวิเคราะห์ตัวอย่าง (Routine / STAT)
  | 'qc_calibrate'   // สอบเทียบเครื่องมือ / ทำ QC
  | 'meeting'        // ประชุมแล็บ / Case Conference
  | 'send_out'       // ส่งตรวจภายนอก / Reference Lab
  | 'surveillance'   // เฝ้าระวังเชื้อดื้อยา / ระบาดวิทยา
  | 'audit_iso'      // ตรวจรับรอง ISO 15189 / HA
  | 'training'       // อบรมวิชาการ / CME
  | 'blood_bank'     // เตรียมโลหิต / Crossmatch
  | 'general';       // กิจกรรมทั่วไป

export type EventPriority = 'stat' | 'high' | 'normal';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (e.g. 08:30)
  endTime: string; // HH:mm (e.g. 11:30)
  location: string; // e.g. "ห้องแล็บ 3B เคมีคลินิก"
  assigneeId: string; // ID of responsible person
  category: LabCategory;
  priority: EventPriority;
  description?: string;
  lineNotified?: boolean; // flag if LINE alert was dispatched
  googleSynced?: boolean;
  createdAt: string;
}

export interface DailyNote {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
  author: string;
  category: 'handover' | 'reagent' | 'maintenance' | 'urgent' | 'general';
  isCompleted?: boolean;
  createdAt: string;
}

export interface ThaiHoliday {
  date: string; // MM-DD or YYYY-MM-DD
  name: string;
  isOfficialHoliday: boolean; // วันหยุดราชการ
  category: 'national' | 'religious' | 'traditional' | 'medical';
  description?: string;
}

export interface LabAnnouncement {
  id: string;
  title: string;
  content: string; // ข้อความประกาศ
  category: 'urgent' | 'maintenance' | 'audit' | 'general';
  isPinned: boolean;
  isActive?: boolean;
  author: string;
  authorRole?: string;
  date: string; // YYYY-MM-DD
  createdAt?: string;
  lineNotified?: boolean;
}

export interface LineNotificationConfig {
  enabled: boolean;
  channelAccessToken: string;
  destinationId: string; // Group ID or User ID (e.g. U... or C...)
  groupDestinationId?: string; // Group ID (C...) สำหรับส่งไลน์กลุ่ม
  defaultIndividualDestinationId?: string; // User ID (U...) สำหรับส่งไลน์รายบุคคล
  sendMode?: 'group' | 'individual' | 'both'; // รูปแบบการส่ง
  webhookUrl?: string; // Optional custom webhook proxy
  alertTime: string; // Default "16:00"
  advanceDays: number; // Default 1
  autoSendEnabled: boolean;
  lastRunDate?: string;
  logs: Array<{
    id: string;
    timestamp: string;
    targetDate: string;
    eventCount: number;
    status: 'success' | 'failed' | 'simulated';
    messagePreview: string;
    recipientType?: 'group' | 'individual';
    recipientName?: string;
  }>;
}

export interface CloudBackupState {
  lastBackupTime: string | null;
  autoBackupEnabled: boolean;
  syncStatus: 'synced' | 'syncing' | 'pending' | 'offline';
  backupVersion: number;
}

export type ShiftType = 'morning' | 'afternoon' | 'evening' | 'night' | 'full_day';

export interface ShiftHandoverChecklist {
  qcChecked?: boolean;           // ตรวจสอบผล QC ครบถ้วน
  temperatureLogged?: boolean;   // บันทึกอุณหภูมิตู้เย็น/ตู้แช่ตัวอย่าง
  statCleared?: boolean;         // เคลียร์สิ่งส่งตรวจ STAT หรือส่งต่อ
  bloodBankStockChecked?: boolean; // ตรวจสอบสต็อกโลหิต/พลาสมา
  wasteDisposed?: boolean;       // จัดการขยะติดเชื้อ/สารเคมี
  reagentsChecked?: boolean;     // เช็คสต็อกน้ำยา
  qcCompleted?: boolean;         // ทำ QC เรียบร้อย
  maintenanceDone?: boolean;     // บำรุงรักษาเครื่องมือ
  criticalValuesReported?: boolean; // รายงานค่าวิกฤตครบ
}

export interface ShiftHandover {
  id: string;
  date: string; // YYYY-MM-DD
  shift: ShiftType; // เวรเช้า / เวรบ่าย / เวรดึก / 24 ชม.
  department: string; // e.g. 'ห้องปฏิบัติการเคมีคลินิก', 'โลหิตวิทยา & ธนาคารเลือด', 'จุลชีววิทยา'
  fromAssigneeId: string; // ผู้ส่งเวร
  toAssigneeId: string; // ผู้รับผิดชอบต่อ (ผู้รับมอบเวร)
  
  // ข้อความส่งเวร โดยวิธีการพิมพ์ (แทนที่ Checklist และฟิลด์เดิมตามคำขอของผู้ใช้งาน)
  handoverMessage?: string;       // ข้อความสรุปส่งมอบเวรโดยการพิมพ์
  notes?: string;

  // ฟิลด์เดิม (คงไว้เพื่อ backward-compatibility ของข้อมูลเก่า)
  pendingStatCases?: string;
  equipmentStatus?: string;
  reagentsAlert?: string;
  specialInstructions?: string;
  pendingTests?: string;
  criticalAlerts?: string;
  generalNotes?: string;
  checklist?: ShiftHandoverChecklist;

  // สถานะการยืนยันรับทราบ
  status: 'pending' | 'acknowledged';
  acknowledgedAt?: string; // วันเวลาที่ยืนยัน (ISO string)
  acknowledgedByAssigneeId?: string; // ผู้กดยืนยันรับทราบ
  acknowledgedBy?: string; // ชื่อหรือ ID ผู้กดยืนยันรับทราบ
  acknowledgedByName?: string;
  acknowledgementNote?: string; // บันทึกข้อความตอบรับจากผู้รับเวรต่อ
  acknowledgmentNote?: string;
  acknowledgedNote?: string;
  createdAt: string;
}

export interface ShiftSwap {
  id: string;
  requesterId: string;        // ผู้ขอแลกเวร
  targetAssigneeId: string;   // ผู้รับผิดชอบต่อ / ผู้รับแลกเวร
  
  // ข้อมูลเวรเดิมของผู้ขอ
  requestDate: string;        // YYYY-MM-DD
  requesterDate?: string;     // Alias for requestDate
  requestShift: ShiftType;
  requesterShift?: ShiftType; // Alias for requestShift
  
  // รูปแบบการแลก
  swapType: 'exchange' | 'cover'; // 'exchange' = แลกเวรกัน, 'cover' = ขอให้อยู่เวรแทน
  targetDate?: string;        // YYYY-MM-DD (กรณี exchange แลกวันกัน)
  targetShift?: ShiftType;
  
  department: string;         // แผนก
  reason: string;             // เหตุผล เช่น ลาป่วย, อบรมวิชาการ, ธุระเร่งด่วน
  
  // สถานะการยืนยันรับทราบ
  status: 'pending' | 'pending_target' | 'approved' | 'rejected' | 'accepted' | 'cancelled';
  acknowledgedAt?: string;
  acknowledgedByAssigneeId?: string;
  respondedAt?: string;
  targetNote?: string;        // บันทึกตอบรับจากผู้รับแลกเวร
  responseNote?: string;
  
  adminApproved?: boolean;    // ผ่านการรับรองโดย Admin
  adminApprovedAt?: string;
  adminApprovedBy?: string;
  
  createdAt: string;
}
