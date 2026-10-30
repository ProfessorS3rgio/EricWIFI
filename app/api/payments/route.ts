import { NextResponse } from "next/server";
import { database } from "../../../lib/supabase";
import { mutationGuard, invalid } from "../../../lib/http";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function POST(request: Request) {
  const denied = await mutationGuard(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const amount = Number(body.amount);
    if (
      !uuid.test(body.bill_id) ||
      !uuid.test(body.request_id) ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > 99999999.99 ||
      Math.abs(amount * 100 - Math.round(amount * 100)) > 0.00001 ||
      !["cash", "gcash", "bank", "other"].includes(body.method)
    )
      return invalid("Choose a bill, a valid amount, and payment method.");
    const { data, error } = await database().rpc("record_payment", {
      p_bill_id: body.bill_id,
      p_amount: amount,
      p_method: body.method,
      p_reference:
        typeof body.reference === "string"
          ? body.reference.slice(0, 200)
          : null,
      p_request_id: body.request_id,
    });
    if (error) {
      const known = [
        "Bill not found.",
        "Payment exceeds the current balance. Refresh and try again.",
        "This request has already been used for another payment.",
      ];
      return invalid(
        known.includes(error.message)
          ? error.message
          : "Could not record payment. Check the database migration and try again.",
      );
    }
    return NextResponse.json({ id: data }, { status: 201 });
  } catch {
    return invalid(
      "Could not save payment. Check your connection and database setup.",
    );
  }
}
