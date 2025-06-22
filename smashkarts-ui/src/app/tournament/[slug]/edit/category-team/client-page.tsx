"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateCategoryForm, CreateTeamForm } from "./form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  tournament,
  team,
  category,
  user,
  participant,
} from "@/server/db/schema";
import type { Session } from "better-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  getData,
  updateCategoryAction,
  swapCategoryRankAction,
  updateTeamAction,
  getPotentialCaptainsAction,
  getCategoryParticipantsAction,
} from "./action";
import { PencilIcon } from "lucide-react";
import { EyeIcon } from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
}

type TournamentWithRelations = typeof tournament.$inferSelect & {
  teams: (typeof team.$inferSelect & {
    participants: (typeof participant.$inferSelect & {
      user: typeof user.$inferSelect;
    })[];
  })[];
  categories: (typeof category.$inferSelect)[];
  organizer: typeof user.$inferSelect;
  participants: (typeof participant.$inferSelect & {
    user: typeof user.$inferSelect;
    category: typeof category.$inferSelect | null;
    categoryId: string | null;
    teamId: string | null;
  })[];
};

interface ClientPageProps {
  tournament: TournamentWithRelations;
  session: {
    session: Session;
    user: SessionUser;
  };
}

type GetDataResponse = {
  data: TournamentWithRelations | undefined;
  session: {
    session: Session;
    user: SessionUser;
  } | null;
};

type CategoryWithId = {
  id: string;
  name: string;
  basePrice: number | null;
};

