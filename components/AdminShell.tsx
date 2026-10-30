"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "./Icon";
const links = [
  { label: "Overview", href: "/dashboard", icon: "dashboard" },
  { label: "Clients", href: "/clients", icon: "clients" },
  { label: "Payments", href: "/payments", icon: "payments" },
  { label: "Outstanding", href: "/outstanding", icon: "outstanding" },
];
export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [error, setError] = useState("");
  async function logout() {
    try {
      const response = await fetch("/api/login", { method: "DELETE" });
      if (!response.ok) throw new Error();
      router.push("/login");
      router.refresh();
    } catch {
      setError("Could not sign out. Try again.");
    }
  }
  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <span className="brand-mark">
            <Icon name="wifi" size={24} />
          </span>
          <span>
            <b>
              eric<span className="brand-accent">wifi</span>
            </b>
            <small>THE COLLECTION DESK</small>
          </span>
        </Link>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {links.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                href={link.href}
                key={link.href}
                className={active ? "active" : ""}
                aria-current={active ? "page" : undefined}
              >
                <Icon name={link.icon} />
                <span>{link.label}</span>
                {active && <i className="nav-dot" />}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <span className="live-dot" /> A little less admin.
          <br />
          <strong>A little more connected.</strong>
        </div>
        <div className="sidebar-bottom">
          <div className="operator-avatar">E</div>
          <div className="operator-copy">
            <strong>Eric WiFi Man</strong>
            <small>Administrator</small>
          </div>
          <button onClick={logout} aria-label="Sign out" title="Sign out">
            <Icon name="logout" size={18} />
          </button>
        </div>
        {error && <p role="alert">{error}</p>}
      </aside>
      <div className="main-content">
        <div className="workspace-bar">
          <span>
            <span className="live-dot" /> EricWIFI workspace
          </span>
          <span className="workspace-caption">
            Small network. Clear picture.
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
