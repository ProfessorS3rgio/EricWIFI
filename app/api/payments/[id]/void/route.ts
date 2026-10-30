import { NextResponse } from "next/server";
import { database } from "../../../../../lib/supabase";
import { mutationGuard, invalid } from "../../../../../lib/http";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await mutationGuard(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await request.json();
    const reason =
      typeof body.reason === "string" ? body.reason.trim().slice(0, 200) : "";
    if (!reason)
      return invalid("Please provide a reason for voiding this payment.");
    const { data, error } = await database()
      .from("payments")
      .update({ voided_at: new Date().toISOString(), voided_reason: reason })
      .eq("id", id)
      .is("voided_at", null)
      .select("id")
      .maybeSingle();
    if (error) return invalid("Could not void payment.");
    if (!data)
      return NextResponse.json(
        { error: "Payment not found or already voided." },
        { status: 409 },
      );
    return NextResponse.json({ ok: true });
  } catch {
    return invalid(
      "Could not void payment. Check your connection and try again.",
    );
  }
}
