"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Bill = {
  id: string;
  name: string;
  plan: string;
  monthlyFee: number;
  paid: number;
  balance: number;
  dueDate: string | null;
  billingMonth: string;
};

const peso = (value: number) => new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0
}).format(value);

export default function DashboardBills({ initialBills }: { initialBills: Bill[] }) {
  const router = useRouter();
  const [bills, setBills] = useState(initialBills);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  async function markPaid(bill: Bill) {
    if (!bill.balance) return;
    setSavingId(bill.id);
    setError("");

    const { error: insertError } = await supabase.from("payments").insert({
      client_id: bill.id,
      billing_month: bill.billingMonth,
      amount: bill.balance,
      method: "cash",
      notes: "Marked paid from dashboard"
    });

    if (insertError) {
      setError(insertError.message);
      setSavingId("");
      return;
    }

    setBills((current) => current.map((item) => item.id === bill.id ? { ...item, paid: item.paid + item.balance, balance: 0 } : item));
    setSavingId("");
    router.refresh();
  }

  return <section className="panel latest-bills-panel">
    <div className="panel-heading"><div><p className="eyebrow">Current billing cycle</p><h2>Latest customer bills</h2></div><a href="/outstanding">View outstanding</a></div>
    {error && <p className="dashboard-error">{error}</p>}
    {!bills.length ? <div className="empty">No active customer bills yet.</div> : <div className="latest-bills-list">{bills.map((bill) => <div className="latest-bill" key={bill.id}><div className="latest-bill-customer"><span className="customer-avatar">{bill.name.charAt(0).toUpperCase()}</span><div><strong>{bill.name}</strong><small>{bill.plan} · Due {bill.dueDate || "—"}</small></div></div><div className="latest-bill-amount"><small>{bill.balance ? "Outstanding" : "Paid"}</small><strong className={bill.balance ? "amount-due" : "amount-paid"}>{peso(bill.balance || bill.paid)}</strong><em>Paid {peso(bill.paid)} of {peso(bill.monthlyFee)}</em></div><button className={`bill-action ${bill.balance ? "" : "complete"}`} disabled={!bill.balance || savingId === bill.id} onClick={() => markPaid(bill)}>{savingId === bill.id ? "Saving..." : bill.balance ? "Mark paid" : "Paid ✓"}</button></div>)}</div>}
  </section>;
}
