"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  category,
  participant,
  tournament as tournamentTable,
  user as userTable,
} from "@/server/db/schema";
import { type Session, type User } from "better-auth";
import { toast } from "sonner";
import { registerForTournament } from "@/app/tournament/action";
import { Hammer, PencilIcon } from "lucide-react";
import Link from "next/link";

interface TournamentProps {
  tournament: typeof tournamentTable.$inferSelect & {
    organizer: typeof userTable.$inferSelect;
    participants: (typeof participant.$inferSelect & {
      user: typeof userTable.$inferSelect;
      category: typeof category.$inferSelect | null;
    })[];
  };
  user: {
    session: Session;
    user: User;
  } | null;
}

export function TournamentPage({ tournament, user }: TournamentProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const isOrganizer = tournament?.organizer.id === user?.user.id;
  const hasUserAlreadyRegistered = tournament.participants.some(
    (participant) => participant.user.id === user?.user.id,
  );

  const handleRegister = async () => {
    if (!user) {
      toast.error("Please sign in to register for the tournament");
      return;
    }

    try {
      setIsRegistering(true);
      const result = await registerForTournament({
        tournamentId: tournament.id,
      });

      console.log("result", result);
      if (result?.data?.success) {
        toast.success("Successfully registered for the tournament!");
      }

      if (result?.serverError) {
        // console.log("result?.serverError", result?.serverError);
        toast.error(result?.serverError);
      }
    } catch (error) {
      console.log("error", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to register for tournament",
      );
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col">
      {/* Banner Section */}
      <div className="relative h-[400px] w-full p-6">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${tournament.bannerImage ?? "/default-banner.jpg"})`,
          }}
        >
          <div className="absolute inset-0 bg-black/50" /> {/* Overlay */}
        </div>
        <div className="container relative mx-auto flex h-full flex-col justify-end pb-8">
          {isOrganizer && (
            <div className="absolute right-4 top-4 flex gap-4">
              <Button
                variant="secondary"
                asChild
                className="gap-2 bg-white text-black"
              >
                <Link href={`/tournament/${tournament.slug}/edit/basic`}>
                  <PencilIcon className="h-4 w-4" />
                  Edit Tournament
                </Link>
              </Button>
              <Button
                variant="secondary"
                asChild
                className="gap-2 bg-white text-black"
              >
                <Link href={`/tournament/${tournament.slug}/auction`}>
                  <Hammer className="h-4 w-4" />
                  Start Auction
                </Link>
              </Button>
            </div>
          )}
          <h1 className="mb-4 text-4xl font-bold text-white">
            {tournament.name}
          </h1>
          <div className="flex items-center gap-4">
            {!isOrganizer && !hasUserAlreadyRegistered && (
              <Button
                size="lg"
                variant="default"
                onClick={handleRegister}
                disabled={isRegistering || !user}
              >
                {isRegistering ? "Registering..." : "Register for Tournament"}
              </Button>
            )}
            <div className="rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
              <p className="text-white">
                Organized by: {tournament.organizer.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8">
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="prizes">Prizes</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>About the Tournament</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{
                    __html: tournament.description ?? "",
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tournament Organizer</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="text-lg font-semibold">
                  {tournament.organizer.name}
                </h3>
                <p className="mt-2">Contact: {tournament.organizer.email}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prizes">
            <Card>
              <CardHeader>
                <CardTitle>Prize Pool</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{
                    __html: tournament.prizePool ?? "",
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="participants">
            <Card>
              <CardHeader>
                <CardTitle>Registered Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Games Played</TableHead>
                      <TableHead>K/D Ratio</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Registered At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tournament.participants.map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell className="font-medium">
                          {participant.user.name}
                        </TableCell>
                        <TableCell>
                          {participant.user.gamesPlayed ?? 0}
                        </TableCell>
                        <TableCell>{participant.user.kd ?? 0}</TableCell>
                        <TableCell>
                          {participant?.category?.name ?? "N/A"}
                        </TableCell>
                        <TableCell>
                          {participant.createdAt
                            ? new Date(
                                participant?.createdAt,
                              ).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export function TournamentNotFound() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardContent className="py-8 text-center">
          <h2 className="text-xl font-semibold text-red-600">
            Tournament not found
          </h2>
        </CardContent>
      </Card>
    </div>
  );
}
