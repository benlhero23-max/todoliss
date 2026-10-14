import { ThaiHoliday } from '../types/calendar';

// Fixed-date Thai National Holidays & Observances
export const FIXED_THAI_HOLIDAYS: Record<string, { name: string; isOfficialHoliday: boolean; category: 'national' | 'religious' | 'traditional' | 'medical'; description?: string }> = {
  '01-01': { name: 'วันขึ้นปีใหม่', isOfficialHoliday: true, category: 'national', description: 'วันหยุดราชการและวันขึ้นปีใหม่สากล' },
  '01-16': { name: 'วันครูแห่งชาติ', isOfficialHoliday: false, category: 'traditional', description: 'วันระลึกถึงพระคุณของครู' },
  '02-14': { name: 'วันวาเลนไทน์', isOfficialHoliday: false, category: 'traditional' },
  '04-06': { name: 'วันจักรี', isOfficialHoliday: true, category: 'national', description: 'วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราชและวันที่ระลึกมหาจักรีบรมราชวงศ์' },
  '04-07': { name: 'วันอนามัยโลก (World Health Day)', isOfficialHoliday: false, category: 'medical', description: 'วันรณรงค์สุขภาพสากล WHO' },
  '04-13': { name: 'วันสงกรานต์ (วันผู้สูงอายุแห่งชาติ)', isOfficialHoliday: true, category: 'traditional', description: 'วันขึ้นปีใหม่ไทย' },
  '04-14': { name: 'วันสงกรานต์ (วันครอบครัว)', isOfficialHoliday: true, category: 'traditional', description: 'วันครอบครัว' },
  '04-15': { name: 'วันสงกรานต์ (วันมหาสงกรานต์)', isOfficialHoliday: true, category: 'traditional', description: 'เทศกาลสงกรานต์' },
  '05-01': { name: 'วันแรงงานแห่งชาติ', isOfficialHoliday: true, category: 'national', description: 'วันหยุดผู้ใช้แรงงาน' },
  '05-04': { name: 'วันฉัตรมงคล', isOfficialHoliday: true, category: 'national', description: 'วันเฉลิมฉลองพระราชพิธีบรมราชาภิเษก' },
  '06-03': { name: 'วันเฉลิมพระชนมพรรษา สมเด็จพระนางเจ้าฯ พระบรมราชินี', isOfficialHoliday: true, category: 'national' },
  '06-29': { name: 'วันเทคนิคการแพทย์ไทย', isOfficialHoliday: false, category: 'medical', description: 'วันสถาปนาวิชาชีพเทคนิคการแพทย์ในประเทศไทย' },
  '07-28': { name: 'วันเฉลิมพระชนมพรรษา พระบาทสมเด็จพระวชิรเกล้าเจ้าอยู่หัว (ร.10)', isOfficialHoliday: true, category: 'national' },
  '08-12': { name: 'วันแม่แห่งชาติ', isOfficialHoliday: true, category: 'national', description: 'วันเฉลิมพระชนมพรรษา สมเด็จพระบรมราชชนนีพันปีหลวง' },
  '09-24': { name: 'วันมหิดล', isOfficialHoliday: false, category: 'medical', description: 'วันคล้ายวันสวรรคตสมเด็จพระมหิตลาธิเบศร อดุลเดชวิกรม พระบรมราชชนก พระบิดาแห่งการแพทย์แผนปัจจุบัน' },
  '10-13': { name: 'วันนวมินทรมหาราช', isOfficialHoliday: true, category: 'national', description: 'วันคล้ายวันสวรรคต พระบาทสมเด็จพระบรมชนกาธิเบศร มหาภูมิพลอดุลยเดชมหาราช บรมนาถบพิตร' },
  '10-21': { name: 'วันพยาบาลแห่งชาติ', isOfficialHoliday: false, category: 'medical', description: 'วันคล้ายวันพระราชสมภพสมเด็จพระศรีนครินทราบรมราชชนนี' },
  '10-23': { name: 'วันปิยมหาราช', isOfficialHoliday: true, category: 'national', description: 'วันคล้ายวันสวรรคตพระบาทสมเด็จพระจุลจอมเกล้าเจ้าอยู่หัว (ร.5)' },
  '11-14': { name: 'วันเบาหวานโลก (World Diabetes Day)', isOfficialHoliday: false, category: 'medical', description: 'รณรงค์ตรวจคัดกรองน้ำตาลในเลือด' },
  '11-27': { name: 'วันแพทย์ไทย & วันสาธารณสุขแห่งชาติ', isOfficialHoliday: false, category: 'medical', description: 'วันสถาปนากระทรวงสาธารณสุข' },
  '12-01': { name: 'วันเอดส์โลก (World AIDS Day)', isOfficialHoliday: false, category: 'medical', description: 'รณรงค์การตรวจเลือดและป้องกันเอชไอวี' },
  '12-05': { name: 'วันพ่อแห่งชาติ / วันชาติ / วันดินโลก', isOfficialHoliday: true, category: 'national', description: 'วันคล้ายวันพระบรมราชสมภพ ร.9' },
  '12-10': { name: 'วันรัฐธรรมนูญ', isOfficialHoliday: true, category: 'national', description: 'วันระลึกการพระราชทานรัฐธรรมนูญฉบับแรก' },
  '12-31': { name: 'วันสิ้นปี', isOfficialHoliday: true, category: 'national', description: 'วันหยุดสิ้นปี' },
};

