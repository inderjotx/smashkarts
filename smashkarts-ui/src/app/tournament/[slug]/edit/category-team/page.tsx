import { ClientPage } from "./client-page";
import { getData } from "./action";
import { assertTournamentPermission } from "@/actions/tournament";

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

  if (!session) {
    return <div>Please sign in to manage categories and teams</div>;
  }

  // Check if user has permission to manage categories and teams
  try {
    await assertTournamentPermission(tournament.id, "dashboard");
  } catch (error) {
    return (
      <div>You don&apos;t have permission to manage categories and teams</div>
    );
  }

  return <ClientPage tournament={tournament} session={session} />;
}
