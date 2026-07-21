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

const PLAN_TOTAL_DAYS: Record<string, number> = {
  MONTHLY: 30,
  QUARTERLY: 90,
  DAILY_PASS: 1,
};

// Days used / total days in the current plan cycle, derived from expiresAt
// (no separate "cycle start" field exists — this approximates from the plan length).
export function planProgress(plan?: string | null, expiresAt?: string | null) {
  const totalDays = PLAN_TOTAL_DAYS[plan ?? ''] ?? 30;
  const daysRemaining = expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : totalDays;
  const daysUsed = Math.max(0, Math.min(totalDays, totalDays - daysRemaining));
  return { daysUsed, totalDays, pct: Math.min(100, (daysUsed / totalDays) * 100) };
}

export function latestPaymentAmount(payments?: any[]): number | null {
  if (!payments || payments.length === 0) return null;
  const sorted = [...payments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return sorted[0].amount;
}
