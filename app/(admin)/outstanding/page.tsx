import Link from "next/link";
import { getBills } from "../../../lib/data";
import { currentBillingMonth, dateLabel, peso } from "../../../lib/billing";
import Icon from "../../../components/Icon";
export default async function OutstandingPage() {
  const bills = await getBills();
  const rows = bills
    .filter((b) => b.balance > 0)
    .sort(
      (a, b) =>
        Number(b.status === "overdue") - Number(a.status === "overdue") ||
        a.name.localeCompare(b.name),
    );
  return (
    <main className="content-shell">
      <header className="page-heading">
        <div>
          <p className="eyebrow">
            {dateLabel(currentBillingMonth(), { day: undefined })} · COLLECTIONS
          </p>
          <h1>
            A little follow-through<span className="accent">.</span>
          </h1>
          <p className="page-description">
            Unpaid and partially paid bills for this cycle. Overdue accounts
            come first.
          </p>
        </div>
        <Link className="button" href="/payments">
          <Icon name="plus" size={17} /> Record payment
        </Link>
      </header>
      <section className="stats stats-three">
        <article className="stat-card">
          <span>Left to collect</span>
          <strong>{peso(rows.reduce((s, b) => s + b.balance, 0))}</strong>
          <small>Current cycle</small>
        </article>
        <article className="stat-card">
          <span>Bills with a balance</span>
          <strong>{rows.length}</strong>
          <small>Unpaid or partially paid</small>
        </article>
        <article className="stat-card">
          <span>Past the due date</span>
          <strong>{rows.filter((b) => b.status === "overdue").length}</strong>
          <small>Based on saved bill due dates</small>
        </article>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>The follow-up list</h2>
          <span className="muted">{rows.length} bills</span>
        </div>
        {!rows.length ? (
          <div className="empty">
            <Icon name="check" size={32} />
            <h3>All clear for this cycle.</h3>
            <p>No outstanding balances to collect.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Bill</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Due date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id}>
                    <td className="name">
                      <Link href={`/clients/${b.client_id}`}>{b.name}</Link>
                      <small className="table-subtext">{b.plan}</small>
                    </td>
                    <td>{peso(b.amount)}</td>
                    <td>{peso(b.paid)}</td>
                    <td className="balance">{peso(b.balance)}</td>
                    <td>{dateLabel(b.due_date)}</td>
                    <td>
                      <span className={`badge ${b.status}`}>{b.status}</span>
                    </td>
                    <td>
                      <Link
                        className="bill-action"
                        href={`/payments?bill=${b.id}`}
                      >
                        Collect <Icon name="arrow" size={14} />
                      </Link>
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
