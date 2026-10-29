"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) });
    if (!response.ok) {
      const body = await response.json();
      setError(body.error || "Unable to log in.");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  }

  return <main className="login-page"><section className="login-card">
    <div className="login-logo">⌁</div>
    <p className="eyebrow">Eric WiFi Man</p>
    <h1>Welcome back</h1>
    <p className="login-copy">Enter your 4-digit MPIN to open your admin console.</p>
    <form onSubmit={submit}>
      <label>MPIN<input autoFocus inputMode="numeric" maxLength={4} pattern="[0-9]{4}" type="password" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))} required /></label>
      {error && <p className="form-error">{error}</p>}
      <button className="button full" disabled={loading || pin.length !== 4}>{loading ? "Checking..." : "Unlock dashboard"}</button>
    </form>
    <a className="customer-link" href="/customer">View customer payment status</a>
  </section></main>;
}
