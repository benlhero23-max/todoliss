import { ShiftHandover, ShiftSwap, LabAnnouncement } from '../types/calendar';

export const INITIAL_SAMPLE_HANDOVERS: ShiftHandover[] = [
  {
    id: 'handover-1',
    date: '2026-09-19',
    shift: 'morning',
    department: 'ห้องปฏิบัติการเคมีคลินิก',
    fromAssigneeId: 'staff-1', // ทนพ.สมชาย พงษ์สิทธิ์
    toAssigneeId: 'staff-2',   // ทนพญ.กานดา รักษ์ชีวิน
    handoverMessage: 'เคสฉุกเฉิน ER 2 ราย (เตียง 3 Trop-I 0.45 ng/mL รายงานผลแล้ว, เตียง 7 Electrolyte เจาะซ้ำเนื่องจาก Hemolysis เล็กน้อย รอผลปั่นตรวจรอบบ่าย) เครื่อง Cobas c501 รันปกติ ผ่าน QC ทุกพารามิเตอร์ Reagent Troponin-I เบิกคลังเพิ่มแล้ว มีตัวอย่าง ICU ส่งมา 3 หลอดตอน 14:00 น. ดำเนินการต่อได้เลยครับ',
    pendingStatCases: 'เคสฉุกเฉิน ER 2 ราย (เตียง 3 Trop-I 0.45 ng/mL, เตียง 7 Electrolyte รอเจาะซ้ำเนื่องจาก Hemolysis เล็กน้อย)',
    status: 'acknowledged',
    acknowledgedAt: '2026-09-19T16:05:00.000Z',
    acknowledgedByAssigneeId: 'staff-2',
    acknowledgementNote: 'รับมอบเวรเรียบร้อย ตรวจสอบเคส ER ทั้งสองรายแล้ว จะตามผลเจาะซ้ำเตียง 7 ต่อครับ/ค่ะ',
    createdAt: '2026-09-19T15:50:00.000Z'
  },
  {
    id: 'handover-2',
    date: '2026-09-20',
    shift: 'afternoon',
    department: 'ธนาคารเลือดและห้องเตรียมโลหิต (Blood Bank)',
    fromAssigneeId: 'staff-5', // ทนพญ.นฤมล เจริญสุข
    toAssigneeId: 'staff-1',   // ทนพ.สมชาย พงษ์สิทธิ์
    handoverMessage: 'เตรียม Crossmatch เลือด PRC 4 ยูนิต สำหรับเคสผ่าตัด CABG ห้องผ่าตัด 4 จัดเก็บในตู้สำรองฉุกเฉิน 4°C อุณหภูมิตู้ 3.8°C สัญญาณ Alarm ปกติ น้ำยา Anti-D เปิดขวดใหม่ทำ QC เรียบร้อย หากมีเคสฉุกเฉินโทรสายด่วน 1145',
    pendingStatCases: 'Crossmatch เลือด PRC 4 ยูนิต สำหรับเคสผ่าตัด CABG ห้องผ่าตัด 4 (เตรียมพร้อมแล้วในตู้สำรองฉุกเฉิน)',
    status: 'acknowledged',
    acknowledgedAt: '2026-09-20T23:55:00.000Z',
    acknowledgedByAssigneeId: 'staff-1',
    acknowledgementNote: 'รับมอบเวรดึกเรียบร้อย ตรวจเช็กเลือดสำรอง CABG 4 ยูนิตครบถ้วน',
    createdAt: '2026-09-20T23:45:00.000Z'
  },
  {
    id: 'handover-3',
    date: '2026-09-21',
    shift: 'morning',
    department: 'ห้องปฏิบัติการจุลชีววิทยา & PCR',
    fromAssigneeId: 'staff-2', // ทนพญ.กานดา รักษ์ชีวิน
    toAssigneeId: 'admin-angkana', // นางสาวอังคณา สักกะโต (Admin)
    handoverMessage: 'ส่งต่อเคสเพาะเชื้อ Blood Culture ด่วน ICU เตียง 12 พบ Gram-negative bacilli กำลังรัน AST บนเครื่อง VITEK 2 คาดว่าผลออก 16:30 น. การ์ด AST-GN เหลือน้อย 5 แผ่น ให้เบิกเพิ่ม ผลออกแล้วโทรแจ้งแพทย์เจ้าของไข้ทันที',
    pendingStatCases: 'รอผลเพาะเชื้อ Blood Culture ผู้ป่วยวิกฤต ICU เตียง 12 ขึ้น Gram-negative bacilli กำลังทำ AST ด่วน',
    status: 'pending', // รอยืนยันรับทราบ!
    createdAt: '2026-09-21T15:45:00.000Z'
  }
];

