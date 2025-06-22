import { ClientPage } from "./client-page";
import { getData } from "./action";

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

  return <ClientPage data={{ data: tournament, session }} />;
}
