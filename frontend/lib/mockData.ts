// Demo data mirroring the reference screenshots, used as a fallback so the
// UI renders immediately even before the NestJS backend + DB are connected.

export const mockDashboard = {
  activeMembers: 248,
  seatsOccupied: 110,
  seatsTotal: 120,
  pendingApplications: 7,
  revenueThisMonth: 108400,
  revenueChangePct: 12,
};

export const mockPendingApplications = [
  { id: '1', applicant: 'Pranathi R.', goalTag: 'Group II Aspirant', plan: 'Monthly', batch: 'Morning', appliedAt: 'Jul 19' },
  { id: '2', applicant: 'Suresh K.', goalTag: 'NEET Aspirant', plan: 'Quarterly', batch: 'Day', appliedAt: 'Jul 19' },
  { id: '3', applicant: 'Anitha M.', goalTag: 'Bank Exams', plan: 'Daily Pass', batch: 'Evening', appliedAt: 'Jul 17' },
  { id: '4', applicant: 'Venkatesh K.', goalTag: 'UPSC Aspirant', plan: 'Monthly', batch: 'Morning', appliedAt: 'Jul 17' },
  { id: '5', applicant: 'Divya P.', goalTag: 'Group II Aspirant', plan: 'Monthly', batch: 'Day', appliedAt: 'Jul 16' },
];

export const mockRecentActivity = [
  { text: 'Kavya N. paid ₹900 for Monthly renewal — Seat 42', at: '10 minutes ago' },
  { text: 'New application from Pranathi R. — Morning batch', at: '45 minutes ago' },
  { text: 'Seat 17 membership expires tomorrow — no renewal yet', at: '1 hour ago' },
  { text: 'Ramesh B. paid ₹2400 for Quarterly plan — Seat 8', at: '3 hours ago' },
  { text: 'Sindhu T. requested a seat change to Evening batch', at: 'Yesterday' },
];

export const mockRevenueTrend = [
  { month: 'Feb', total: 92000 },
  { month: 'Mar', total: 95000 },
  { month: 'Apr', total: 98000 },
  { month: 'May', total: 101000 },
  { month: 'Jun', total: 104000 },
  { month: 'Jul', total: 108400 },
];

export const mockOccupancyTrend = [
  { week: 'W1', occupiedPct: 62 },
  { week: 'W2', occupiedPct: 65 },
  { week: 'W3', occupiedPct: 68 },
  { week: 'W4', occupiedPct: 66 },
  { week: 'W5', occupiedPct: 72 },
  { week: 'W6', occupiedPct: 78 },
  { week: 'W7', occupiedPct: 85 },
  { week: 'W8', occupiedPct: 92 },
];

export const mockPlanDistribution = [
  { plan: 'Monthly', pct: 46 },
  { plan: 'Quarterly', pct: 26 },
  { plan: 'Daily Pass', pct: 18 },
  { plan: 'Others', pct: 10 },
];

export const mockKeyNumbers = {
  totalMembersAllTime: 612,
  avgMembershipMonths: 4.2,
  renewalRate: 81,
  mostPopularBatch: 'Day (9-5)',
  mostCommonGoal: 'Group II',
};

export const mockMembers = [
  { id: '1', name: 'Kavya N.', goalTag: 'SSC Aspirant', seat: 42, plan: 'Monthly', expiresAt: '14 Aug', status: 'Active' },
  { id: '2', name: 'Ramesh B.', goalTag: 'NEET Aspirant', seat: 8, plan: 'Quarterly', expiresAt: '02 Sep', status: 'Active' },
  { id: '3', name: 'Sindhu T.', goalTag: 'UPSC Aspirant', seat: 23, plan: 'Monthly', expiresAt: '20 Jul', status: 'Expiring Soon' },
  { id: '4', name: 'Harika P.', goalTag: 'Bank Exams', seat: 55, plan: 'Monthly', expiresAt: '30 Jul', status: 'Active' },
  { id: '5', name: 'Praveen N.', goalTag: 'Group II Aspirant', seat: 17, plan: 'Monthly', expiresAt: '20 Jul', status: 'Expiring Soon' },
  { id: '6', name: 'Lakshmi M.', goalTag: 'NEET Aspirant', seat: 61, plan: 'Quarterly', expiresAt: '11 Oct', status: 'Active' },
];

export const mockMemberCounts = { all: 248, active: 231, expiring: 9, expired: 8 };

export const mockZones = [
  { name: 'Zone A — Window Row', range: '1-24', start: 1, end: 24 },
  { name: 'Zone B — Center Hall', range: '25-72', start: 25, end: 72 },
  { name: 'Zone C — Quiet Corner', range: '73-120', start: 73, end: 120 },
];

// Deterministic pseudo-random status per seat number so the demo grid looks
// like the reference screenshot without needing real booking data.
export function seatStatus(seatNumber: number): 'FREE' | 'OCCUPIED' | 'EXPIRING_SOON' {
  const r = (seatNumber * 37) % 10;
  if (r < 2) return 'FREE';
  if (r < 4) return 'EXPIRING_SOON';
  return 'OCCUPIED';
}

export const mockSeatDetail = {
  seatNumber: 42,
  status: 'Occupied',
  zone: 'Zone B',
  member: 'Kavya N.',
  plan: 'Monthly',
  batch: 'Day (9 AM – 5 PM)',
  expiresAt: '14 Aug 2026',
};

export const mockPaymentsSummary = {
  collectedThisMonth: 108000,
  pendingDues: 6300,
  transactions: 228,
  avgTransaction: 475,
};

export const mockTransactions = [
  { id: '1', member: 'Kavya N.', label: 'Monthly Renewal', amount: 900, method: 'UPI', date: 'Jul 19', status: 'PAID' },
  { id: '2', member: 'Ramesh B.', label: 'Quarterly Plan', amount: 2400, method: 'Cash', date: 'Jul 19', status: 'PAID' },
  { id: '3', member: 'Anitha M.', label: 'Daily Pass', amount: 60, method: 'UPI', date: 'Jul 18', status: 'PAID' },
  { id: '4', member: 'Pranathi R.', label: 'Monthly (New)', amount: 900, method: 'Pending', date: 'Jul 18', status: 'PENDING' },
  { id: '5', member: 'Sindhu T.', label: 'Monthly Renewal', amount: 900, method: 'UPI', date: 'Jul 17', status: 'PAID' },
  { id: '6', member: 'Manoj J.', label: 'Daily Pass', amount: 60, method: 'Card', date: 'Jul 16', status: 'REFUNDED' },
];
