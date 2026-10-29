"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import AdminShell from "../../../components/AdminShell";

export default function NewClient() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const plan = String(form.get("plan") ?? "").trim();
    const monthlyFee = Number(form.get("monthly_fee"));

    if (!name || !plan || !Number.isFinite(monthlyFee) || monthlyFee < 0) {
      setError("Enter a name, plan, and valid non-negative monthly fee.");
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("clients").insert({
      name,
      phone: String(form.get("phone") ?? "").trim() || null,
      address: String(form.get("address") ?? "").trim() || null,
      plan,
      monthly_fee: monthlyFee,
      status: String(form.get("status") ?? "active"),
      due_date: String(form.get("due_date") ?? "") || null,
      notes: String(form.get("notes") ?? "").trim() || null
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    router.push("/clients");
    router.refresh();
  }

  return (
    <AdminShell>
      <main className="content-shell">
        <header className="page-heading">
          <div><p className="eyebrow">Customer management</p><h1>Add a new client</h1><p className="page-description">Create a subscription profile and start tracking their monthly account.</p></div>
          <a className="button secondary" href="/clients">← Back to clients</a>
        </header>
        <form className="client-form" onSubmit={submit}>
          <div className="form-section">
            <div className="form-section-heading"><span className="form-icon">01</span><div><h2>Customer details</h2><p>Basic information for identifying and contacting the customer.</p></div></div>
            <div className="form-grid">
              <label>Full name <span className="required">*</span><input name="name" placeholder="e.g. Juan Dela Cruz" autoComplete="name" required /></label>
              <label>Phone number<input name="phone" type="tel" placeholder="09XXXXXXXXX" autoComplete="tel" /></label>
              <label className="wide">Address<input name="address" placeholder="House number, street, barangay" autoComplete="street-address" /></label>
            </div>
          </div>
          <div className="form-section">
            <div className="form-section-heading"><span className="form-icon">02</span><div><h2>Subscription details</h2><p>Set the plan, monthly amount, and current account status.</p></div></div>
            <div className="form-grid">
              <label>Internet plan <span className="required">*</span><input name="plan" placeholder="e.g. Home 50 Mbps" required /></label>
              <label>Monthly fee <span className="required">*</span><div className="money-input"><span>₱</span><input name="monthly_fee" type="number" min="0" step="0.01" placeholder="0.00" required /></div></label>
              <label>Account status<select name="status" defaultValue="active"><option value="active">Active</option><option value="inactive">Inactive</option><option value="overdue">Overdue</option></select></label>
              <label>Payment due date<input name="due_date" type="date" /></label>
            </div>
          </div>
          <div className="form-section">
            <div className="form-section-heading"><span className="form-icon">03</span><div><h2>Additional notes <span className="optional">Optional</span></h2><p>Add installation details, reminders, or other helpful context.</p></div></div>
            <label>Notes<textarea name="notes" rows={4} placeholder="Write a note about this customer..." /></label>
          </div>
          {error && <div className="form-alert"><strong>Could not save client</strong><span>{error}</span></div>}
          <div className="form-actions"><a className="button secondary" href="/clients">Cancel</a><button className="button" disabled={saving}>{saving ? "Saving client..." : "Save client →"}</button></div>
        </form>
      </main>
    </AdminShell>
  );
}
