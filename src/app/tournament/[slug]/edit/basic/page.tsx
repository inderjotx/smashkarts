import { getServerSession } from "@/auth/auth-server";
import { db } from "@/server/db";
import { tournament } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import React from "react";
import { BasicForm } from "./form";

export async function getTournament(slug: string) {
  const [currentTournament, session] = await Promise.all([
    db.query.tournament.findFirst({
      where: eq(tournament.slug, slug),
      with: {
        organizer: true,
      },
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

  if (tournament.organizer.id !== session?.user.id) {
    return <div>You are not the organizer of this tournament</div>;
  }

  return <BasicForm tournament={tournament} session={session} />;
}
