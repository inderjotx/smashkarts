"use client";

import React from "react";
import { formatIndianNumber } from "@/lib/utils";
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
  DialogDescription,
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
import { PencilIcon, Trash2Icon, AlertTriangleIcon } from "lucide-react";
import { GripVertical } from "lucide-react";
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
import { AmountInput } from "@/components/ui/amount-input";
import { deleteCategoryAction, deleteTeamAction } from "./action";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  increment: number | null;
};

type TeamWithParticipants = typeof team.$inferSelect & {
  participants: (typeof participant.$inferSelect & {
    user: typeof user.$inferSelect;
  })[];
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
  const [increment, setIncrement] = useState(
    currentCategory.increment?.toString() ?? "",
  );

  const updateCategory = useMutation({
    mutationFn: async () => {
      return updateCategoryAction({
        categoryId: currentCategory.id,
        tournamentId,
        name,
        basePrice: parseInt(basePrice),
        increment: parseInt(increment),
      });
    },
    onSuccess: () => {
      onSuccess();
      setOpen(false);
      toast.success("Category updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update category");
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
            <AmountInput
              value={parseInt(basePrice)}
              onChange={(e) => setBasePrice(e.toString())}
              placeholder="Enter base price"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="increment">Bidding Increment</label>
            <AmountInput
              value={parseInt(increment)}
              onChange={(e) => setIncrement(e.toString())}
              placeholder="Enter bidding increment"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => updateCategory.mutate()}
              disabled={updateCategory.isPending}
              className="flex-1"
            >
              {updateCategory.isPending ? "Updating..." : "Update Category"}
            </Button>
          </div>
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
                <TableHead className="w-10"></TableHead>
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
                        className={snapshot.isDragging ? "bg-muted" : ""}
                      >
                        <TableCell {...provided.dragHandleProps}>
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
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
      toast.success("Team updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update team");
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
            <AmountInput
              value={parseInt(purse)}
              onChange={(e) => setPurse(e.toString())}
              placeholder="Enter purse"
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
          <div className="flex gap-2">
            <Button
              onClick={() => updateTeam.mutate()}
              disabled={updateTeam.isPending}
              className="flex-1"
            >
              {updateTeam.isPending ? "Updating..." : "Update Team"}
            </Button>
          </div>
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
    <Card className="">
      <CardHeader>
        <CardTitle className="text-lg">Category: {category.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId={`category-${category.id}`}>
            {(provided) => (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
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
                          className={snapshot.isDragging ? "bg-muted" : ""}
                        >
                          <TableCell {...provided.dragHandleProps}>
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
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

const TeamParticipantsTable = ({
  team,
  tournamentId,
}: {
  team: TeamWithParticipants;
  tournamentId: string;
}) => {
  return (
    <Card className="">
      <CardHeader>
        <CardTitle className="text-lg">Team: {team.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>K/D</TableHead>
              <TableHead>Games Played</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Team Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {team.participants.map((participant, index) => (
              <TableRow key={participant.id}>
                <TableCell>{participant.user.name}</TableCell>
                <TableCell>{participant.user.kd}</TableCell>
                <TableCell>{participant.user.gamesPlayed}</TableCell>
                <TableCell>{participant.role ?? "Not Assigned"}</TableCell>
                <TableCell>
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                      participant.teamRole === "captain"
                        ? "bg-blue-100 text-blue-800"
                        : participant.teamRole === "member"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {participant.teamRole ?? "Member"}
                  </span>
                </TableCell>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// Delete Confirmation Dialog Component
const DeleteConfirmationDialog = ({
  type,
  name,
  onConfirm,
  onCancel,
  isOpen,
  onOpenChange,
  isLoading,
}: {
  type: "category" | "team";
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangleIcon className="h-5 w-5 text-red-500" />
            Delete {type.charAt(0).toUpperCase() + type.slice(1)}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the {type} &quot;{name}&quot;? This
            action cannot be undone.
            {type === "team" &&
              " All team members will be removed from this team."}
            {type === "category" &&
              " All participants in this category will be unassigned."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export function ClientPage({ tournament, session }: ClientPageProps) {
  const queryClient = useQueryClient();

  const { data: tournamentData } = useQuery({
    queryKey: ["tournament", tournament.slug],
    queryFn: async (): Promise<ClientPageProps> => {
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
    <div className="container mx-auto max-w-7xl space-y-6">
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Categories</CardTitle>
          <CreateCategoryForm
            tournamentId={tournamentData?.tournament?.id}
            onSuccess={() => {
              void queryClient.invalidateQueries({
                queryKey: ["tournament", tournament.slug],
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
                <TableHead>Increment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournamentData?.tournament?.categories
                ?.sort((a, b) => {
                  const dateA = a.createdAt ? a.createdAt.getTime() : 0;
                  const dateB = b.createdAt ? b.createdAt.getTime() : 0;
                  return dateA - dateB;
                })
                ?.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium capitalize">
                      {category.name}
                    </TableCell>
                    <TableCell>
                      {category.basePrice
                        ? formatIndianNumber(category.basePrice)
                        : "Not Set"}
                    </TableCell>
                    <TableCell>
                      {category.increment
                        ? formatIndianNumber(category.increment)
                        : "Not Set"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <EditCategoryDialog
                          currentCategory={category}
                          tournamentId={tournamentData.tournament.id}
                          onSuccess={() => {
                            void queryClient.invalidateQueries({
                              queryKey: ["tournament", tournament.slug],
                            });
                          }}
                        />
                        <DeleteCategoryButton
                          category={category}
                          tournamentId={tournamentData.tournament.id}
                          onSuccess={() => {
                            void queryClient.invalidateQueries({
                              queryKey: ["tournament", tournament.slug],
                            });
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-primary">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Teams</CardTitle>
          <CreateTeamForm
            tournamentId={tournamentData?.tournament?.id}
            participants={tournamentData?.tournament?.participants}
            onSuccess={() => {
              void queryClient.invalidateQueries({
                queryKey: ["tournament", tournament.slug],
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
              {tournamentData?.tournament?.teams
                ?.sort((a, b) => {
                  const dateA = a.createdAt ? a.createdAt.getTime() : 0;
                  const dateB = b.createdAt ? b.createdAt.getTime() : 0;
                  return dateA - dateB;
                })
                ?.map((team) => (
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
                    <TableCell>
                      {team.purse ? formatIndianNumber(team.purse) : "Not Set"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <EditTeamDialog
                          currentTeam={team}
                          tournamentId={tournamentData.tournament.id}
                          onSuccess={() => {
                            void queryClient.invalidateQueries({
                              queryKey: ["tournament", tournament.slug],
                            });
                          }}
                        />
                        <DeleteTeamButton
                          team={team}
                          tournamentId={tournamentData.tournament.id}
                          onSuccess={() => {
                            void queryClient.invalidateQueries({
                              queryKey: ["tournament", tournament.slug],
                            });
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle>Participants Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="category-participants" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="category-participants">
                Category Participants
              </TabsTrigger>
              <TabsTrigger value="team-participants">
                Team Participants
              </TabsTrigger>
            </TabsList>

            <TabsContent value="category-participants" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {tournamentData?.tournament?.categories?.map((category) => (
                  <CategoryParticipantsTable
                    key={category.id}
                    category={category}
                    tournamentId={tournamentData.tournament.id}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="team-participants" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {tournamentData?.tournament?.teams?.map((team) => (
                  <TeamParticipantsTable
                    key={team.id}
                    team={team}
                    tournamentId={tournamentData.tournament.id}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Delete Category Button Component
const DeleteCategoryButton = ({
  category,
  tournamentId,
  onSuccess,
}: {
  category: {
    id: string;
    name: string;
    basePrice: number | null;
    increment: number | null;
  };
  tournamentId: string;
  onSuccess: () => void;
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deleteCategory = useMutation({
    mutationFn: async () => {
      return deleteCategoryAction({
        categoryId: category.id,
        tournamentId,
      });
    },
    onSuccess: () => {
      onSuccess();
      setDeleteDialogOpen(false);
      toast.success("Category deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete category");
    },
  });

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setDeleteDialogOpen(true)}
      >
        <Trash2Icon className="h-4 w-4" />
      </Button>

      <DeleteConfirmationDialog
        type="category"
        name={category.name}
        onConfirm={() => deleteCategory.mutate()}
        onCancel={() => setDeleteDialogOpen(false)}
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        isLoading={deleteCategory.isPending}
      />
    </>
  );
};

// Delete Team Button Component
const DeleteTeamButton = ({
  team,
  tournamentId,
  onSuccess,
}: {
  team: {
    id: string;
    name: string;
    purse: number | null;
    participants: {
      user: {
        id: string;
        name: string;
      };
      teamRole: string | null;
    }[];
  };
  tournamentId: string;
  onSuccess: () => void;
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deleteTeam = useMutation({
    mutationFn: async () => {
      return deleteTeamAction({
        teamId: team.id,
        tournamentId,
      });
    },
    onSuccess: () => {
      onSuccess();
      setDeleteDialogOpen(false);
      toast.success("Team deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete team");
    },
  });

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setDeleteDialogOpen(true)}
      >
        <Trash2Icon className="h-4 w-4" />
      </Button>

      <DeleteConfirmationDialog
        type="team"
        name={team.name}
        onConfirm={() => deleteTeam.mutate()}
        onCancel={() => setDeleteDialogOpen(false)}
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        isLoading={deleteTeam.isPending}
      />
    </>
  );
};
