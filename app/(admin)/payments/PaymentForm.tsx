"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { Bill } from "../../../lib/data";
import { peso, dateLabel } from "../../../lib/billing";
import { postJson } from "../../../lib/client-api";
import Icon from "../../../components/Icon";
type Review = {
  bill_id: string;
  amount: number;
  method: string;
  reference: string;
  request_id: string;
  name: string;
  month: string;
};
export default function PaymentForm({
  bills,
  initialBillId,
}: {
  bills: Bill[];
  initialBillId?: string;
}) {
  const router = useRouter();
  const open = bills.filter((b) => b.balance > 0);
  const [selected, setSelected] = useState(
    open.find((b) => b.id === initialBillId)?.id ?? "",
  );
  const [amount, setAmount] = useState(
    initialBillId
      ? String(open.find((b) => b.id === initialBillId)?.balance ?? "")
      : "",
  );
  const [review, setReview] = useState<Review | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const bill = open.find((b) => b.id === selected);
  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const form = new FormData(event.currentTarget);
    if (!bill || Number(amount) <= 0 || Number(amount) > bill.balance) {
      setError("Enter an amount within the outstanding balance.");
      return;
    }
    setReview({
      bill_id: bill.id,
      amount: Number(amount),
      method: String(form.get("method")),
      reference: String(form.get("reference")).trim(),
      request_id: crypto.randomUUID(),
      name: bill.name,
      month: bill.billing_month,
    });
  }
  async function save() {
    if (!review || saving) return;
    setSaving(true);
    setError("");
    try {
      await postJson("/api/payments", review);
      setSuccess(`${peso(review.amount)} recorded for ${review.name}.`);
      setReview(null);
      setSelected("");
      setAmount("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save payment.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="panel payment-entry">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">
            {review ? "02 / REVIEW & SAVE" : "01 / COLLECTION DETAILS"}
          </p>
          <h2>{review ? "Everything look right?" : "Record a payment"}</h2>
        </div>
        <span className="stat-icon mint">
          <Icon name="payments" />
        </span>
      </div>
      {success && (
        <p className="success-message" role="status">
          <Icon name="check" size={18} />
          {success}
        </p>
      )}
      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}
      {review ? (
        <div className="payment-review">
          <p className="review-amount">{peso(review.amount)}</p>
          <p className="muted">Payment from {review.name}</p>
          <dl className="detail-list">
            <div>
              <dt>Billing cycle</dt>
              <dd>{dateLabel(review.month, { day: undefined })}</dd>
            </div>
            <div>
              <dt>Method</dt>
              <dd>{review.method}</dd>
            </div>
            <div>
              <dt>Reference</dt>
              <dd>{review.reference || "None"}</dd>
            </div>
          </dl>
          <p className="helper-text">
            Confirm after you have received the money. A partial payment leaves
            the remaining balance open.
          </p>
          <button className="button full" disabled={saving} onClick={save}>
            {saving ? "Saving paymentâ€¦" : "Confirm & save payment"}
            <Icon name="check" size={17} />
          </button>
          <button
            className="button secondary full"
            disabled={saving}
            onClick={() => {
              setReview(null);
              setError("");
            }}
          >
            Back to details
          </button>
        </div>
      ) : !open.length ? (
        <div className="empty">
          <Icon name="check" size={32} />
          <h3>No open bills.</h3>
          <p>
            All saved bills are paid, or no active clients have been added yet.
          </p>
        </div>
      ) : (
        <form className="payment-fields" onSubmit={prepare}>
          <label>
            Customer bill
            <select
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value);
                setAmount(
                  String(
                    open.find((b) => b.id === e.target.value)?.balance ?? "",
                  ),
                );
              }}
              required
            >
              <option value="">Choose a customer</option>
              {open.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} Â· {peso(b.balance)} due
                </option>
              ))}
            </select>
          </label>
          {bill && (
            <div className="selected-balance">
              <span>
                {dateLabel(bill.billing_month, { day: undefined })} Â· Remaining
                balance
              </span>
              <strong>{peso(bill.balance)}</strong>
              <small>
                {peso(bill.paid)} already paid of {peso(bill.amount)}
              </small>
            </div>
          )}
          <label>
            Amount received
            <div className="money-input">
              <span>â‚±</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                max={bill?.balance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </label>
          <label>
            Payment method
            <select name="method" defaultValue="cash">
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
              <option value="bank">Bank transfer</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Reference <span className="optional">Optional</span>
            <input
              name="reference"
              maxLength={200}
              placeholder="Receipt or transaction number"
            />
          </label>
          <button className="button full">
            Review payment <Icon name="arrow" size={17} />
          </button>
          <p className="helper-text">
            Youâ€™ll review the details before this is saved.
          </p>
        </form>
      )}
    </section>
  );
}
