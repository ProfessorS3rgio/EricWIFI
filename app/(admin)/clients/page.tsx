import Link from "next/link";
import { getClients } from "../../../lib/data";
import ClientDirectory from "./ClientDirectory";
import Icon from "../../../components/Icon";
export default async function ClientsPage() {
  const clients = await getClients();
  return (
    <main className="content-shell">
      <header className="page-heading">
        <div>
          <p className="eyebrow">THE PEOPLE BEHIND THE CONNECTION</p>
          <h1>
            Your clients<span className="accent">.</span>
          </h1>
          <p className="page-description">
            A familiar face, a clear account, a better connection.
          </p>
        </div>
        <Link className="button" href="/clients/new">
          <Icon name="plus" size={17} /> Add client
        </Link>
      </header>
      <ClientDirectory
        clients={clients.map(
          ({ id, name, phone, plan, monthly_fee, status, due_date }) => ({
            id,
            name,
            phone,
            plan,
            monthly_fee,
            status,
            due_date,
          }),
        )}
      />
    </main>
  );
}
