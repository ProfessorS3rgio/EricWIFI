import { supabase } from "../../lib/supabase";
import { currentBillingMonth, outstandingBalance, paymentTotal } from "../../lib/billing";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";
const peso = (value: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);

export default async function CustomerPage({ searchParams }: { searchParams: { phone?: string } }) {
  noStore();
  const phone = searchParams.phone?.trim() ?? "";
  const { data: client } = phone ? await supabase.from("clients").select("id,name,phone,plan,monthly_fee,due_date,status").eq("phone", phone).maybeSingle() : { data: null };
  let paid = 0;
  if (client) {
    const month = currentBillingMonth();
    const { data: payments } = await supabase.from("payments").select("amount").eq("client_id", client.id).eq("billing_month", month);
    paid = paymentTotal(payments);
  }
  const balance = client ? outstandingBalance(client.monthly_fee, paid) : 0;
  return <main className="customer-page"><section className="customer-card">
    <header className="customer-header"><div className="brand customer-brand"><span className="brand-mark">⌁</span><span><b>Eric WiFi Man</b><small>Customer portal</small></span></div><a className="admin-login-button" href="/login">Admin login <span>→</span></a></header>
    <div className="customer-intro"><p className="eyebrow">Public payment portal</p><h1>Check your bill</h1><p className="login-copy">No account needed. Enter the phone number registered to your WiFi subscription to view your current payment status.</p></div>
    <form className="customer-search"><input name="phone" type="tel" placeholder="09XXXXXXXXX" defaultValue={phone} required /><button className="button">Check balance</button></form>
    {phone && !client && <p className="form-error">No customer found for that phone number.</p>}
    {client && <div className="bill-result"><div><span className="muted">Account</span><h2>{client.name}</h2><p>{client.plan} · {client.phone}</p></div><div className={`balance-card ${balance ? "due" : "paid"}`}><span>{balance ? "Outstanding balance" : "Paid this month"}</span><strong>{peso(balance || paid)}</strong></div><div className="bill-lines"><span>Monthly subscription <b>{peso(Number(client.monthly_fee))}</b></span><span>Paid this month <b>{peso(paid)}</b></span><span>Due date <b>{client.due_date || "Please contact admin"}</b></span></div></div>}
    <p className="public-note">Need help with your account? Contact your WiFi administrator.</p>
  </section></main>;
}
