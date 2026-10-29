import AdminShell from "../../components/AdminShell";
import PaymentForm from "./PaymentForm";
import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";
const peso = (value: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);

export default async function PaymentsPage() {
  const [{ data: clients }, { data: payments }] = await Promise.all([
    supabase.from("clients").select("id,name,monthly_fee").eq("status", "active").order("name"),
    supabase.from("payments").select("id,amount,paid_at,method,reference,clients(name,plan)").order("paid_at", { ascending: false }).limit(25)
  ]);
  return <AdminShell><main className="content-shell"><header className="page-heading"><div><p className="eyebrow">Manual collection</p><h1>Payments</h1></div></header>
    <div className="two-column"><PaymentForm clients={clients ?? []} /><section className="panel"><div className="panel-heading"><h2>Recent payments</h2></div>{!payments?.length ? <div className="empty">No payments recorded yet.</div> : <div className="table-wrap"><table><thead><tr><th>Client</th><th>Amount</th><th>Method</th><th>Paid at</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.id}><td className="name">{(payment.clients as { name: string }[] | null)?.[0]?.name || "—"}</td><td>{peso(Number(payment.amount))}</td><td>{payment.method}</td><td>{new Date(payment.paid_at).toLocaleDateString("en-PH")}</td></tr>)}</tbody></table></div>}</section></div>
  </main></AdminShell>;
}
