"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { getTeamParticipantsAction } from "./action";

interface TeamParticipantsSheetProps {
  tournamentId: string;
  teams: {
    id: string;
    name: string;
  }[];
}

export function TeamParticipantsSheet({
  tournamentId,
  teams,
}: TeamParticipantsSheetProps) {
  const [selectedTeam, setSelectedTeam] = useState<string>(teams[0]?.id ?? "");

  const { data: teamData } = useQuery({
    queryKey: ["team-participants", tournamentId, selectedTeam],
    queryFn: async () => {
      if (!selectedTeam) return null;
      return getTeamParticipantsAction(tournamentId, selectedTeam);
    },
    enabled: !!selectedTeam,
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>View Teams</Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Team Details</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a team" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>K/D</TableHead>
                <TableHead>Games Played</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamData?.team.participants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell>{participant.user.name}</TableCell>
                  <TableCell className="capitalize">
                    {participant.teamRole}
                  </TableCell>
                  <TableCell>{participant.user.kd}</TableCell>
                  <TableCell>{participant.user.gamesPlayed}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SheetContent>
    </Sheet>
  );
}