export const INITIAL_SAMPLE_SWAPS: ShiftSwap[] = [
  {
    id: 'swap-1',
    requesterId: 'staff-3', // ดร.ภัทร สิริวัฒนากุล
    targetAssigneeId: 'staff-6', // นักวิทย์ฯ อานนท์ วงศ์สุวรรณ
    requestDate: '2026-09-22',
    requestShift: 'morning',
    swapType: 'exchange',
    targetDate: '2026-09-25',
    targetShift: 'morning',
    department: 'ห้องปฏิบัติการควบคุมคุณภาพและตรวจวิเคราะห์',
    reason: 'ติดภารกิจเดินทางไปส่งมอบสิ่งส่งตรวจพิเศษทางพันธุศาสตร์ ณ สถาบันวิจัยจีโนมิกส์',
    status: 'pending_target', // รอนักวิทย์ฯ อานนท์ หรือ Admin ยืนยันรับทราบและตกลง
    createdAt: '2026-09-20T10:00:00.000Z'
  },
  {
    id: 'swap-2',
    requesterId: 'staff-1', // ทนพ.สมชาย พงษ์สิทธิ์
    targetAssigneeId: 'admin-montien', // นายมณเฑียร ดีขุนทด
    requestDate: '2026-09-24',
    requestShift: 'morning',
    swapType: 'cover',
    department: 'ห้องปฏิบัติการเคมีคลินิก',
    reason: 'ขอลาเพื่อเข้าร่วมพิธีวางพวงมาลาเนื่องในวันมหิดล ในนามตัวแทนหน่วยงาน',
    status: 'approved',
    acknowledgedAt: '2026-09-18T14:30:00.000Z',
    acknowledgedByAssigneeId: 'admin-montien',
    targetNote: 'ยินดีอยู่เวรเช้าแทนให้ครับ ติดภารกิจวันมหิดลได้รับอนุมัติเรียบร้อย',
    adminApproved: true,
    adminApprovedAt: '2026-09-18T14:30:00.000Z',
    adminApprovedBy: 'นายมณเฑียร ดีขุนทด (Admin)',
    createdAt: '2026-09-18T11:00:00.000Z'
  }
];

export const INITIAL_SAMPLE_ANNOUNCEMENTS: LabAnnouncement[] = [
  {
    id: 'ann-1',
    title: '🚨 ด่วน: มาตรการรายงานผลตรวจวิกฤต (Critical Value) เฝ้าระวังผู้ป่วยไข้เลือดออก Dengue NS1',
    content: 'เนื่องจากมีจำนวนเคสผู้ป่วยสงสัยไข้เลือดออกเพิ่มขึ้น ขอให้ทุกเวรรายงานผลตรวจ Dengue NS1 Ag และ Platelet count ที่ต่ำกว่า 50,000 /uL ทางโทรศัพท์ต่อหอผู้ป่วยทันที พร้อมลงบันทึกเวลาและผู้รับสายในระบบ HIS',
    date: '2026-09-19',
    category: 'urgent',
    isPinned: true,
    author: 'ทนพญ. อังคณา สักกะโต',
    authorRole: 'หัวหน้าห้องปฏิบัติการ (Admin)'
  },
  {
    id: 'ann-2',
    title: '📋 เตรียมความพร้อมตรวจประเมินรับรองมาตรฐาน ISO 15189:2022 และ LA ประจำปี 2569',
    content: 'ทีมผู้ตรวจประเมินจะเข้าตรวจเยี่ยมห้องปฏิบัติการในวันที่ 24-25 กันยายน 2569 ขอให้เจ้าหน้าที่ทุกผลัดเวรตรวจสอบเอกสารบันทึกการส่งมอบเวร, ผลการควบคุมคุณภาพ QC ในรอบ 30 วัน, และบันทึกอุณหภูมิตู้เก็บรักษาตัวอย่างให้ครบถ้วน 100%',
    date: '2026-09-18',
    category: 'audit',
    isPinned: true,
    author: 'นายมณเฑียร ดีขุนทด',
    authorRole: 'หัวหน้างานบริหารคุณภาพ (Admin)'
  },
  {
    id: 'ann-3',
    title: '🔬 แจ้งซ่อมบำรุงตามรอบ Preventive Maintenance เครื่องตรวจวิเคราะห์ Cobas c501',
    content: 'วิศวกรผู้เชี่ยวชาญจากบริษัทจะเข้าดำเนินการบำรุงรักษาในวันพุธที่ 23 ก.ย. 2569 เวลา 13:00 - 15:30 น. ระหว่างนี้ขอให้กระจายสิ่งส่งตรวจเคมีคลินิกฉุกเฉินไปยังเครื่องวิเคราะห์สำรอง #2',
    date: '2026-09-20',
    category: 'maintenance',
    isPinned: false,
    author: 'นักวิทย์ฯ อานนท์ วงศ์สุวรรณ',
    authorRole: 'นักวิทยาศาสตร์การแพทย์ชำนาญการ'
  }
];
