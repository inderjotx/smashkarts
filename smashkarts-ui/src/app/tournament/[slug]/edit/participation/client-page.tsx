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
import { ArrowUpIcon, ArrowDownIcon, ChevronsUpDown } from "lucide-react";
import {
  getData,
  updateParticipantCategoryAction,
  updateParticipantStatusAction,
} from "./action";

import type {
  tournament,
  category,
  participant,
  user,
  team,
} from "@/server/db/schema";
import { participationStatus } from "@/server/db/schema";
import { formatIndianNumber } from "@/lib/utils";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
}

type ParticipantWithRelations = typeof participant.$inferSelect & {
  user: typeof user.$inferSelect;
  category: typeof category.$inferSelect | null;
  team: Pick<typeof team.$inferSelect, "id" | "name"> | null;
};

type TournamentWithRelations = typeof tournament.$inferSelect & {
  participants: ParticipantWithRelations[];
  categories: (typeof category.$inferSelect)[];
  organizer: typeof user.$inferSelect;
};

type SessionData = {
  session: Session;
  user: SessionUser;
};

type TournamentData = {
  data: TournamentWithRelations;
  session: {
    session: Session;
    user: typeof user.$inferSelect;
  };
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
      value={participant.category?.id ?? ""}
      onValueChange={(categoryId) => {
        updateCategory.mutate({
          participantId: participant.id,
          categoryId,
        });
      }}
      disabled={updateCategory.isPending}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            <span className="capitalize">{category.name}</span>
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
      value={participant.status ?? ""}
      onValueChange={(
        status: (typeof participationStatus.enumValues)[number],
      ) => {
        updateStatus.mutate({
          participantId: participant.id,
          status,
        });
      }}
      disabled={updateStatus.isPending}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue />
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
];

export function ClientPage({ data: initialData }: { data: TournamentData }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery<TournamentData>({
    queryKey: ["tournament", initialData.data.id],
    queryFn: async () => {
      const res = await getData(initialData.data.slug);
      if (!res.data || !res.session)
        throw new Error("Tournament or session not found");

      // Convert session user to match our schema
      const sessionUser: typeof user.$inferSelect = {
        id: res.session.user.id,
        name: res.session.user.name,
        email: res.session.user.email,
        emailVerified: res.session.user.emailVerified,
        image: res.session.user.image ?? null,
        sId: null,
        kd: null,
        gamesPlayed: null,
        createdAt: res.session.user.createdAt,
        updatedAt: res.session.user.updatedAt,
        description: null,
      };

      return {
        data: res.data as TournamentWithRelations,
        session: {
          session: res.session.session,
          user: sessionUser,
        },
      };
    },
    initialData,
  });

  const table = useReactTable({
    data: data.data.participants,
    columns,
    meta: {
      categories: data.data.categories,
      tournamentId: data.data.id,
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
    <div className="mx-auto flex max-w-7xl flex-col gap-4 py-4">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Filter by name..."
            value={
              (table?.getColumn("user.name")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table?.getColumn("user.name")?.setFilterValue(event.target.value)
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
    </div>
  );
}
