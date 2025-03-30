import React from "react";
import { getServerSession } from "@/auth/auth-server";
import Link from "next/link";

export default async function page() {
  const session = await getServerSession();
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <pre>{JSON.stringify(session, null, 2)}</pre>
      <Link href="/tournament">View Tournament</Link>
      <Link href="/tournament/create">Create Tournament</Link>
      <Link href="/sign-in">Sign In</Link>
    </div>
  );
}
