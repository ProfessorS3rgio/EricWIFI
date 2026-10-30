"use client";
import { useState } from "react";
import type { PublicBill } from "../lib/data";
import { dateLabel, peso } from "../lib/billing";
import Icon from "./Icon";

export default function PublicBillBoard({ bills }: { bills: PublicBill[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const rows = bills
    .filter(
      (bill) =>
        (filter === "all" ||
          (filter === "paid" ? bill.balance === 0 : bill.balance > 0)) &&
        `${bill.name} ${bill.plan}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <section className="public-bill-board" aria-label="Customer bills">
      <div className="board-toolbar">
        <div>
          <p className="eyebrow">CURRENT BILLING CYCLE</p>
          <h2>
            Customer bills <span className="count-badge">{bills.length}</span>
          </h2>
        </div>
        <div className="board-controls">
          <label className="search-field">
            <Icon name="search" size={18} />
            <input
              aria-label="Find your bill"
              placeholder="Search your name or plan…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <select
            aria-label="Filter bill status"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All bills</option>
            <option value="unpaid">With balance</option>
            <option value="paid">Fully paid</option>
          </select>
        </div>
      </div>
      <p className="board-count" aria-live="polite">
        {rows.length} {rows.length === 1 ? "bill" : "bills"} ·{" "}
        {bills.filter((bill) => bill.balance === 0).length} fully paid this
        cycle
      </p>
      {!rows.length ? (
        <div className="panel empty">
          <Icon name="wifi" size={32} />
          <h3>
            {bills.length
              ? "No matching bills."
              : "No bills published for this cycle yet."}
          </h3>
          <p>
            {bills.length
              ? "Try a different name or choose another status."
              : "Please check back after your administrator prepares this month’s bills."}
          </p>
        </div>
      ) : (
        <div className="public-bill-grid">
          {rows.map((bill) => (
            <article className="public-bill-card" key={bill.id}>
              <div className="public-bill-top">
                <span className="customer-avatar">
                  {bill.name.charAt(0).toUpperCase()}
                </span>
                <span className={`badge ${bill.status}`}>
                  {bill.status === "due"
                    ? "Balance due"
                    : bill.status === "partial"
                      ? "Partially paid"
                      : bill.status}
                </span>
              </div>
              <h3>{bill.name}</h3>
              <p className="public-bill-plan">{bill.plan}</p>
              <div
                className={`public-bill-balance ${bill.balance === 0 ? "settled" : ""}`}
              >
                <span>Amount remaining</span>
                <strong>{peso(bill.balance)}</strong>
              </div>
              <dl className="public-bill-details">
                <div>
                  <dt>Monthly bill</dt>
                  <dd>{peso(bill.amount)}</dd>
                </div>
                <div>
                  <dt>Payments recorded</dt>
                  <dd>{peso(bill.paid)}</dd>
                </div>
                <div>
                  <dt>Due date</dt>
                  <dd>{dateLabel(bill.due_date)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
