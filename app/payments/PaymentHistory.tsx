"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Payment = {
  id: string;
  amount: number;
  paid_at: string;
  method: string;
  reference: string | null;
  voided_at: string | null;
  voided_reason: string | null;
  clientName: string;
};

const peso = (value: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);

export default function PaymentHistory({ payments }: { payments: Payment[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  async function voidPayment(payment: Payment) {
    const reason = window.prompt("Why are you voiding this payment?", "Entered incorrectly");
    if (reason === null) return;
    setBusyId(payment.id);
    setError("");
    const response = await fetch(`/api/payments/${payment.id}/void`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason })
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error || "Unable to void payment.");
      setBusyId("");
      return;
    }
    setBusyId("");
    router.refresh();
  }

  return <section className="panel"><div className="panel-heading"><h2>Recent payments</h2></div>{error && <p className="dashboard-error">{error}</p>}{!payments.length ? <div className="empty">No payments recorded yet.</div> : <div className="table-wrap"><table><thead><tr><th>Client</th><th>Amount</th><th>Method</th><th>Paid at</th><th>Status</th><th>Action</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.id} className={payment.voided_at ? "voided-payment" : ""}><td className="name">{payment.clientName}</td><td>{peso(Number(payment.amount))}</td><td>{payment.method}</td><td>{new Date(payment.paid_at).toLocaleDateString("en-PH")}</td><td><span className={`badge ${payment.voided_at ? "voided" : "active"}`}>{payment.voided_at ? "Voided" : "Valid"}</span></td><td>{payment.voided_at ? <small className="void-reason">{payment.voided_reason || "No reason provided"}</small> : <button className="void-button" disabled={busyId === payment.id} onClick={() => voidPayment(payment)}>{busyId === payment.id ? "Voiding..." : "Void"}</button>}</td></tr>)}</tbody></table></div>}</section>;
}
