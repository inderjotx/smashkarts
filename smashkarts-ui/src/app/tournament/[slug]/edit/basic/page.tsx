import { getServerSession } from "@/auth/auth-server";
import { db } from "@/server/db";
import { tournament } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import React from "react";
import { BasicForm } from "./form";
import { assertTournamentPermission } from "@/actions/tournament";

export async function getTournament(slug: string) {
  const [currentTournament, session] = await Promise.all([
    db.query.tournament.findFirst({
      where: eq(tournament.slug, slug),
    }),
    getServerSession(),
  ]);

  return { tournament: currentTournament, session };
}

export default async function page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { tournament, session } = await getTournament(slug);

  if (!tournament) {
    return <div>Tournament not found</div>;
  }

  if (!session) {
    return <div>Please sign in to edit this tournament</div>;
  }

  // Check if user has permission to edit tournament
  try {
    await assertTournamentPermission(tournament.id, "dashboard");
  } catch (error) {
    return <div>You don&apos;t have permission to edit this tournament</div>;
  }

  return <BasicForm tournament={tournament} session={session} />;
}
