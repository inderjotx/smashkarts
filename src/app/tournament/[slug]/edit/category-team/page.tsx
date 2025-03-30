import { getServerSession } from "@/auth/auth-server";
import { db } from "@/server/db";
import { tournament } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { ClientPage } from "./client-page";

export const getData = async (slug: string) => {
  const [data, session] = await Promise.all([
    db.query.tournament.findFirst({
      where: eq(tournament.slug, slug),
      with: {
        teams: {
          with: {
            teamMembers: {
              with: {
                participant: {
                  with: {
                    user: true,
                  },
                },
              },
            },
          },
        },
        categories: true,
        organizer: true,
        participants: {
          with: {
            user: true,
          },
        },
      },
    }),
    getServerSession(),
  ]);

  return { data, session };
};

export default async function CategoryTeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: tournament, session } = await getData(slug);

  if (!tournament) {
    return <div>Tournament not found</div>;
  }

  if (session?.user.id !== tournament.organizer.id) {
    return <div>You are not authorized to edit this tournament</div>;
  }

  console.log(
    "team member",
    tournament?.teams[0]?.teamMembers.find((member) => member.role == "captain")
      ?.participant?.user?.name,
  );
  console.log(
    "tournament",
    tournament?.teams[0]?.teamMembers[0]?.participant?.user?.name,
  );

  return <ClientPage tournament={tournament} session={session} />;
}
