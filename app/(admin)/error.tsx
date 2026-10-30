"use client";
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="content-shell">
      <section className="error-card" role="alert">
        <p className="eyebrow">A connection needs attention</p>
        <h1>We couldn’t load your workspace.</h1>
        <p>
          Check your connection. If this is a new installation, set the server
          environment variables and run the database migration.
        </p>
        <button className="button" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
