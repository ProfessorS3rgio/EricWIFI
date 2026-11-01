import { NextResponse } from "next/server";
import { database } from "../../../../lib/supabase";
import { mutationGuard, invalid } from "../../../../lib/http";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await mutationGuard(request);
  if (denied) return denied;
  const { id } = await params;
  if (!uuid.test(id)) return invalid("Invalid client ID.");
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
      .update({
        name,
        plan,
        monthly_fee: amount,
        status: body.status,
        due_date: body.due_date || null,
        phone: optional(body.phone, 30),
        address: optional(body.address, 500),
        notes: optional(body.notes, 2000),
      })
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error)
      return invalid("Could not update the client. Check the entered details.");
    if (!data)
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return invalid(
      "Could not update client. Check your connection and try again.",
    );
  }
}
