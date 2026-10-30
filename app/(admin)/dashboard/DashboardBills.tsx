import Link from "next/link";
import type { Bill } from "../../../lib/data";
import { dateLabel, peso } from "../../../lib/billing";
import Icon from "../../../components/Icon";
export default function DashboardBills({ bills }: { bills: Bill[] }) {
  const rows = [...bills]
    .sort(
      (a, b) =>
        Number(b.balance > 0) - Number(a.balance > 0) ||
        Number(b.status === "overdue") - Number(a.status === "overdue") ||
        a.name.localeCompare(b.name),
    )
    .slice(0, 8);
  return (
    <section className="panel latest-bills-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">YOUR COLLECTION LIST</p>
          <h2>Customer bills</h2>
        </div>
        <Link className="text-link" href="/outstanding">
          View balances <Icon name="arrow" size={15} />
        </Link>
      </div>
      {!rows.length ? (
        <div className="empty">
          <Icon name="wifi" size={32} />
          <h3>Your network starts here.</h3>
          <p>Add your first client to see monthly bills.</p>
          <Link className="button secondary" href="/clients/new">
            Add a client
          </Link>
        </div>
      ) : (
        <div className="latest-bills-list">
          {rows.map((bill) => (
            <div className="latest-bill" key={bill.id}>
              <Link
                className="latest-bill-customer"
                href={`/clients/${bill.client_id}`}
              >
                <span className="customer-avatar">
                  {bill.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <strong>{bill.name}</strong>
                  <small>
                    {bill.plan} · {dateLabel(bill.due_date)}
                  </small>
                </div>
              </Link>
              <div className="latest-bill-amount">
                <strong>{peso(bill.balance)}</strong>
                <span className={`badge ${bill.status}`}>
                  {bill.status === "partial"
                    ? "Partially paid"
                    : bill.status === "due"
                      ? "Balance due"
                      : bill.status}
                </span>
              </div>
              {bill.balance > 0 ? (
                <Link
                  className="bill-action"
                  href={`/payments?bill=${bill.id}`}
                >
                  Collect <Icon name="arrow" size={14} />
                </Link>
              ) : (
                <span className="paid-check" aria-label="Fully paid">
                  <Icon name="check" />
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="panel-footer">
        <span>Current cycle · {bills.length} bills</span>
        <span>Amounts in PHP</span>
      </div>
    </section>
  );
}
