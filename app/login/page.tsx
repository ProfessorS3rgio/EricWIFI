"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { postJson } from "../../lib/client-api";
import Icon from "../../components/Icon";
export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await postJson("/api/login", { pin });
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in.");
      setLoading(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-logo">
          <Icon name="wifi" size={30} />
        </div>
        <p className="eyebrow">ERICWIFI / THE COLLECTION DESK</p>
        <h1>
          Good to have you back<span className="accent">.</span>
        </h1>
        <p className="login-copy">
          A clear picture of your network is just four digits away.
        </p>
        <form onSubmit={submit}>
          <label>
            Admin MPIN
            <input
              autoFocus
              autoComplete="current-password"
              inputMode="numeric"
              maxLength={4}
              pattern="[0-9]{4}"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              required
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="button full"
            disabled={loading || pin.length !== 4}
          >
            {loading ? "Opening workspace…" : "Open workspace"}
            <Icon name="arrow" size={17} />
          </button>
        </form>
        <Link className="customer-link" href="/">
          ← Back to EricWIFI
        </Link>
      </section>
    </main>
  );
}
