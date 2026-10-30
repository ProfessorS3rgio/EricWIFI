import "server-only";
import { database } from "./supabase";
import { requireAdmin } from "./auth";
import { readAll } from "./rows";
import { currentBillingMonth, outstandingBalance, billStatus } from "./billing";
export type Client = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  plan: string;
  monthly_fee: number;
  status: "active" | "inactive" | "overdue";
  due_date: string | null;
  notes: string | null;
  portal_token: string;
};
export type Bill = {
  id: string;
  client_id: string;
  billing_month: string;
  amount: number;
  due_date: string | null;
  plan: string;
  name: string;
  paid: number;
  balance: number;
  status: string;
};
export async function getClients() {
  await requireAdmin();
  const data = await readAll(
    database().from("clients").select("*").order("name").order("id"),
  );
  return (data ?? []) as Client[];
}
export async function getBills(
  month: string | null = currentBillingMonth(),
): Promise<Bill[]> {
  await requireAdmin();
  const db = database();
  const { error: generationError } = await db.rpc("ensure_current_bills");
  if (generationError)
    throw new Error(
      "Billing is not ready. Run the updated supabase/schema.sql.",
    );
  return readBills(month);
}

export type PublicBill = Pick<
  Bill,
  "id" | "name" | "plan" | "amount" | "due_date" | "paid" | "balance" | "status"
>;

// Deliberate public projection: never include contact details or portal tokens.
export async function getPublicBills(): Promise<PublicBill[]> {
  return (await readBills(currentBillingMonth())).map(
    ({ id, name, plan, amount, due_date, paid, balance, status }) => ({
      id,
      name,
      plan,
      amount,
      due_date,
      paid,
      balance,
      status,
    }),
  );
}

async function readBills(month: string | null): Promise<Bill[]> {
  const db = database();
  let billQuery = db
    .from("bills")
    .select("*,clients(name)")
    .order("due_date", { nullsFirst: false })
    .order("id");
  let paymentQuery = db
    .from("payments")
    .select("client_id,billing_month,amount")
    .is("voided_at", null)
    .order("id");
  if (month) {
    billQuery = billQuery.eq("billing_month", month);
    paymentQuery = paymentQuery.eq("billing_month", month);
  }
  const [bills, payments] = await Promise.all([
    readAll(billQuery),
    readAll(paymentQuery),
  ]);
  const totals = new Map<string, number>();
  for (const payment of payments ?? [])
    totals.set(
      payment.client_id + payment.billing_month,
      (totals.get(payment.client_id + payment.billing_month) ?? 0) +
        Number(payment.amount),
    );
  return (bills ?? []).map((bill) => {
    const paid = totals.get(bill.client_id + bill.billing_month) ?? 0;
    const balance = outstandingBalance(bill.amount, paid);
    return {
      ...bill,
      amount: Number(bill.amount),
      name: bill.clients?.name ?? "Unknown client",
      paid,
      balance,
      status: billStatus(balance, paid, bill.due_date),
    };
  });
}
