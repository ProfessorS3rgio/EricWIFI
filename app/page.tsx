import Link from "next/link";
import Icon from "../components/Icon";
import PublicBillBoard from "../components/PublicBillBoard";
import { getPublicBills, type PublicBill } from "../lib/data";
import { currentBillingMonth, dateLabel } from "../lib/billing";

export const dynamic = "force-dynamic";
export default async function Home() {
  let bills: PublicBill[] = [];
  let unavailable = false;
  try {
    bills = await getPublicBills();
  } catch {
    unavailable = true;
  }
  return (
    <main className="public-home client-bill-page">
      <div className="public-shell">
        <header className="public-header">
          <Link className="public-brand" href="/">
            <span className="brand-mark">
              <Icon name="wifi" size={25} />
            </span>
            <strong>
              eric<span className="brand-accent">wifi</span>
            </strong>
          </Link>
          <Link className="button secondary" href="/login">
            Admin workspace <Icon name="arrow" size={16} />
          </Link>
        </header>
        <section className="bill-board-intro">
          <div>
            <p className="eyebrow">YOUR NEIGHBORHOOD. CONNECTED.</p>
            <h1>
              Your connection.
              <br />
              Your bill, clearly<span className="accent">.</span>
            </h1>
            <p>
              Find your name below to see your bill and payments for the current
              billing cycle.
            </p>
          </div>
          <span className="cycle-pill">
            <Icon name="outstanding" size={15} />
            {dateLabel(currentBillingMonth(), { day: undefined })}
          </span>
        </section>
        {unavailable ? (
          <section className="panel public-board-unavailable" role="status">
            <Icon name="wifi" size={30} />
            <h2>Bills are temporarily unavailable.</h2>
            <p>Please try again shortly or contact your WiFi administrator.</p>
          </section>
        ) : (
          <PublicBillBoard bills={bills} />
        )}
        <footer className="public-footer">
          Questions about a bill or a payment? Contact your WiFi administrator.
          <br />
          <Link className="customer-link" href="/customer">
            Have a private bill link? Open your personal portal →
          </Link>
        </footer>
      </div>
    </main>
  );
}
