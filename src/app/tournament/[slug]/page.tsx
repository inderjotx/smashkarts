export default function TournamentPage({
  params,
}: {
  params: { slug: string };
}) {
  return <div>Tournament {params.slug}</div>;
}
