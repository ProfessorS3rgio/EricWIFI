import AdminShell from "../../components/AdminShell";
import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";
const peso = (value: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);

export default async function OutstandingPage() {
  const month = new Date().toISOString().slice(0, 7) + "-01";
  const [{ data: clients }, { data: payments }] = await Promise.all([
    supabase.from("clients").select("id,name,phone,plan,monthly_fee,due_date,status").eq("status", "active").order("name"),
    supabase.from("payments").select("client_id,amount").eq("billing_month", month).is("voided_at", null)
  ]);
  const paidByClient = new Map<string, number>();
  (payments ?? []).forEach((payment) => paidByClient.set(payment.client_id, (paidByClient.get(payment.client_id) ?? 0) + Number(payment.amount)));
  const rows = (clients ?? []).map((client) => ({ ...client, paid: paidByClient.get(client.id) ?? 0, balance: Math.max(0, Number(client.monthly_fee) - (paidByClient.get(client.id) ?? 0)) }));
  const outstanding = rows.filter((row) => row.balance > 0);
  return <AdminShell><main className="content-shell"><header className="page-heading"><div><p className="eyebrow">Billing overview · {month.slice(0, 7)}</p><h1>Outstanding balances</h1></div><a className="button" href="/payments">Record payment</a></header>
    <section className="stats stats-three"><article className="stat-card blue"><span>Clients with balance</span><strong>{outstanding.length}</strong></article><article className="stat-card orange"><span>Total outstanding</span><strong>{peso(outstanding.reduce((total, row) => total + row.balance, 0))}</strong></article><article className="stat-card green"><span>Collected this month</span><strong>{peso(rows.reduce((total, row) => total + row.paid, 0))}</strong></article></section>
    <section className="panel"><div className="panel-heading"><h2>Current billing cycle</h2><span className="muted">{outstanding.length} unpaid or partially paid</span></div>{!outstanding.length ? <div className="empty">Everyone is paid for this billing cycle.</div> : <div className="table-wrap"><table><thead><tr><th>Client</th><th>Plan</th><th>Amount due</th><th>Paid</th><th>Balance</th><th>Due date</th></tr></thead><tbody>{outstanding.map((row) => <tr key={row.id}><td className="name">{row.name}<small className="table-subtext">{row.phone || "No phone"}</small></td><td>{row.plan}</td><td>{peso(Number(row.monthly_fee))}</td><td>{peso(row.paid)}</td><td className="balance">{peso(row.balance)}</td><td>{row.due_date || "—"}</td></tr>)}</tbody></table></div>}</section>
  </main></AdminShell>;
}
