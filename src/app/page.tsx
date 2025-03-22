import { getServerSession } from "@/auth/auth-server";
import Link from "next/link";
export default async function HomePage() {
  const session = await getServerSession();

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1>Hello World</h1>
      <pre>{JSON.stringify(session, null, 2)}</pre>
      <Link href="/tournament/create">Create Tournament</Link>
    </div>
  );
}
