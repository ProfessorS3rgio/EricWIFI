import Link from "next/link";
import { getAnnualCollections, getBills, getClients } from "../../../lib/data";
import { dateLabel, localDate, peso } from "../../../lib/billing";
import Icon from "../../../components/Icon";
import DashboardBills from "./DashboardBills";

export default async function DashboardPage() {
  const year = Number(localDate().slice(0, 4));
  const [bills, clients, annual] = await Promise.all([
    getBills(),
    getClients(),
    getAnnualCollections(year),
  ]);
  const expected = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const collected = bills.reduce((sum, bill) => sum + bill.paid, 0);
  const outstanding = bills.reduce((sum, bill) => sum + bill.balance, 0);
  const paid = bills.filter((bill) => bill.balance === 0).length;
  const overdue = bills.filter((bill) => bill.status === "overdue");
  const rate = expected
    ? Math.min(100, Math.round((collected / expected) * 100))
    : 0;
  return (
    <main className="content-shell dashboard-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">
            {dateLabel(localDate(), { weekday: "long" })}
          </p>
          <h1>
            A clear view of your network<span className="accent">.</span>
          </h1>
          <p className="page-description">
            Your customers, collections, and next steps. All in one place.
          </p>
        </div>
        <Link className="button" href="/payments">
          <Icon name="plus" size={17} /> Record payment
        </Link>
      </header>
      <section className="stats" aria-label="Monthly summary">
        <article className="stat-card">
          <div className="stat-top">
            <span>Collected this cycle</span>
            <span className="stat-icon mint">
              <Icon name="payments" />
            </span>
          </div>
          <strong>{peso(collected)}</strong>
          <small>
            {paid} of {bills.length} bills fully paid
          </small>
        </article>
        <article className="stat-card">
          <div className="stat-top">
            <span>Still to collect</span>
            <span className="stat-icon amber">
              <Icon name="outstanding" />
            </span>
          </div>
          <strong>{peso(outstanding)}</strong>
          <small>
            {bills.filter((b) => b.balance > 0).length} bills with a balance
          </small>
        </article>
        <article className="stat-card">
          <div className="stat-top">
            <span>Expected this cycle</span>
            <span className="stat-icon blue">
              <Icon name="dashboard" />
            </span>
          </div>
          <strong>{peso(expected)}</strong>
          <small>Based on saved monthly bills</small>
        </article>
        <article className="stat-card">
          <div className="stat-top">
            <span>Your customers</span>
            <span className="stat-icon violet">
              <Icon name="clients" />
            </span>
          </div>
          <strong>{clients.length.toString().padStart(2, "0")}</strong>
          <small>
            {clients.filter((c) => c.status !== "inactive").length} connected ·{" "}
            {clients.filter((c) => c.status === "inactive").length} inactive
          </small>
        </article>
      </section>
      <div className="dashboard-columns">
        <DashboardBills bills={bills} />
        <div className="dashboard-aside">
          <section className="collection-card">
            <span className="section-kicker">THE MONTH IN MOTION</span>
            <h2>Every collection counts.</h2>
            <div className="collection-total">
              {rate}
              <span>%</span>
            </div>
            <p>of this cycle’s expected revenue collected</p>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Collection progress"
              aria-valuenow={rate}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div style={{ width: rate + "%" }} />
            </div>
            <div className="collection-foot">
              <span>{peso(collected)} collected</span>
              <Icon name="check" size={16} />
            </div>
          </section>
          <section
            className="panel annual-card"
            aria-label={`Collected in ${year}`}
          >
            <div className="annual-card-heading">
              <span className="stat-icon blue">
                <Icon name="payments" />
              </span>
              <span>{year} COLLECTIONS</span>
            </div>
            <h2>Collected this year</h2>
            <strong>{peso(annual.total)}</strong>
            <p>
              {annual.count} valid {annual.count === 1 ? "payment" : "payments"}{" "}
              received · Jan–Dec {year}
            </p>
          </section>
          <section className="panel attention-panel">
            <div className="panel-heading">
              <h2>Needs a little attention</h2>
              <span className="count-badge">{overdue.length}</span>
            </div>
            <p>
              {overdue.length
                ? `${overdue.length} overdue bills total ${peso(overdue.reduce((sum, b) => sum + b.balance, 0))}. A good place to start today.`
                : "No overdue bills right now. You’re all caught up."}
            </p>
            <Link className="text-link" href="/outstanding">
              Review balances <Icon name="arrow" size={16} />
            </Link>
          </section>
          <Link href="/clients/new" className="quick-add">
            <span className="stat-icon blue">
              <Icon name="plus" />
            </span>
            <span>
              <strong>Growing your network?</strong>
              <small>Add a new customer</small>
            </span>
            <Icon name="arrow" size={18} />
          </Link>
        </div>
      </div>
    </main>
  );
}
