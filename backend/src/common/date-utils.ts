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
