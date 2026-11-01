// Test-only Supabase HTTP fixture. Never used by production application code.
import http from "node:http";
const month = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
}).formatToParts(new Date());
const cycle =
  month.find((p) => p.type === "year").value +
  "-" +
  month.find((p) => p.type === "month").value +
  "-01";
const clientId = "11111111-1111-4111-8111-111111111111";
const billId = "22222222-2222-4222-8222-222222222222";
const portal = "33333333-3333-4333-8333-333333333333";
const clients = [
  {
    id: clientId,
    name: "Maria Santos",
    phone: "09171234567",
    address: "San Isidro",
    plan: "Home 50 Mbps",
    monthly_fee: 799.25,
    status: "active",
    due_date: cycle,
    notes: "Installed near the plaza.",
    portal_token: portal,
  },
];
const bills = [
  {
    id: billId,
    client_id: clientId,
    billing_month: cycle,
    amount: 799.25,
    plan: "Home 50 Mbps",
    due_date: cycle,
    clients: { name: "Maria Santos" },
  },
];
const payments = [
  {
    id: "44444444-4444-4444-8444-444444444444",
    client_id: clientId,
    billing_month: cycle,
    amount: 200,
    paid_at: new Date().toISOString(),
    method: "cash",
    reference: null,
    voided_at: null,
    voided_reason: null,
    clients: { name: "Maria Santos" },
  },
];
payments.push({
  id: "55555555-5555-4555-8555-555555555555",
  client_id: clientId,
  billing_month: "2025-12-01",
  amount: 900,
  paid_at: "2025-12-31T15:59:00.000Z",
  method: "cash",
  reference: null,
  voided_at: null,
  voided_reason: null,
  clients: { name: "Maria Santos" },
});
http
  .createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const reply = (data, status = 200) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    };
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};
    if (url.pathname === "/health") return reply({ ok: true });
    if (url.pathname.endsWith("/rpc/check_login_attempt"))
      return reply(body.p_success);
    if (url.pathname.endsWith("/rpc/ensure_current_bills")) return reply(null);
    if (url.pathname.endsWith("/rpc/record_payment")) {
      const old = payments.find((p) => p.request_id === body.p_request_id);
      if (old) return reply(old.id);
      const paid = payments
        .filter(
          (p) =>
            !p.voided_at &&
            p.billing_month === cycle &&
            p.client_id === clientId,
        )
        .reduce((s, p) => s + p.amount, 0);
      if (body.p_amount > bills[0].amount - paid)
        return reply(
          {
            message:
              "Payment exceeds the current balance. Refresh and try again.",
          },
          400,
        );
      const p = {
        id: crypto.randomUUID(),
        client_id: clientId,
        billing_month: cycle,
        amount: body.p_amount,
        method: body.p_method,
        reference: body.p_reference,
        paid_at: new Date().toISOString(),
        voided_at: null,
        voided_reason: null,
        clients: { name: clients[0].name },
        request_id: body.p_request_id,
      };
      payments.unshift(p);
      return reply(p.id);
    }
    const table = url.pathname.split("/").pop();
    const source =
      table === "clients"
        ? clients
        : table === "bills"
          ? bills
          : table === "payments"
            ? payments
            : null;
    if (!source) return reply({ message: "Unknown fixture endpoint" }, 404);
    let rows = source.filter((row) =>
      [...url.searchParams].every(([key, value]) => {
        if (value.startsWith("eq.")) return String(row[key]) === value.slice(3);
        if (value.startsWith("gte.")) return String(row[key]) >= value.slice(4);
        if (value.startsWith("lt.")) return String(row[key]) < value.slice(3);
        if (value === "is.null") return row[key] == null;
        return true;
      }),
    );
    if (req.method === "PATCH") {
      rows.forEach((p) => Object.assign(p, body));
      const single = (req.headers.accept ?? "").includes("vnd.pgrst.object");
      return reply(single ? (rows[0] ?? null) : rows);
    }
    if (req.method === "POST" && table === "clients") {
      const c = {
        ...body,
        id: crypto.randomUUID(),
        portal_token: crypto.randomUUID(),
      };
      clients.push(c);
      return reply(c);
    }
    if (url.searchParams.get("limit"))
      rows = rows.slice(0, Number(url.searchParams.get("limit")));
    const single = (req.headers.accept ?? "").includes("vnd.pgrst.object");
    return reply(single ? (rows[0] ?? null) : rows);
  })
  .listen(54329, "127.0.0.1", () =>
    console.log("Test fixture listening on 54329"),
  );
