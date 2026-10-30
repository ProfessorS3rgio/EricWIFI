import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
test("migration, bill snapshots, payment integrity, permissions and durable login throttle", async (t) => {
  const db = new PGlite();
  await db.exec(
    "create role anon; create role authenticated; create role service_role bypassrls;",
  );
  const schema = readFileSync("supabase/schema.sql", "utf8");
  await db.exec(schema);
  await db.exec(schema);
  const {
    rows: [client],
  } = await db.query<{ id: string }>(
    `insert into clients(name,plan,monthly_fee,status,due_date) values ('Test Client','Home',799.25,'active','2026-01-31') returning id`,
  );
  await db.exec(
    "select ensure_current_bills(); select ensure_current_bills();",
  );
  const {
    rows: [bill],
  } = await db.query<{
    id: string;
    amount: string;
    billing_month: string;
    due_date: string;
  }>("select * from bills");
  const pay = (amount: number, request = randomUUID(), method = "cash") =>
    db.query<{ id: string }>("select record_payment($1,$2,$3,null,$4) as id", [
      bill.id,
      amount,
      method,
      request,
    ]);
  await t.test(
    "bill generation is repeatable and preserves the original fee",
    async () => {
      await db.query(
        "update clients set monthly_fee=999,plan='Changed',due_date='2026-01-15' where id=$1",
        [client.id],
      );
      await db.exec("select ensure_current_bills();");
      const { rows } = await db.query<{
        amount: string;
        plan: string;
        day: number;
      }>(
        "select amount,plan,extract(day from due_date)::int as day from bills",
      );
      assert.equal(rows.length, 1);
      assert.equal(Number(rows[0].amount), 799.25);
      assert.equal(rows[0].plan, "Home");
      assert.ok(rows[0].day >= 28 && rows[0].day <= 31);
    },
  );
  await t.test(
    "partial payments, retries and overpayments preserve balances",
    async () => {
      const request = randomUUID();
      const first = await pay(300.1, request);
      const retry = await pay(300.1, request);
      assert.equal(first.rows[0].id, retry.rows[0].id);
      await assert.rejects(pay(300.11, request), /already been used/);
      await assert.rejects(pay(500), /exceeds/);
      await assert.rejects(pay(-1), /valid amount/);
      await assert.rejects(pay(0.001), /valid amount/);
      await assert.rejects(pay(1, randomUUID(), "invalid"), /valid amount/);
      await pay(499.15);
      await assert.rejects(pay(0.01), /exceeds/);
      const {
        rows: [total],
      } = await db.query<{ amount: string }>(
        "select sum(amount) as amount from payments",
      );
      assert.equal(Number(total.amount), 799.25);
      await db.query(
        "update payments set voided_at=now(),voided_reason='Correction' where id=$1",
        [first.rows[0].id],
      );
      await pay(300.1);
      const {
        rows: [valid],
      } = await db.query<{ amount: string }>(
        "select sum(amount) as amount from payments where voided_at is null",
      );
      assert.equal(Number(valid.amount), 799.25);
    },
  );
  await t.test(
    "anonymous callers cannot read customer data or execute admin functions",
    async () => {
      await db.exec("set role anon;");
      await assert.rejects(
        db.query("select * from clients"),
        /permission denied/,
      );
      await assert.rejects(
        db.query("select * from payments"),
        /permission denied/,
      );
      await assert.rejects(
        db.query("select * from bills"),
        /permission denied/,
      );
      await assert.rejects(
        db.query("select ensure_current_bills()"),
        /permission denied/,
      );
      await assert.rejects(
        db.query("select check_login_attempt(true)"),
        /permission denied/,
      );
      await db.exec("reset role;");
    },
  );
  await t.test(
    "ten failed MPIN attempts block even a correct PIN until cooldown",
    async () => {
      for (let i = 0; i < 10; i++)
        await db.query("select check_login_attempt(false)");
      const {
        rows: [blocked],
      } = await db.query<{ ok: boolean }>(
        "select check_login_attempt(true) as ok",
      );
      assert.equal(blocked.ok, false);
      await db.exec(
        "update admin_login_guard set blocked_until=now()-interval '1 second',window_start=now()-interval '16 minutes';",
      );
      const {
        rows: [allowed],
      } = await db.query<{ ok: boolean }>(
        "select check_login_attempt(true) as ok",
      );
      assert.equal(allowed.ok, true);
    },
  );
  await db.close();
});
