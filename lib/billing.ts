export const TIME_ZONE = "Asia/Manila";
export function localDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) =>
    parts.find((part) => part.type === type)!.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
export function currentBillingMonth(date = new Date()) {
  return `${localDate(date).slice(0, 7)}-01`;
}
export function peso(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}
export function dateLabel(
  value: string | null,
  options: Intl.DateTimeFormatOptions = {},
) {
  return value
    ? new Intl.DateTimeFormat("en-PH", {
        timeZone: TIME_ZONE,
        month: "short",
        day: "numeric",
        year: "numeric",
        ...options,
      }).format(new Date(value))
    : "No due date";
}
export function paymentTotal(
  payments: { amount: number | string | null }[] | null | undefined,
) {
  return (payments ?? []).reduce(
    (total, payment) => total + Number(payment.amount ?? 0),
    0,
  );
}
export function outstandingBalance(monthlyFee: number | string, paid: number) {
  return Math.max(0, Math.round((Number(monthlyFee) - paid) * 100) / 100);
}
export function billStatus(balance: number, paid: number, due: string | null) {
  if (balance === 0) return "paid";
  if (due && due < localDate()) return "overdue";
  return paid > 0 ? "partial" : "due";
}
