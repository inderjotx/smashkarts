import { getServerSession } from "@/auth/auth-server";
export default async function HomePage() {
  const session = await getServerSession();

  return (
    <div>
      <h1>Hello World</h1>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  );
}
