export default function Loading() {
  return (
    <main
      className="content-shell"
      aria-busy="true"
      aria-label="Loading workspace"
    >
      <div className="skeleton skeleton-title" />
      <div className="stats">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="skeleton skeleton-card" />
        ))}
      </div>
      <div className="skeleton skeleton-panel" />
    </main>
  );
}
