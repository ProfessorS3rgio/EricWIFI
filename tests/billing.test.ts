import test from "node:test";
import assert from "node:assert/strict";
import {
  currentBillingMonth,
  localDate,
  outstandingBalance,
  billStatus,
  peso,
} from "../lib/billing";
import { createSession, isValidSession } from "../lib/session";
test("Manila billing boundary uses local month, including year rollover", () => {
  assert.equal(
    currentBillingMonth(new Date("2026-10-31T15:59:59Z")),
    "2026-10-01",
  );
  assert.equal(
    currentBillingMonth(new Date("2026-10-31T16:00:00Z")),
    "2026-11-01",
  );
  assert.equal(
    currentBillingMonth(new Date("2026-12-31T16:00:00Z")),
    "2027-01-01",
  );
});
test("balances preserve centavos and never become negative", () => {
  assert.equal(outstandingBalance(100.1, 99.99), 0.11);
  assert.equal(outstandingBalance(100, 150), 0);
  assert.match(peso(100.25), /100\.25/);
});
test("bill state uses due date and settled balance", () => {
  assert.equal(billStatus(50, 0, "2000-01-01"), "overdue");
  assert.equal(billStatus(50, 50, "2099-01-01"), "partial");
  assert.equal(billStatus(100, 0, localDate()), "due");
  assert.equal(billStatus(0, 100, "2000-01-01"), "paid");
});
test("sessions reject tampering, extra segments, expired and malformed values", async () => {
  process.env.SESSION_SECRET =
    "test-secret-with-more-than-thirty-two-characters";
  const session = await createSession();
  assert.equal(await isValidSession(session), true);
  assert.equal(await isValidSession(session + ".extra"), false);
  assert.equal(await isValidSession(session.slice(0, -1) + "!"), false);
  assert.equal(await isValidSession("garbage"), false);
  const realNow = Date.now;
  try {
    Date.now = () => realNow() + 8 * 24 * 60 * 60 * 1000;
    assert.equal(await isValidSession(session), false);
  } finally {
    Date.now = realNow;
  }
});
