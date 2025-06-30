"use client";

import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  Column,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Session } from "better-auth";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronsUpDown,
  Settings,
} from "lucide-react";
import {
  getData,
  updateParticipantCategoryAction,
  updateParticipantStatusAction,
} from "./action";
import { RoleManagementModal } from "./role-management-modal";
import { canManageDashboard, type TournamentRole } from "@/lib/utils";

import type {
  tournament,
  category,
  participant,
  user,
  team,
  tournamentRoleAssignment,
} from "@/server/db/schema";
import { participationStatus } from "@/server/db/schema";
import { formatIndianNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  image?: string | null;
  sId?: string | null;
  kd?: number | null;
  gamesPlayed?: number | null;
  description?: string | null;
}

type ParticipantWithRelations = typeof participant.$inferSelect & {
  user: typeof user.$inferSelect;
  category: typeof category.$inferSelect | null;
  team: Pick<typeof team.$inferSelect, "id" | "name"> | null;
  tournamentRoles: (typeof tournamentRoleAssignment.$inferSelect)[];
};

type TournamentWithRelations = typeof tournament.$inferSelect & {
  participants: ParticipantWithRelations[];
  categories: (typeof category.$inferSelect)[];
};

type SessionData = {
  session: Session;
  user: SessionUser;
};

type TournamentData = {
  data: TournamentWithRelations;
  session: {
    session: Session;
    user: SessionUser;
  };
  currentUserParticipant: ParticipantWithRelations | null;
};

const useUpdateParticipant = (tournamentId: string) => {
  const queryClient = useQueryClient();

  const updateCategory = useMutation({
    mutationFn: async ({
      participantId,
      categoryId,
    }: {
      participantId: string;
      categoryId: string;
    }) => {
      console.log("update participant category", participantId, categoryId);
      const res = await updateParticipantCategoryAction({
        participantId,
        categoryId,
        tournamentId,
      });
      console.log("update participant category result", res);
      return res;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["tournament", tournamentId],
      });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      participantId,
      status,
    }: {
      participantId: string;
      status: (typeof participationStatus.enumValues)[number];
    }) => {
      const res = await updateParticipantStatusAction({
        participantId,
        status,
        tournamentId,
      });
      console.log("update participant status result", res);
      return res;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["tournament", tournamentId],
      });
    },
  });

  return { updateCategory, updateStatus };
};

const SortableHeader = ({
  column,
  title,
}: {
  column: Column<ParticipantWithRelations>;
  title: string;
}) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting()}
      className="flex items-center justify-center gap-1"
    >
      {title}
      {column.getIsSorted() === "asc" ? (
        <ArrowUpIcon className="h-4 w-4" />
      ) : column.getIsSorted() === "desc" ? (
        <ArrowDownIcon className="h-4 w-4" />
      ) : (
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      )}
    </Button>
  );
};

