import { ClientPage } from "./client-page";
import { getData } from "./action";
import { assertTournamentPermission } from "@/actions/tournament";

export default async function CategoryTeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const {
    data: tournament,
    session,
    currentUserParticipant,
  } = await getData(slug);

  if (!tournament) {
    return <div>Tournament not found</div>;
  }

  if (!session) {
    return <div>Please sign in to manage participants</div>;
  }

  // Check if user has permission to manage participants
  try {
    await assertTournamentPermission(tournament.id, "dashboard");
  } catch (error) {
    return <div>You don&apos;t have permission to manage participants</div>;
  }

  return (
    <ClientPage data={{ data: tournament, session, currentUserParticipant }} />
  );
}
