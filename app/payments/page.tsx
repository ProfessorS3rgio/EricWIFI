import AdminShell from "../../components/AdminShell";
import PaymentForm from "./PaymentForm";
import PaymentHistory from "./PaymentHistory";
import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";
const peso = (value: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);

export default async function PaymentsPage() {
  const [{ data: clients }, { data: payments }] = await Promise.all([
    supabase.from("clients").select("id,name,monthly_fee").eq("status", "active").order("name"),
    supabase.from("payments").select("id,amount,paid_at,method,reference,voided_at,voided_reason,clients(name,plan)").order("paid_at", { ascending: false }).limit(25)
  ]);
  return <AdminShell><main className="content-shell"><header className="page-heading"><div><p className="eyebrow">Manual collection</p><h1>Payments</h1></div></header>
    <div className="two-column"><PaymentForm clients={clients ?? []} /><PaymentHistory payments={(payments ?? []).map((payment) => ({ id: payment.id, amount: Number(payment.amount), paid_at: payment.paid_at, method: payment.method, reference: payment.reference, voided_at: payment.voided_at, voided_reason: payment.voided_reason, clientName: (payment.clients as { name: string }[] | null)?.[0]?.name || "—" }))} /></div>
  </main></AdminShell>;
}
