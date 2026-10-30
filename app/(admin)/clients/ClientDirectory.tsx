"use client";
import Link from "next/link";
import { useState } from "react";
import type { Client } from "../../../lib/data";
import { dateLabel, peso } from "../../../lib/billing";
import Icon from "../../../components/Icon";
type Row = Pick<
  Client,
  "id" | "name" | "phone" | "plan" | "monthly_fee" | "status" | "due_date"
>;
export default function ClientDirectory({ clients }: { clients: Row[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const rows = clients.filter(
    (c) =>
      (status === "all" || c.status === status) &&
      `${c.name} ${c.phone ?? ""} ${c.plan}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <section className="panel">
      <div className="directory-toolbar">
        <label className="search-field">
          <Icon name="search" size={18} />
          <input
            aria-label="Search clients"
            placeholder="Search by name, phone, or plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="Filter account status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All account statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="overdue">Overdue (legacy)</option>
        </select>
        <span className="muted" aria-live="polite">
          {rows.length} clients
        </span>
      </div>
      {!rows.length ? (
        <div className="empty">
          <h3>
            {clients.length
              ? "No matching clients."
              : "Meet your first customer."}
          </h3>
          <p>
            {clients.length
              ? "Try another name or clear your filters."
              : "Add a client to start keeping track of their connection."}
          </p>
          {!clients.length && (
            <Link className="button" href="/clients/new">
              Add a client
            </Link>
          )}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Plan</th>
                <th>Monthly fee</th>
                <th>Account status</th>
                <th>Billing day</th>
                <th>
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((client) => (
                <tr key={client.id}>
                  <td>
                    <Link
                      className="client-cell"
                      href={`/clients/${client.id}`}
                    >
                      <span className="customer-avatar">
                        {client.name.charAt(0)}
                      </span>
                      <span>
                        <strong>{client.name}</strong>
                        <small>{client.phone || "No phone registered"}</small>
                      </span>
                    </Link>
                  </td>
                  <td>{client.plan}</td>
                  <td className="money">{peso(Number(client.monthly_fee))}</td>
                  <td>
                    <span className={`badge ${client.status}`}>
                      {client.status}
                    </span>
                  </td>
                  <td>
                    {client.due_date
                      ? `Day ${Number(client.due_date.slice(-2))}`
                      : "Not set"}
                  </td>
                  <td>
                    <Link
                      className="text-link"
                      href={`/clients/${client.id}`}
                      aria-label={`View ${client.name}`}
                    >
                      <Icon name="arrow" size={18} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