// Variable Buddhist lunar holidays by year (YYYY-MM-DD)
export const LUNAR_HOLIDAYS_BY_YEAR: Record<number, Record<string, { name: string; isOfficialHoliday: boolean; category: 'religious' | 'traditional'; description?: string }>> = {
  2025: {
    '2025-02-12': { name: 'วันมาฆบูชา', isOfficialHoliday: true, category: 'religious', description: 'ขึ้น 15 ค่ำ เดือน 3' },
    '2025-05-11': { name: 'วันวิสาขบูชา', isOfficialHoliday: true, category: 'religious', description: 'ขึ้น 15 ค่ำ เดือน 6' },
    '2025-05-12': { name: 'วันหยุดชดเชยวันวิสาขบูชา', isOfficialHoliday: true, category: 'religious' },
    '2025-07-10': { name: 'วันอาสาฬหบูชา', isOfficialHoliday: true, category: 'religious', description: 'ขึ้น 15 ค่ำ เดือน 8' },
    '2025-07-11': { name: 'วันเข้าพรรษา', isOfficialHoliday: true, category: 'religious', description: 'แรม 1 ค่ำ เดือน 8' },
    '2025-10-07': { name: 'วันออกพรรษา', isOfficialHoliday: false, category: 'religious', description: 'ขึ้น 15 ค่ำ เดือน 11' },
    '2025-11-05': { name: 'วันลอยกระทง', isOfficialHoliday: false, category: 'traditional', description: 'ขึ้น 15 ค่ำ เดือน 12' },
  },
  2026: {
    '2026-03-03': { name: 'วันมาฆบูชา', isOfficialHoliday: true, category: 'religious', description: 'ขึ้น 15 ค่ำ เดือน 3' },
    '2026-05-13': { name: 'วันพืชมงคล', isOfficialHoliday: true, category: 'traditional', description: 'พระราชพิธีพืชมงคลจรดพระนังคัลแรกนาขวัญ' },
    '2026-05-31': { name: 'วันวิสาขบูชา', isOfficialHoliday: true, category: 'religious', description: 'ขึ้น 15 ค่ำ เดือน 6' },
    '2026-06-01': { name: 'วันหยุดชดเชยวันวิสาขบูชา', isOfficialHoliday: true, category: 'religious' },
    '2026-07-29': { name: 'วันอาสาฬหบูชา', isOfficialHoliday: true, category: 'religious', description: 'ขึ้น 15 ค่ำ เดือน 8' },
    '2026-07-30': { name: 'วันเข้าพรรษา', isOfficialHoliday: true, category: 'religious', description: 'แรม 1 ค่ำ เดือน 8' },
    '2026-10-25': { name: 'วันออกพรรษา', isOfficialHoliday: false, category: 'religious', description: 'ขึ้น 15 ค่ำ เดือน 11' },
    '2026-11-24': { name: 'วันลอยกระทง', isOfficialHoliday: false, category: 'traditional', description: 'ขึ้น 15 ค่ำ เดือน 12' },
  },
  2027: {
    '2027-02-21': { name: 'วันมาฆบูชา', isOfficialHoliday: true, category: 'religious', description: 'ขึ้น 15 ค่ำ เดือน 3' },
    '2027-05-20': { name: 'วันวิสาขบูชา', isOfficialHoliday: true, category: 'religious', description: 'ขึ้น 15 ค่ำ เดือน 6' },
    '2027-07-18': { name: 'วันอาสาฬหบูชา', isOfficialHoliday: true, category: 'religious', description: 'ขึ้น 15 ค่ำ เดือน 8' },
    '2027-07-19': { name: 'วันเข้าพรรษา', isOfficialHoliday: true, category: 'religious', description: 'แรม 1 ค่ำ เดือน 8' },
    '2027-10-15': { name: 'วันออกพรรษา', isOfficialHoliday: false, category: 'religious' },
    '2027-11-13': { name: 'วันลอยกระทง', isOfficialHoliday: false, category: 'traditional' },
  }
};

/**
 * Returns Thai Holiday for a given ISO date (YYYY-MM-DD)
 */
export function getThaiHoliday(dateString: string): ThaiHoliday | null {
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const monthDay = `${parts[1]}-${parts[2]}`;

  // Check lunar/specific holidays for that year
  if (LUNAR_HOLIDAYS_BY_YEAR[year] && LUNAR_HOLIDAYS_BY_YEAR[year][dateString]) {
    const item = LUNAR_HOLIDAYS_BY_YEAR[year][dateString];
    return {
      date: dateString,
      name: item.name,
      isOfficialHoliday: item.isOfficialHoliday,
      category: item.category,
      description: item.description
    };
  }

  // Check fixed holidays
  if (FIXED_THAI_HOLIDAYS[monthDay]) {
    const item = FIXED_THAI_HOLIDAYS[monthDay];
    return {
      date: dateString,
      name: item.name,
      isOfficialHoliday: item.isOfficialHoliday,
      category: item.category,
      description: item.description
    };
  }

  // Check National Children's Day (Second Saturday of January)
  if (parts[1] === '01') {
    const d = new Date(year, 0, parseInt(parts[2], 10));
    if (d.getDay() === 6 && d.getDate() >= 8 && d.getDate() <= 14) {
      return {
        date: dateString,
        name: 'วันเด็กแห่งชาติ',
        isOfficialHoliday: false,
        category: 'traditional',
        description: 'เสาร์ที่ 2 ของเดือนมกราคม'
      };
    }
  }

  return null;
}
