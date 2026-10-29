import AdminShell from "../../components/AdminShell";
import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";
const peso = (value: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);

export default async function ClientsPage() {
  const { data, error } = await supabase.from("clients").select("id,name,phone,address,plan,monthly_fee,status,due_date").order("name");
  return <AdminShell><main className="content-shell"><header className="page-heading"><div><p className="eyebrow">Customer management</p><h1>Clients</h1></div><a className="button" href="/clients/new">+ Add client</a></header>
    <section className="panel"><div className="panel-heading"><h2>All clients</h2><span className="muted">{data?.length ?? 0} records</span></div>{error ? <div className="empty">{error.message}</div> : !data?.length ? <div className="empty">No clients yet.</div> : <div className="table-wrap"><table><thead><tr><th>Name</th><th>Contact</th><th>Plan</th><th>Monthly fee</th><th>Status</th><th>Due date</th></tr></thead><tbody>{data.map((client) => <tr key={client.id}><td className="name">{client.name}</td><td>{client.phone || "—"}</td><td>{client.plan}</td><td>{peso(Number(client.monthly_fee))}</td><td><span className={`badge ${client.status}`}>{client.status}</span></td><td>{client.due_date || "—"}</td></tr>)}</tbody></table></div>}</section>
  </main></AdminShell>;
}
