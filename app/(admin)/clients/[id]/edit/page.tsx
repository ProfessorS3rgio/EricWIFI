import Link from "next/link";
import { notFound } from "next/navigation";
import { database } from "../../../../../lib/supabase";
import { requireAdmin } from "../../../../../lib/auth";
import type { Client } from "../../../../../lib/data";
import EditClientForm from "./EditClientForm";
export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)) notFound();
  const { data, error } = await database()
    .from("clients")
    .select("id,name,phone,address,plan,monthly_fee,status,due_date,notes")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Could not load client.");
  if (!data) notFound();
  return (
    <main className="content-shell">
      <header className="page-heading">
        <div>
          <p className="eyebrow">CUSTOMER MANAGEMENT</p>
          <h1>Edit {data.name}</h1>
          <p className="page-description">
            Update contact or subscription details. Saved monthly bills keep
            their original fee and plan.
          </p>
        </div>
        <Link className="button secondary" href={`/clients/${id}`}>
          ← Back to profile
        </Link>
      </header>
      <EditClientForm client={data as Client} />
    </main>
  );
}