const EditCategoryDialog = ({
  currentCategory,
  tournamentId,
  onSuccess,
}: {
  currentCategory: typeof category.$inferSelect;
  tournamentId: string;
  onSuccess: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentCategory.name);
  const [basePrice, setBasePrice] = useState(
    currentCategory.basePrice?.toString() ?? "",
  );

  const updateCategory = useMutation({
    mutationFn: async () => {
      return updateCategoryAction({
        categoryId: currentCategory.id,
        tournamentId,
        name,
        basePrice: parseInt(basePrice),
      });
    },
    onSuccess: () => {
      onSuccess();
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <PencilIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="name">Name</label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="basePrice">Base Price</label>
            <Input
              id="basePrice"
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
            />
          </div>
          <Button
            onClick={() => updateCategory.mutate()}
            disabled={updateCategory.isPending}
          >
            {updateCategory.isPending ? "Updating..." : "Update Category"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CategoryMembersTable = ({
  participants,
  categoryId,
  tournamentId,
}: {
  participants: (typeof participant.$inferSelect & {
    user: typeof user.$inferSelect;
    category: typeof category.$inferSelect | null;
    categoryId: string | null;
  })[];
  categoryId: string;
  tournamentId: string;
}) => {
  const queryClient = useQueryClient();

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const sourceParticipant = participants[sourceIndex];
    const destinationParticipant = participants[destinationIndex];

    if (!sourceParticipant || !destinationParticipant) {
      console.error("Could not find participants at the specified indices");
      return;
    }

    try {
      await swapCategoryRankAction({
        tournamentId,
        categoryId,
        participantId1: sourceParticipant.id,
        participantId2: destinationParticipant.id,
      });

      // Refetch the data to update the UI
      await queryClient.invalidateQueries({
        queryKey: ["tournament", tournamentId],
      });
    } catch (error) {
      console.error("Failed to swap ranks:", error);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId={`category-${categoryId}`}>
        {(provided) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>K/D</TableHead>
                <TableHead>Games Played</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody {...provided.droppableProps} ref={provided.innerRef}>
              {participants
                .sort((a, b) => (a.categoryRank ?? 0) - (b.categoryRank ?? 0))
                .map((participant, index) => (
                  <Draggable
                    key={participant.id}
                    draggableId={participant.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <TableRow
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={snapshot.isDragging ? "bg-muted" : ""}
                      >
                        <TableCell>
                          {participant.categoryRank ?? "N/A"}
                        </TableCell>
                        <TableCell>{participant.user.name}</TableCell>
                        <TableCell>{participant.user.kd}</TableCell>
                        <TableCell>{participant.user.gamesPlayed}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                              participant.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : participant.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {participant.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {participant.role ?? "Not Assigned"}
                        </TableCell>
                      </TableRow>
                    )}
                  </Draggable>
                ))}
              {provided.placeholder}
            </TableBody>
          </Table>
        )}
      </Droppable>
    </DragDropContext>
  );
};

const EditTeamDialog = ({
  currentTeam,
  tournamentId,
  onSuccess,
}: {
  currentTeam: typeof team.$inferSelect & {
    participants: (typeof participant.$inferSelect & {
      user: typeof user.$inferSelect;
    })[];
  };
  tournamentId: string;
  onSuccess: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentTeam.name);
  const [purse, setPurse] = useState(currentTeam.purse?.toString() ?? "");
  const [captainId, setCaptainId] = useState(
    currentTeam.participants.find((p) => p.teamRole === "captain")?.user.id ??
      "",
  );

  const { data: potentialCaptainsData } = useQuery({
    queryKey: ["potential-captains", tournamentId],
    queryFn: async () => {
      const res = await getPotentialCaptainsAction(tournamentId);
      return res.potentialCaptains;
    },
    enabled: open,
  });

  const updateTeam = useMutation({
    mutationFn: async () => {
      return updateTeamAction({
        teamId: currentTeam.id,
        tournamentId,
        name,
        purse: parseInt(purse),
        captainId,
      });
    },
    onSuccess: () => {
      onSuccess();
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <PencilIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="teamName">Team Name</label>
            <Input
              id="teamName"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="purse">Purse</label>
            <Input
              id="purse"
              type="number"
              value={purse}
              onChange={(e) => setPurse(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="captain">Captain</label>
            <Select value={captainId} onValueChange={setCaptainId}>
              <SelectTrigger>
                <SelectValue placeholder="Select captain" />
              </SelectTrigger>
              <SelectContent>
                {/* Current team members */}
                {currentTeam.participants.map((participant) => (
                  <SelectItem
                    key={participant.user.id}
                    value={participant.user.id}
                  >
                    {participant.user.name} (Current Team)
                  </SelectItem>
                ))}
                {/* Potential captains from other teams */}
                {potentialCaptainsData?.map((captain) => (
                  <SelectItem key={captain.id} value={captain.id}>
                    {captain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => updateTeam.mutate()}
            disabled={updateTeam.isPending}
          >
            {updateTeam.isPending ? "Updating..." : "Update Team"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CategoryParticipantsTable = ({
  category,
  tournamentId,
}: {
  category: CategoryWithId;
  tournamentId: string;
}) => {
  const queryClient = useQueryClient();
  const { data: participantsData } = useQuery({
    queryKey: ["category-participants", tournamentId, category.id],
    queryFn: async () => {
      const res = await getCategoryParticipantsAction(
        tournamentId,
        category.id,
      );
      return res.participants;
    },
  });

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !participantsData) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const sourceParticipant = participantsData[sourceIndex];
    const destinationParticipant = participantsData[destinationIndex];

    if (!sourceParticipant || !destinationParticipant) {
      console.error("Could not find participants at the specified indices");
      return;
    }

    try {
      await swapCategoryRankAction({
        tournamentId,
        categoryId: category.id,
        participantId1: sourceParticipant.id,
        participantId2: destinationParticipant.id,
      });

      // Refetch the data to update the UI
      await queryClient.invalidateQueries({
        queryKey: ["category-participants", tournamentId, category.id],
      });
    } catch (error) {
      console.error("Failed to swap ranks:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{category.name} Participants</CardTitle>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId={`category-${category.id}`}>
            {(provided) => (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>K/D</TableHead>
                    <TableHead>Games Played</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                  {participantsData?.map((participant, index) => (
                    <Draggable
                      key={participant.id}
                      draggableId={participant.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <TableRow
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={snapshot.isDragging ? "bg-muted" : ""}
                        >
                          <TableCell>
                            {participant.categoryRank ?? "N/A"}
                          </TableCell>
                          <TableCell>{participant.user.name}</TableCell>
                          <TableCell>{participant.user.kd}</TableCell>
                          <TableCell>{participant.user.gamesPlayed}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                                participant.status === "confirmed"
                                  ? "bg-green-100 text-green-800"
                                  : participant.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {participant.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            {participant.role ?? "Not Assigned"}
                          </TableCell>
                        </TableRow>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </TableBody>
              </Table>
            )}
          </Droppable>
        </DragDropContext>
      </CardContent>
    </Card>
  );
};

export function ClientPage({ tournament, session }: ClientPageProps) {
  const queryClient = useQueryClient();

  const { data: tournamentData } = useQuery<ClientPageProps>({
    queryKey: ["tournament", tournament.slug],
    queryFn: async () => {
      const res = await getData(tournament.slug);
      if (!res.data || !res.session)
        throw new Error("Tournament or session not found");

      return {
        tournament: res.data,
        session: res.session,
      };
    },
    initialData: { tournament, session },
  });

  return (
    <div className="container mx-auto max-w-7xl space-y-6 py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Categories</CardTitle>
          <CreateCategoryForm
            tournamentId={tournamentData?.tournament?.id}
            onSuccess={() => {
              void queryClient.invalidateQueries({
                queryKey: ["tournament", tournament?.slug],
              });
            }}
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournamentData?.tournament?.categories?.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium capitalize">
                    {category.name}
                  </TableCell>
                  <TableCell>{category.basePrice}</TableCell>
                  <TableCell className="text-right">
                    <EditCategoryDialog
                      currentCategory={category}
                      tournamentId={tournamentData.tournament.id}
                      onSuccess={() => {
                        void queryClient.invalidateQueries({
                          queryKey: ["tournament", tournament?.slug],
                        });
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Teams</CardTitle>
          <CreateTeamForm
            tournamentId={tournamentData?.tournament?.id}
            participants={tournamentData?.tournament?.participants}
            onSuccess={() => {
              void queryClient.invalidateQueries({
                queryKey: ["tournament", tournament?.slug],
              });
            }}
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Captain</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Purse</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournamentData?.tournament?.teams?.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>{team.name}</TableCell>
                  <TableCell>
                    {
                      team.participants.find(
                        (member) => member?.teamRole === "captain",
                      )?.user?.name
                    }
                  </TableCell>
                  <TableCell>{team.participants.length}</TableCell>
                  <TableCell>{team.purse}</TableCell>
                  <TableCell className="text-right">
                    <EditTeamDialog
                      currentTeam={team}
                      tournamentId={tournamentData.tournament.id}
                      onSuccess={() => {
                        void queryClient.invalidateQueries({
                          queryKey: ["tournament", tournament?.slug],
                        });
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {tournamentData?.tournament?.categories?.map((category) => (
          <CategoryParticipantsTable
            key={category.id}
            category={category}
            tournamentId={tournamentData.tournament.id}
          />
        ))}
      </div>
    </div>
  );
}
