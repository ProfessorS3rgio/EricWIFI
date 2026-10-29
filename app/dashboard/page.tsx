import { supabase } from "../../lib/supabase";
import AdminShell from "../../components/AdminShell";
import DashboardBills from "./DashboardBills";
import { currentBillingMonth, outstandingBalance } from "../../lib/billing";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";
type Client = { id: string; name: string; phone: string | null; plan: string; monthly_fee: number; status: "active" | "inactive" | "overdue"; due_date: string | null };
const peso = (value: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);

export default async function DashboardPage() {
  noStore();
  const billingMonth = currentBillingMonth();
  const [{ data, count: clientCount, error }, { data: payments, error: paymentsError }] = await Promise.all([
    supabase.from("clients").select("id,name,phone,plan,monthly_fee,status,due_date", { count: "exact" }).order("name"),
    supabase.from("payments").select("client_id,amount").eq("billing_month", billingMonth).is("voided_at", null)
  ]);
  if (error || paymentsError) return <AdminShell><main className="content-shell"><section className="error-card"><h2>Unable to load dashboard</h2><p>{error?.message || paymentsError?.message}</p></section></main></AdminShell>;
  const clients = (data ?? []) as Client[];
  const active = clients.filter((client) => client.status === "active");
  const overdue = clients.filter((client) => client.status === "overdue");
  const monthlyRevenue = active.reduce((total, client) => total + Number(client.monthly_fee), 0);
  const paidByClient = new Map<string, number>();
  (payments ?? []).forEach((payment) => paidByClient.set(payment.client_id, (paidByClient.get(payment.client_id) ?? 0) + Number(payment.amount)));
  const bills = clients.filter((client) => client.status !== "inactive").map((client) => {
    const paid = paidByClient.get(client.id) ?? 0;
    return { id: client.id, name: client.name, plan: client.plan, monthlyFee: Number(client.monthly_fee), paid, balance: outstandingBalance(client.monthly_fee, paid), dueDate: client.due_date, billingMonth };
  });
  return <AdminShell><main className="content-shell"><header className="page-heading"><div><p className="eyebrow">Thursday, October 29, 2026</p><h1>Dashboard</h1></div><a className="button" href="/clients/new">+ Add client</a></header><section className="stats"><article className="stat-card blue"><span>Total clients</span><strong>{clientCount ?? clients.length}</strong><i>♙</i></article><article className="stat-card green"><span>Active subscriptions</span><strong>{active.length}</strong><i>⌁</i></article><article className="stat-card orange"><span>Overdue</span><strong>{overdue.length}</strong><i>△</i></article><article className="stat-card purple"><span>Monthly revenue</span><strong>{peso(monthlyRevenue)}</strong><i>₱</i></article></section><div className="dashboard-columns"><DashboardBills initialBills={bills} /><section className="panel dashboard-panel"><div className="panel-heading"><h2>Client status overview</h2><a href="/clients">View all</a></div><div className="status-list"><div className="status-row active-row">⌁ <span>Active</span><b>{active.length}</b></div><div className="status-row overdue-row">△ <span>Overdue</span><b>{overdue.length}</b></div><div className="status-row inactive-row">⊘ <span>Inactive</span><b>{clients.filter((client) => client.status === "inactive").length}</b></div><div className="status-row total-row">₱ <span>Total expected revenue</span><b>{peso(monthlyRevenue)}</b></div></div></section></div></main></AdminShell>;
}
