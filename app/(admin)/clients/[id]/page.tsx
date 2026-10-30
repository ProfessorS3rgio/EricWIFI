import Link from "next/link";
import { notFound } from "next/navigation";
import { database } from "../../../../lib/supabase";
import { getBills, type Client } from "../../../../lib/data";
import { requireAdmin } from "../../../../lib/auth";
import { readAll } from "../../../../lib/rows";
import { dateLabel, outstandingBalance, peso } from "../../../../lib/billing";
import Icon from "../../../../components/Icon";
export default async function ClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = database();
  const { data, error } = await db
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Could not load client.");
  if (!data) notFound();
  const client = data as Client;
  await getBills();
  const [bills, payments] = await Promise.all([
    readAll(
      db
        .from("bills")
        .select("*")
        .eq("client_id", client.id)
        .order("billing_month", { ascending: false })
        .order("id"),
    ),
    readAll(
      db
        .from("payments")
        .select("*")
        .eq("client_id", client.id)
        .order("paid_at", { ascending: false })
        .order("id"),
    ),
  ]);
  return (
    <main className="content-shell">
      <Link className="text-link back-link" href="/clients">
        ← All clients
      </Link>
      <header className="page-heading">
        <div>
          <p className="eyebrow">CUSTOMER PROFILE</p>
          <h1>
            {client.name}
            <span className="accent">.</span>
          </h1>
          <p className="page-description">
            {client.plan} · {peso(Number(client.monthly_fee))} / month
          </p>
        </div>
        <span className={`badge ${client.status}`}>{client.status}</span>
      </header>
      <div className="profile-grid">
        <section className="panel profile-card">
          <h2>The details</h2>
          <dl className="detail-list">
            <div>
              <dt>Phone</dt>
              <dd>{client.phone || "Not provided"}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>{client.address || "Not provided"}</dd>
            </div>
            <div>
              <dt>Billing day</dt>
              <dd>
                {client.due_date
                  ? `Day ${Number(client.due_date.slice(-2))}`
                  : "Not set"}
              </dd>
            </div>
            <div>
              <dt>Notes</dt>
              <dd>{client.notes || "No notes yet"}</dd>
            </div>
          </dl>
          <div className="portal-share">
            <Icon name="wifi" />
            <h3>Their own little portal.</h3>
            <p>
              Share this private link with this customer. Anyone with it can
              view their bills.
            </p>
            <Link
              className="button secondary"
              href={`/customer?token=${client.portal_token}`}
            >
              Open customer bill <Icon name="arrow" size={16} />
            </Link>
            <p className="helper-text">
              Open the page and copy its address to share.
            </p>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Monthly bills</h2>
            <span className="muted">{bills?.length ?? 0} cycles</span>
          </div>
          {!bills?.length ? (
            <div className="empty">No saved bills yet.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Cycle</th>
                    <th>Bill</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => {
                    const paid = (payments ?? [])
                      .filter(
                        (p) =>
                          !p.voided_at &&
                          p.billing_month === bill.billing_month,
                      )
                      .reduce((s, p) => s + Number(p.amount), 0);
                    const balance = outstandingBalance(bill.amount, paid);
                    return (
                      <tr key={bill.id}>
                        <td className="name">
                          {dateLabel(bill.billing_month, { day: undefined })}
                        </td>
                        <td>{peso(Number(bill.amount))}</td>
                        <td>{peso(paid)}</td>
                        <td className={balance ? "balance" : "money"}>
                          {peso(balance)}
                        </td>
                        <td>
                          {balance > 0 && (
                            <Link
                              className="text-link"
                              href={`/payments?bill=${bill.id}`}
                            >
                              Collect <Icon name="arrow" size={15} />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="panel-footer">
            Saved bills keep their original plan, fee, and due date.
          </div>
        </section>
      </div>
      <section className="panel history-panel">
        <div className="panel-heading">
          <h2>Payment history</h2>
        </div>
        {!payments?.length ? (
          <div className="empty">No collections recorded yet.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Received</th>
                  <th>Billing cycle</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{dateLabel(p.paid_at)}</td>
                    <td>{dateLabel(p.billing_month, { day: undefined })}</td>
                    <td className="money">{peso(Number(p.amount))}</td>
                    <td>{p.method}</td>
                    <td>{p.reference || "—"}</td>
                    <td>
                      <span
                        className={`badge ${p.voided_at ? "voided" : "paid"}`}
                      >
                        {p.voided_at ? "Voided" : "Received"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
