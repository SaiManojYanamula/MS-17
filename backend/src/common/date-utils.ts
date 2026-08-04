// Adds `months` to `date`, clamping the day-of-month to the last valid day of
// the target month instead of overflowing into the month after (the native
// `Date.setMonth` behavior) — e.g. Jan 31 + 1 month lands on Feb 28, not Mar 3.
export function addMonthsClamped(date: Date, months: number): Date {
  const day = date.getDate();
  const firstOfTargetMonth = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDayOfTargetMonth = new Date(
    firstOfTargetMonth.getFullYear(),
    firstOfTargetMonth.getMonth() + 1,
    0,
  ).getDate();
  firstOfTargetMonth.setDate(Math.min(day, lastDayOfTargetMonth));
  return firstOfTargetMonth;
}

// A plain "YYYY-MM-DD" parses as UTC midnight per the JS spec — wrong for
// this India-only app, since Railway's server clock is UTC. That silently
// shifts every date-range filter by 5.5 hours (IST), excluding same-day
// records made before 5:30am and including next-day ones made before
// 5:30am. Explicit +05:30 makes the boundary correct regardless of the
// server's own timezone.
export function istDayStart(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00+05:30`);
}

export function istDayEnd(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999+05:30`);
}
