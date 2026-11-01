"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Client } from "../../../../../lib/data";
export default function EditClientForm({ client }: { client: Client }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(
      [
        "name",
        "phone",
        "address",
        "plan",
        "monthly_fee",
        "status",
        "due_date",
        "notes",
      ].map((key) => [key, form.get(key)]),
    );
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(result?.error || "Could not save client.");
      router.push(`/clients/${client.id}`);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save client.",
      );
      setSaving(false);
    }
  }
  return (
    <form className="client-form" onSubmit={submit}>
      <div className="form-section">
        <div className="form-section-heading">
          <span className="form-icon">01</span>
          <div>
            <h2>Customer details</h2>
            <p>Keep the customer’s contact information up to date.</p>
          </div>
        </div>
        <div className="form-grid">
          <label>
            Full name
            <input
              name="name"
              defaultValue={client.name}
              maxLength={120}
              required
              autoComplete="name"
            />
          </label>
          <label>
            Phone number
            <input
              name="phone"
              type="tel"
              defaultValue={client.phone || ""}
              autoComplete="tel"
            />
          </label>
          <label className="wide">
            Address
            <input
              name="address"
              defaultValue={client.address || ""}
              autoComplete="street-address"
            />
          </label>
        </div>
      </div>
      <div className="form-section">
        <div className="form-section-heading">
          <span className="form-icon">02</span>
          <div>
            <h2>Subscription details</h2>
            <p>Changes to the fee and plan apply to new billing cycles.</p>
          </div>
        </div>
        <div className="form-grid">
          <label>
            Internet plan
            <input
              name="plan"
              defaultValue={client.plan}
              maxLength={120}
              required
            />
          </label>
          <label>
            Monthly fee
            <div className="money-input">
              <span>₱</span>
              <input
                name="monthly_fee"
                type="number"
                min="0"
                step="0.01"
                defaultValue={Number(client.monthly_fee)}
                required
              />
            </div>
          </label>
          <label>
            Account status
            <select name="status" defaultValue={client.status}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="overdue">Overdue</option>
            </select>
          </label>
          <label>
            Payment due date
            <input
              name="due_date"
              type="date"
              defaultValue={client.due_date || ""}
            />
          </label>
        </div>
      </div>
      <div className="form-section">
        <div className="form-section-heading">
          <span className="form-icon">03</span>
          <div>
            <h2>Notes</h2>
            <p>Private details for the administrator.</p>
          </div>
        </div>
        <label>
          Notes
          <textarea name="notes" rows={4} defaultValue={client.notes || ""} />
        </label>
      </div>
      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <Link className="button secondary" href={`/clients/${client.id}`}>
          Cancel
        </Link>
        <button className="button" disabled={saving}>
          {saving ? "Saving changes…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
