import Link from "next/link";
import { database } from "../../lib/supabase";
import { readAll } from "../../lib/rows";
import {
  dateLabel,
  outstandingBalance,
  paymentTotal,
  peso,
} from "../../lib/billing";
import Icon from "../../components/Icon";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Your bill · EricWIFI",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default async function CustomerPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const query = await searchParams;
  const token = typeof query.token === "string" ? query.token.trim() : "";
  let account: { name: string; plan: string } | null = null;
  let rows: {
    id: string;
    month: string;
    due: string | null;
    amount: number;
    paid: number;
    balance: number;
  }[] = [];
  let unavailable = false;
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      token,
    )
  ) {
    try {
      const db = database();
      const { data: client, error } = await db
        .from("clients")
        .select("id,name,plan")
        .eq("portal_token", token)
        .maybeSingle();
      if (error) throw error;
      if (client) {
        const [{ data: bills, error: be }, payments] = await Promise.all([
          db
            .from("bills")
            .select("id,billing_month,due_date,amount")
            .eq("client_id", client.id)
            .order("billing_month", { ascending: false })
            .limit(12),
          readAll(
            db
              .from("payments")
              .select("billing_month,amount")
              .eq("client_id", client.id)
              .is("voided_at", null)
              .order("id"),
          ),
        ]);
        if (be) throw be;
        account = client;
        rows = (bills ?? []).map((b) => {
          const paid = paymentTotal(
            (payments ?? []).filter((p) => p.billing_month === b.billing_month),
          );
          return {
            id: b.id,
            month: b.billing_month,
            due: b.due_date,
            amount: Number(b.amount),
            paid,
            balance: outstandingBalance(b.amount, paid),
          };
        });
      }
    } catch {
      unavailable = true;
    }
  }
  return (
    <main className="customer-page">
      <section className="customer-card">
        <header className="customer-header">
          <Link href="/" className="public-brand">
            <span className="brand-mark">
              <Icon name="wifi" size={23} />
            </span>
            <strong>
              eric<span className="brand-accent">wifi</span>
            </strong>
          </Link>
          <span className="cycle-pill">Your personal bill</span>
        </header>
        {account ? (
          <>
            <p className="eyebrow">HELLO, {account.name.toUpperCase()}</p>
            <h1>A clear connection.</h1>
            <p className="login-copy">
              {account.plan} · Your latest saved bills
            </p>
            {!rows.length ? (
              <div className="empty">
                Your administrator hasn’t issued a bill yet.
              </div>
            ) : (
              rows.map((b, i) => (
                <section
                  className={i === 0 ? "customer-current" : "customer-past"}
                  key={b.id}
                >
                  <div className="public-board-heading">
                    <h2>{dateLabel(b.month, { day: undefined })}</h2>
                    <span className={`badge ${b.balance ? "due" : "paid"}`}>
                      {b.balance ? "Balance due" : "Paid"}
                    </span>
                  </div>
                  <div className={`balance-card ${b.balance ? "due" : "paid"}`}>
                    <span>Amount remaining</span>
                    <strong>{peso(b.balance)}</strong>
                  </div>
                  <div className="bill-lines">
                    <span>
                      Monthly bill<b>{peso(b.amount)}</b>
                    </span>
                    <span>
                      Payments recorded<b>{peso(b.paid)}</b>
                    </span>
                    <span>
                      Due date<b>{dateLabel(b.due)}</b>
                    </span>
                  </div>
                </section>
              ))
            )}
          </>
        ) : (
          <>
            <p className="eyebrow">JUST FOR YOU</p>
            <h1>Your bill has its own space.</h1>
            <p className="login-copy">
              {unavailable
                ? "Bills are temporarily unavailable. Please try again shortly."
                : token
                  ? "We couldn’t find that bill link. Ask your administrator for a new link."
                  : "Use the private link shared by your WiFi administrator, or paste your bill access code below."}
            </p>
            <form className="portal-form">
              <label>
                Bill access code
                <input
                  name="token"
                  autoComplete="off"
                  placeholder="Code from your private bill link"
                  required
                />
              </label>
              <button className="button full">
                View my bill <Icon name="arrow" size={17} />
              </button>
            </form>
          </>
        )}
        <p className="public-note">
          Questions or a payment to report? Contact your WiFi administrator.
        </p>
        <Link className="customer-link" href="/">
          ← Back to EricWIFI
        </Link>
      </section>
    </main>
  );
}
