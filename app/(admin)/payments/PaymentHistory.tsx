"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { peso, dateLabel } from "../../../lib/billing";
import { postJson } from "../../../lib/client-api";
type Payment = {
  id: string;
  amount: number;
  billing_month: string;
  paid_at: string;
  method: string;
  reference: string | null;
  voided_at: string | null;
  voided_reason: string | null;
  clientName: string;
};
export default function PaymentHistory({ payments }: { payments: Payment[] }) {
  const router = useRouter();
  const [target, setTarget] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function voidPayment(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await postJson(`/api/payments/${target}/void`, { reason });
      setTarget("");
      setReason("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not void payment.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">THE PAPER TRAIL</p>
          <h2>Recent collections</h2>
        </div>
        <span className="count-badge">{payments.length}</span>
      </div>
      {target && (
        <form className="void-form" onSubmit={voidPayment}>
          <strong>
            Void {peso(payments.find((p) => p.id === target)?.amount ?? 0)} from{" "}
            {payments.find((p) => p.id === target)?.clientName}?
          </strong>
          <p className="helper-text">
            This keeps the original record and restores the bill’s balance.
          </p>
          <label>
            Reason
            <input
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              required
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="action-row">
            <button className="button danger" disabled={busy || !reason.trim()}>
              {busy ? "Voiding…" : "Confirm void"}
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={() => {
                setTarget("");
                setError("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {!payments.length ? (
        <div className="empty">
          <h3>A fresh start.</h3>
          <p>Your recorded payments will appear here.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer / cycle</th>
                <th>Amount</th>
                <th>Method / reference</th>
                <th>Received</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className={p.voided_at ? "voided-payment" : ""}>
                  <td className="name">
                    {p.clientName}
                    <small className="table-subtext">
                      {dateLabel(p.billing_month, { day: undefined })}
                    </small>
                  </td>
                  <td className="money">{peso(p.amount)}</td>
                  <td>
                    {p.method}
                    <small className="table-subtext">
                      {p.reference || "No reference"}
                    </small>
                  </td>
                  <td>{dateLabel(p.paid_at)}</td>
                  <td>
                    <span
                      className={`badge ${p.voided_at ? "voided" : "paid"}`}
                    >
                      {p.voided_at ? "Voided" : "Received"}
                    </span>
                  </td>
                  <td>
                    {p.voided_at ? (
                      <small className="void-reason">{p.voided_reason}</small>
                    ) : (
                      <button
                        className="void-button"
                        disabled={busy}
                        onClick={() => {
                          setTarget(p.id);
                          setReason("");
                          setError("");
                        }}
                      >
                        Void
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="panel-footer">
        Latest 50 records · Voided entries stay in your history
      </div>
    </section>
  );
}
