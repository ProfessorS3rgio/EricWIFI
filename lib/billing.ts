export function currentBillingMonth() {
  return `${new Date().toISOString().slice(0, 7)}-01`;
}

export function paymentTotal(payments: { amount: number | string | null }[] | null | undefined) {
  return (payments ?? []).reduce((total, payment) => total + Number(payment.amount ?? 0), 0);
}

export function outstandingBalance(monthlyFee: number | string, paid: number) {
  return Math.max(0, Number(monthlyFee) - paid);
}
