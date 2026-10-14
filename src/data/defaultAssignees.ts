import { Assignee } from '../types/calendar';

export const DEFAULT_ASSIGNEES: Assignee[] = [
  {
    id: 'admin-angkana',
    name: 'นางสาวอังคณา สักกะโต',
    role: 'ผู้ดูแลระบบ (Admin) & ผู้เชี่ยวชาญห้องปฏิบัติการ',
    color: '#6366f1', // Indigo
    bgColor: '#e0e7ff',
    borderColor: '#818cf8',
    textColor: '#3730a3',
    avatarIcon: 'shield',
    pin: '1234',
    isAdmin: true,
    lineUserId: 'U9a12c8b9d3e4f5a6b7c8d9e0f1a2b3c4',
    phone: '081-456-7890'
  },
  {
    id: 'admin-montien',
    name: 'นายมณเฑียร ดีขุนทด',
    role: 'ผู้ดูแลระบบ (Admin) & หัวหน้างานเทคนิคการแพทย์',
    color: '#0d9488', // Teal
    bgColor: '#ccfbf1',
    borderColor: '#2dd4bf',
    textColor: '#0f766e',
    avatarIcon: 'shield',
    pin: '1234',
    isAdmin: true,
    lineUserId: 'U7b89c0d1e2f3a4b5c6d7e8f9a0b1c2d3',
    phone: '089-123-4567'
  },
  {
    id: 'staff-1',
    name: 'ทนพ.สมชาย พงษ์สิทธิ์',
    role: 'หัวหน้างานเคมีคลินิก',
    color: '#0284c7', // Sky blue
    bgColor: '#e0f2fe',
    borderColor: '#38bdf8',
    textColor: '#0369a1',
    avatarIcon: 'flask',
    pin: '1234',
    isAdmin: false,
    lineUserId: 'U3f4e5d6c7b8a90123456789abcdef01',
    phone: '086-789-0123'
  },
  {
    id: 'staff-2',
    name: 'ทนพญ.กานดา รักษ์ชีวิน',
    role: 'ผู้เชี่ยวชาญจุลชีววิทยา & PCR',
    color: '#059669', // Emerald green
    bgColor: '#d1fae5',
    borderColor: '#34d399',
    textColor: '#047857',
    avatarIcon: 'dna',
    pin: '1234',
    isAdmin: false,
    lineUserId: 'U5a6b7c8d9e0f123456789abcdef0123',
    phone: '084-567-8901'
  },
  {
    id: 'staff-3',
    name: 'ดร.ภัทร สิริวัฒนากุล',
    role: 'นักวิทยาศาสตร์การแพทย์ (ชีวโมเลกุล)',
    color: '#7c3aed', // Purple
    bgColor: '#ede9fe',
    borderColor: '#a78bfa',
    textColor: '#6d28d9',
    avatarIcon: 'microscope',
    pin: '1234',
    isAdmin: false,
    lineUserId: 'U1d2e3f4a5b6c7890123456789abcdef',
    phone: '082-345-6789'
  },
  {
    id: 'staff-4',
    name: 'นพ.สิทธิชัย เมธาวี',
    role: 'แพทย์พยาธิวิทยาคลินิก',
    color: '#e11d48', // Rose red
    bgColor: '#ffe4e6',
    borderColor: '#fb7185',
    textColor: '#be123c',
    avatarIcon: 'stethoscope',
    pin: '1234',
    isAdmin: false,
    lineUserId: 'U8c7b6a5f4e3d210987654321fedcba0',
    phone: '081-987-6543'
  },
  {
    id: 'staff-5',
    name: 'ทนพญ.นฤมล เจริญสุข',
    role: 'หัวหน้าธนาคารเลือดและภูมิคุ้มกันวิทยา',
    color: '#ea580c', // Amber orange
    bgColor: '#ffedd5',
    borderColor: '#fb923c',
    textColor: '#c2410c',
    avatarIcon: 'testtube',
    pin: '1234',
    isAdmin: false,
    lineUserId: 'U4e5f6a7b8c9d01234567890abcdef12',
    phone: '085-678-9012'
  },
  {
    id: 'staff-6',
    name: 'นักวิทย์ฯ อานนท์ วงศ์สุวรรณ',
    role: 'เจ้าหน้าที่ควบคุมคุณภาพ (QA/QC)',
    color: '#0891b2', // Cyan
    bgColor: '#cffafe',
    borderColor: '#22d3ee',
    textColor: '#0e7490',
    avatarIcon: 'activity',
    pin: '1234',
    isAdmin: false,
    lineUserId: 'U2b3c4d5e6f7a890123456789abcdef34',
    phone: '087-890-1234'
  }
];

export const LAB_CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  lab_run: { label: 'ตรวจวิเคราะห์ตัวอย่าง (Lab Run)', icon: 'TestTube', color: 'text-sky-600 bg-sky-50' },
  qc_calibrate: { label: 'สอบเทียบ / QC ประจำวัน', icon: 'Activity', color: 'text-amber-600 bg-amber-50' },
  meeting: { label: 'ประชุมวิชาการ / Case Conference', icon: 'Users', color: 'text-indigo-600 bg-indigo-50' },
  send_out: { label: 'ส่งตรวจภายนอก (Reference Lab)', icon: 'Send', color: 'text-purple-600 bg-purple-50' },
  surveillance: { label: 'เฝ้าระวังเชื้อดื้อยา (Surveillance)', icon: 'AlertTriangle', color: 'text-rose-600 bg-rose-50' },
  audit_iso: { label: 'ตรวจรับรองมาตรฐาน ISO 15189', icon: 'ShieldCheck', color: 'text-emerald-600 bg-emerald-50' },
  training: { label: 'อบรมวิชาการ / CME', icon: 'GraduationCap', color: 'text-teal-600 bg-teal-50' },
  blood_bank: { label: 'งานบริการโลหิต / Crossmatch', icon: 'HeartPulse', color: 'text-red-600 bg-red-50' },
  general: { label: 'กิจกรรมทั่วไป', icon: 'Calendar', color: 'text-slate-600 bg-slate-50' },
};
