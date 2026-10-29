import { NextResponse } from "next/server";
import { supabase } from "../../../../../lib/supabase";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  let reason = "Voided by admin";
  try {
    const body = await request.json() as { reason?: string };
    if (body.reason?.trim()) reason = body.reason.trim().slice(0, 200);
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("payments")
    .update({ voided_at: new Date().toISOString(), voided_reason: reason })
    .eq("id", params.id)
    .is("voided_at", null)
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Payment was not found or was already voided." }, { status: 409 });
  return NextResponse.json({ ok: true });
}
