import { supabase } from "../lib/supabase";
import { currentBillingMonth, outstandingBalance } from "../lib/billing";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

type Client = {
  id: string;
  name: string;
  plan: string;
  monthly_fee: number;
  due_date: string | null;
  status: "active" | "inactive" | "overdue";
};

const peso = (value: number) => new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0
}).format(value);

export default async function PublicHome() {
  noStore();
  const billingMonth = currentBillingMonth();
  const [{ data: clients, error: clientsError }, { data: payments, error: paymentsError }] = await Promise.all([
    supabase.from("clients").select("id,name,plan,monthly_fee,due_date,status").order("name"),
    supabase.from("payments").select("client_id,amount").eq("billing_month", billingMonth).is("voided_at", null)
  ]);

  if (clientsError || paymentsError) {
    return <main className="public-home"><section className="public-shell"><PublicHeader /><div className="public-error"><h2>Payment status is temporarily unavailable</h2><p>Please try again shortly or contact the WiFi administrator.</p></div></section></main>;
  }

  const paidByClient = new Map<string, number>();
  (payments ?? []).forEach((payment) => paidByClient.set(payment.client_id, (paidByClient.get(payment.client_id) ?? 0) + Number(payment.amount)));
  const rows = ((clients ?? []) as Client[]).map((client) => {
    const paid = paidByClient.get(client.id) ?? 0;
    return { ...client, paid, balance: outstandingBalance(client.monthly_fee, paid) };
  });

  return <main className="public-home"><section className="public-shell">
    <PublicHeader />
    <div className="public-hero"><div><p className="eyebrow">Customer payment board</p><h1>Know your WiFi bill at a glance.</h1><p>View the current monthly billing status for Eric WiFi Man customers. No account number required.</p></div><div className="hero-art"><span>⌁</span><small>Reliable connection.<br />Simple payments.</small></div></div>
    <section className="public-board"><div className="public-board-heading"><div><p className="eyebrow">Current billing cycle</p><h2>Customer bills</h2></div><span className="public-cycle">{billingMonth.slice(0, 7)}</span></div>
      {!rows.length ? <div className="public-empty">No client bills have been added yet.</div> : <div className="public-bill-grid">{rows.map((row) => <article className="public-bill" key={row.id}><div className="public-bill-top"><div><h3>{row.name}</h3><span>{row.plan}</span></div><span className={`bill-status ${row.balance ? "due" : "paid"}`}>{row.balance ? "Balance due" : "Paid"}</span></div><div className="public-amount"><span>Amount due</span><strong>{peso(row.balance || row.paid)}</strong></div><div className="public-bill-lines"><span>Monthly bill <b>{peso(Number(row.monthly_fee))}</b></span><span>Paid this month <b>{peso(row.paid)}</b></span><span>Due date <b>{row.due_date || "Contact admin"}</b></span></div></article>)}</div>}
    </section>
    <p className="public-footer">Questions about your bill? Please contact your WiFi administrator.</p>
  </section></main>;
}

function PublicHeader() {
  return <header className="public-header"><div className="brand public-brand"><span className="brand-mark">⌁</span><span><b>Eric WiFi Man</b><small>Customer portal</small></span></div><a className="admin-login-button" href="/login">Admin login <span>→</span></a></header>;
}