// Create separate components for the select cells
const CategoryCell = ({
  participant,
  categories,
  tournamentId,
}: {
  participant: ParticipantWithRelations;
  categories: (typeof category.$inferSelect)[];
  tournamentId: string;
}) => {
  const { updateCategory } = useUpdateParticipant(tournamentId);

  return (
    <Select
      value={participant.categoryId ?? "no-category"}
      onValueChange={(categoryId) => {
        updateCategory.mutate({
          participantId: participant.id,
          categoryId: categoryId === "no-category" ? null : categoryId,
        });
      }}
      disabled={updateCategory.isPending}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="no-category">No Category</SelectItem>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const StatusCell = ({
  participant,
  tournamentId,
}: {
  participant: ParticipantWithRelations;
  tournamentId: string;
}) => {
  const { updateStatus } = useUpdateParticipant(tournamentId);

  return (
    <Select
      value={participant.status ?? "pending"}
      onValueChange={(status) => {
        updateStatus.mutate({
          participantId: participant.id,
          status: status as (typeof participationStatus.enumValues)[number],
        });
      }}
      disabled={updateStatus.isPending}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent>
        {participationStatus.enumValues.map((status) => (
          <SelectItem key={status} value={status}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const TournamentRoleCell = ({
  participant,
  tournamentId,
  isOrganizer,
  onOpenRoleModal,
}: {
  participant: ParticipantWithRelations;
  tournamentId: string;
  isOrganizer: boolean;
  onOpenRoleModal: (participant: ParticipantWithRelations) => void;
}) => {
  // Role information with colors
  const ROLE_COLORS = {
    organizer: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    admin:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    maintainer: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    auctioneer:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  } as const;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-wrap gap-1">
        {participant.tournamentRoles.map((roleAssignment) => {
          const roleColor = ROLE_COLORS[roleAssignment.role];
          return (
            <span
              key={roleAssignment.id}
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleColor}`}
            >
              {roleAssignment.role}
            </span>
          );
        })}
        {participant.tournamentRoles.length === 0 && (
          <span className="text-xs text-muted-foreground">No roles</span>
        )}
      </div>
      {isOrganizer && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpenRoleModal(participant)}
          className="ml-2 h-6 w-6 p-0"
        >
          <Settings className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

// Update the columns definition to use these components
const columns: ColumnDef<ParticipantWithRelations>[] = [
  {
    accessorKey: "user.name",
    id: "user.name",
    header: "Name",
  },
  {
    accessorKey: "user.gamesPlayed",
    id: "user.gamesPlayed",
    header: ({ column }) => (
      <SortableHeader column={column} title="Games Played" />
    ),
    sortingFn: "basic",
  },
  {
    accessorKey: "user.kd",
    id: "user.kd",
    header: ({ column }) => <SortableHeader column={column} title="K/D" />,
    sortingFn: "basic",
  },
  {
    accessorKey: "category.name",
    id: "category.name",
    header: "Category",
    cell: ({ row, table }) => {
      const categories =
        (table.options.meta as { categories: (typeof category.$inferSelect)[] })
          ?.categories ?? [];

      const tournamentId =
        (table.options.meta as { tournamentId: string }).tournamentId ?? "";
      return (
        <CategoryCell
          participant={row.original}
          categories={categories}
          tournamentId={tournamentId}
        />
      );
    },
  },
  {
    accessorKey: "role",
    id: "role",
    header: "Role",
    cell: ({ row }) => row?.original?.role ?? "Not Assigned",
  },
  {
    accessorKey: "status",
    id: "status",
    header: "Status",
    cell: ({ row, table }) => {
      const tournamentId =
        (table.options.meta as { tournamentId: string }).tournamentId ?? "";
      return (
        <StatusCell participant={row.original} tournamentId={tournamentId} />
      );
    },
  },
  {
    accessorKey: "sellingPrice",
    id: "sellingPrice",
    header: ({ column }) => (
      <SortableHeader column={column} title="Selling Price" />
    ),
    cell: ({ row }) =>
      row?.original?.sellingPrice
        ? formatIndianNumber(row?.original?.sellingPrice)
        : "Not Set",
    sortingFn: "basic",
  },
  {
    accessorKey: "team.name",
    id: "team.name",
    header: "Team Name",
    cell: ({ row }) => row?.original?.team?.name ?? "Not Assigned",
  },
  {
    accessorKey: "tournamentRoles",
    id: "tournamentRoles",
    header: "Tournament Roles",
    cell: ({ row, table }) => {
      const tournamentId =
        (table.options.meta as { tournamentId: string }).tournamentId ?? "";
      const isOrganizer =
        (table.options.meta as { isOrganizer: boolean }).isOrganizer ?? false;
      const onOpenRoleModal = (
        table.options.meta as {
          onOpenRoleModal: (participant: ParticipantWithRelations) => void;
        }
      ).onOpenRoleModal;

      return (
        <TournamentRoleCell
          participant={row.original}
          tournamentId={tournamentId}
          isOrganizer={isOrganizer}
          onOpenRoleModal={onOpenRoleModal}
        />
      );
    },
  },
];

export function ClientPage({ data: initialData }: { data: TournamentData }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pageSize, setPageSize] = useState(10);
  const [selectedParticipant, setSelectedParticipant] =
    useState<ParticipantWithRelations | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const { data, isLoading } = useQuery<TournamentData>({
    queryKey: ["tournament", initialData.data.id],
    queryFn: async () => {
      const res = await getData(initialData.data.slug);
      if (!res.data || !res.session)
        throw new Error("Tournament or session not found");

      return {
        data: res.data as TournamentWithRelations,
        session: {
          session: res.session.session,
          user: res.session.user as SessionUser,
        },
        currentUserParticipant:
          res.currentUserParticipant as ParticipantWithRelations | null,
      };
    },
    initialData,
  });

  // Determine if current user is an organizer
  const currentUserRoles: TournamentRole[] =
    data.currentUserParticipant?.tournamentRoles.map((role) => role.role) ?? [];
  const isOrganizer = canManageDashboard(currentUserRoles);

  const handleOpenRoleModal = (participant: ParticipantWithRelations) => {
    setSelectedParticipant(participant);
    setIsRoleModalOpen(true);
  };

  const handleCloseRoleModal = () => {
    setIsRoleModalOpen(false);
    setSelectedParticipant(null);
  };

  const table = useReactTable({
    data: data.data.participants,
    columns,
    meta: {
      categories: data.data.categories,
      tournamentId: data.data.id,
      isOrganizer,
      onOpenRoleModal: handleOpenRoleModal,
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
    enableSorting: true,
    enableMultiSort: true,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl">
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle>Tournament Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                placeholder="Filter by name..."
                value={
                  (table?.getColumn("user.name")?.getFilterValue() as string) ??
                  ""
                }
                onChange={(event) =>
                  table
                    ?.getColumn("user.name")
                    ?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  table?.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select page size" />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 30, 40, 50].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size} rows
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table?.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table?.getRowModel()?.rows &&
                  table?.getRowModel()?.rows?.length > 0 ? (
                    table?.getRowModel()?.rows?.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="text-center">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        {isLoading ? "Loading..." : "No results."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table?.previousPage()}
                disabled={!table?.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table?.nextPage()}
                disabled={!table?.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Management Modal */}
      {selectedParticipant && data.currentUserParticipant && (
        <RoleManagementModal
          participant={selectedParticipant}
          tournamentId={data.data.id}
          currentUserParticipantId={data.currentUserParticipant.id}
          isOpen={isRoleModalOpen}
          onClose={handleCloseRoleModal}
        />
      )}
    </div>
  );
}
