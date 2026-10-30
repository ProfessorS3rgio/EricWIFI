import { getBills } from "../../../lib/data";
import { database } from "../../../lib/supabase";
import PaymentForm from "./PaymentForm";
import PaymentHistory from "./PaymentHistory";
export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ bill?: string }>;
}) {
  const query = await searchParams;
  const bills = await getBills(null);
  const { data: payments, error } = await database()
    .from("payments")
    .select(
      "id,amount,billing_month,paid_at,method,reference,voided_at,voided_reason,clients(name)",
    )
    .order("paid_at", { ascending: false })
    .limit(50);
  if (error) throw new Error("Could not load payment history.");
  return (
    <main className="content-shell">
      <header className="page-heading">
        <div>
          <p className="eyebrow">GOOD CONNECTIONS. CLEAR COLLECTIONS.</p>
          <h1>
            Make it official<span className="accent">.</span>
          </h1>
          <p className="page-description">
            Record a collection, review the details, and keep a reliable trail.
          </p>
        </div>
        <span className="cycle-pill">Manual payment recording</span>
      </header>
      <div className="two-column">
        <PaymentForm bills={bills} initialBillId={query.bill} />
        <PaymentHistory
          payments={(payments ?? []).map((p) => {
            const relation = p.clients as unknown as
              { name: string } | { name: string }[] | null;
            return {
              ...p,
              amount: Number(p.amount),
              clientName: Array.isArray(relation)
                ? (relation[0]?.name ?? "Unknown client")
                : (relation?.name ?? "Unknown client"),
            };
          })}
        />
      </div>
    </main>
  );
}
