import { tournament } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { TournamentPage, TournamentNotFound } from "./_components/tournament";
import { getServerSession } from "@/auth/auth-server";

async function getTournamentData(slug: string) {
  const tournamentData = await db.query.tournament.findFirst({
    where: eq(tournament.slug, slug),
    with: {
      participants: {
        with: {
          user: true,
          category: true,
          tournamentRoles: true,
        },
      },
      teams: {
        with: {
          participants: {
            with: {
              user: true,
              category: true,
            },
          },
        },
      },
      roleAssignments: {
        with: {
          participant: {
            with: {
              user: true,
            },
          },
        },
      },
    },
  });
  return tournamentData;
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  try {
    const { slug } = await params;
    const [tournament, user] = await Promise.all([
      getTournamentData(slug),
      getServerSession(),
    ]);

    if (!tournament) {
      return <TournamentNotFound />;
    }

    return <TournamentPage tournament={tournament} user={user} />;
  } catch {
    return <TournamentNotFound />;
  }
}
