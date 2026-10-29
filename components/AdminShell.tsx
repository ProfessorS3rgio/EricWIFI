"use client";

import { usePathname, useRouter } from "next/navigation";

const links = [
  ["Dashboard", "/dashboard"],
  ["Clients", "/clients"],
  ["Payments", "/payments"],
  ["Outstanding", "/outstanding"]
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/login", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">⌁</span><span><b>Eric WiFi Man</b><small>Admin console</small></span></div>
        <nav>{links.map(([label, href]) => <a className={pathname === href ? "active" : ""} href={href} key={href}><span>{label === "Dashboard" ? "⌂" : label === "Clients" ? "♙" : label === "Payments" ? "₱" : "◷"}</span>{label}</a>)}</nav>
        <div className="sidebar-bottom">
          <a href="/customer"><span>▣</span> Customer view</a>
          <button onClick={logout}><span>↪</span> Logout</button>
        </div>
      </aside>
      <div className="main-content">{children}</div>
    </div>
  );
}
