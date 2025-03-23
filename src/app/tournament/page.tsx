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
import { desc, count } from "drizzle-orm";
import { tournament } from "@/server/db/schema";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const currentPage = Number(searchParams.page) || 1;
  const pageSize = 9; // 3x3 grid
  const offset = (currentPage - 1) * pageSize;

  const totalCount = await db.select({ count: count() }).from(tournament);
  const totalPages = Math.ceil(totalCount?.[0]?.count ?? 0 / pageSize);

  const tournaments = await db.query.tournament.findMany({
    limit: pageSize,
    offset,
    orderBy: [desc(tournament.createdAt)],
    with: {
      organizer: {
        columns: {
          name: true,
        },
      },
      participants: {
        columns: {
          id: true,
        },
      },
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
                  <span className="text-sm text-muted-foreground">
                    Organizer:
                  </span>
                  <span className="font-medium">
                    {tournament.organizer.name}
                  </span>
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

      <div className="mt-8">
        <Pagination>
          <PaginationContent>
            {currentPage > 1 && (
              <PaginationItem>
                <PaginationPrevious
                  href={`/tournament?page=${currentPage - 1}`}
                />
              </PaginationItem>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href={`/tournament?page=${page}`}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            {currentPage < totalPages && (
              <PaginationItem>
                <PaginationNext href={`/tournament?page=${currentPage + 1}`} />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
