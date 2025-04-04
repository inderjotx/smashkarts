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
  teamMember,
  participant,
} from "@/server/db/schema";
import type { Session, User } from "better-auth";
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
import { updateCategoryAction } from "./action";
import { PencilIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronDownIcon } from "lucide-react";
import { EyeIcon } from "lucide-react";

interface ClientPageProps {
  tournament: typeof tournament.$inferSelect & {
    teams: (typeof team.$inferSelect & {
      teamMembers: (typeof teamMember.$inferSelect & {
        participant: typeof participant.$inferSelect & {
          user: typeof user.$inferSelect;
        };
      })[];
    })[];
    categories: (typeof category.$inferSelect)[];
    organizer: typeof user.$inferSelect;
    participants: (typeof participant.$inferSelect & {
      user: typeof user.$inferSelect;
      category: typeof category.$inferSelect | null;
      categoryId: string | null;
      teamMember?: {
        team: typeof team.$inferSelect;
      } | null;
    })[];
  };

  session: {
    session: Session;
    user: User;
  };
}

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
}: {
  participants: (typeof participant.$inferSelect & {
    user: typeof user.$inferSelect;
    category: typeof category.$inferSelect | null;
    categoryId: string | null;
    teamMember?: {
      team: typeof team.$inferSelect;
    } | null;
  })[];
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>K/D</TableHead>
          <TableHead>Games Played</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Role</TableHead>
          {/* <TableHead>Team</TableHead> */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {participants.map((participant) => (
          <TableRow key={participant.id}>
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
            <TableCell>{participant.role ?? "Not Assigned"}</TableCell>
            {/* <TableCell>
              {participant.teamMember?.team.name ?? "Not Assigned"}
            </TableCell> */}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export function ClientPage({ tournament, session }: ClientPageProps) {
  const queryClient = useQueryClient();
  const [visibleCategoryId, setVisibleCategoryId] = useState<string | null>(
    null,
  );

  const toggleMembers = (categoryId: string) => {
    setVisibleCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  const { data: tournamentData } = useQuery<ClientPageProps>({
    queryKey: ["tournament", tournament?.slug],
    queryFn: async () => {
      const response = await fetch(
        `/api/tournament/${tournament?.slug}/edit/category-team`,
      );
      const res = (await response.json()) as Promise<ClientPageProps>;
      return res;
    },
    initialData: { tournament: tournament, session: session },
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
                <React.Fragment key={category.id}>
                  <TableRow>
                    <TableCell className="font-medium capitalize">
                      {category.name}
                    </TableCell>
                    <TableCell>{category.basePrice}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <EditCategoryDialog
                          currentCategory={category}
                          tournamentId={tournamentData.tournament.id}
                          onSuccess={() => {
                            void queryClient.invalidateQueries({
                              queryKey: ["tournament", tournament?.slug],
                            });
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleMembers(category.id)}
                        >
                          <EyeIcon
                            className={`h-4 w-4 ${
                              visibleCategoryId === category.id
                                ? "text-primary"
                                : ""
                            }`}
                          />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {visibleCategoryId === category.id && (
                    <TableRow className="pb-4 pl-2">
                      <TableCell colSpan={3} className="p-0">
                        <div className="border-t">
                          <CategoryMembersTable
                            participants={tournamentData.tournament.participants.filter(
                              (p) => p.categoryId === category.id,
                            )}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournamentData?.tournament?.teams?.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>{team.name}</TableCell>
                  <TableCell>
                    {
                      team.teamMembers.find(
                        (member) => member?.role === "captain",
                      )?.participant?.user?.name
                    }
                  </TableCell>
                  <TableCell>{team.teamMembers.length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
