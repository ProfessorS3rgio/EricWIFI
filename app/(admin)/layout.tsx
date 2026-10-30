import { redirect } from "next/navigation";
import { authorized } from "../../lib/auth";
import AdminShell from "../../components/AdminShell";
export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await authorized())) redirect("/login");
  return <AdminShell>{children}</AdminShell>;
}
