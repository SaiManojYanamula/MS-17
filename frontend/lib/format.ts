// Mock data uses short display-ready strings ('14 Aug', 'Monthly'); the real
// API returns raw Prisma values (ISO dates, enum strings, relation objects).
// These helpers format the real shape without touching mock strings.

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return value; // already a mock display string
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

const PLAN_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  DAILY_PASS: 'Daily Pass',
};

export function formatPlan(value?: string | null): string {
  if (!value) return '—';
  return PLAN_LABELS[value] ?? value;
}

export function seatNumberOf(seat: any): string {
  if (seat == null) return '—';
  if (typeof seat === 'object') return seat.seatNumber != null ? String(seat.seatNumber) : '—';
  return String(seat);
}

export function memberNameOf(member: any): string {
  if (member == null) return '—';
  return typeof member === 'object' ? member.name ?? '—' : member;
}
