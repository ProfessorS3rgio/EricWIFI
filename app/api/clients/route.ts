import { NextResponse } from "next/server";
import { database } from "../../../lib/supabase";
import { mutationGuard, invalid } from "../../../lib/http";

export async function POST(request: Request) {
  const denied = await mutationGuard(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const plan = typeof body.plan === "string" ? body.plan.trim() : "";
    const amount = Number(body.monthly_fee);
    if (
      !name ||
      name.length > 120 ||
      !plan ||
      plan.length > 120 ||
      body.monthly_fee == null ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      amount > 99999999.99 ||
      Math.abs(amount * 100 - Math.round(amount * 100)) > 0.00001
    )
      return invalid(
        "Enter a name, plan, and monthly fee with at most two decimal places.",
      );
    if (!["active", "inactive", "overdue"].includes(body.status))
      return invalid("Invalid account status.");
    if (
      body.due_date &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(body.due_date) ||
        Number.isNaN(Date.parse(body.due_date)))
    )
      return invalid("Enter a valid due date.");
    const optional = (value: unknown, limit: number) =>
      typeof value === "string" ? value.trim().slice(0, limit) || null : null;
    const { data, error } = await database()
      .from("clients")
      .insert({
        name,
        plan,
        monthly_fee: amount,
        status: body.status,
        due_date: body.due_date || null,
        phone: optional(body.phone, 30),
        address: optional(body.address, 500),
        notes: optional(body.notes, 2000),
      })
      .select("id")
      .single();
    if (error)
      return invalid(
        "Could not create the client. Check the entered details and database setup.",
      );
    return NextResponse.json(data, { status: 201 });
  } catch {
    return invalid(
      "Could not save client. Check your connection and database setup.",
    );
  }
}
