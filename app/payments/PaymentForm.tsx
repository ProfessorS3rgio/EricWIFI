"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function PaymentForm({ clients }: { clients: { id: string; name: string; monthly_fee: number }[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    const form = new FormData(event.currentTarget);
    const { error: insertError } = await supabase.from("payments").insert({ client_id: form.get("client_id"), billing_month: `${form.get("billing_month")}-01`, amount: Number(form.get("amount")), method: form.get("method"), reference: form.get("reference") || null, notes: form.get("notes") || null });
    if (insertError) { setError(insertError.message); setSaving(false); return; }
    event.currentTarget.reset(); setSaving(false); router.refresh();
  }
  return <form className="form-card compact" onSubmit={submit}><div><p className="eyebrow">Record collection</p><h2>Mark payment as paid</h2></div><label>Client<select name="client_id" required><option value="">Select a client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name} — ₱{client.monthly_fee}/month</option>)}</select></label><label>Billing month<input name="billing_month" type="month" defaultValue={new Date().toISOString().slice(0, 7)} required /></label><label>Amount paid<input name="amount" type="number" min="0.01" step="0.01" required /></label><label>Payment method<select name="method" defaultValue="cash"><option value="cash">Cash</option><option value="gcash">GCash</option><option value="bank">Bank transfer</option><option value="other">Other</option></select></label><label>Reference<input name="reference" placeholder="Optional receipt/reference number" /></label>{error && <p className="form-error">{error}</p>}<button className="button" disabled={saving}>{saving ? "Saving..." : "Save payment"}</button></form>;
}
