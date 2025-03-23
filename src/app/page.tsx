import { db } from "@/server/db";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const tournaments = await db.query.tournament.findMany({
    with: {
      organizer: {
        with: {
          user: true,
        },
      },
      participants: true,
      teams: true,
    },
  });

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold">Tournaments</h1>
        <Button asChild>
          <Link href="/tournament/create">Create Tournament</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tournaments.map((tournament) => (
          <Card
            key={tournament.id}
            className="transition-shadow hover:shadow-lg"
          >
            <CardHeader>
              {tournament.bannerImage && (
                <div className="relative mb-4 h-48 w-full">
                  <img
                    src={tournament.bannerImage}
                    alt={tournament.name}
                    className="h-full w-full rounded-t-lg object-cover"
                  />
                </div>
              )}
              <CardTitle>{tournament.name}</CardTitle>
              <CardDescription>{tournament.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Teams:</span>
                  <span className="font-medium">{tournament.teams.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Participants:
                  </span>
                  <span className="font-medium">
                    {tournament.participants.length}
                  </span>
                </div>
                {tournament.prizePool && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Prize Pool:
                    </span>
                    <span className="font-medium">{tournament.prizePool}</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/tournament/${tournament.slug}`}>
                  View Details
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
