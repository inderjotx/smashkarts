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
import type { Session, User } from "better-auth";
import { ArrowUpIcon, ArrowDownIcon, ChevronsUpDown } from "lucide-react";
import {
  updateParticipantCategoryAction,
  updateParticipantStatusAction,
} from "./action";

interface Participant {
  id: string;
  user: {
    id: string;
    name: string;
    kd: number;
    gamesPlayed: number;
  };
  category: {
    id: string;
    name: string;
  } | null;
  role: "assualt" | "defence" | "mid-defence" | null;
  status: "confirmed" | "pending" | "rejected";
  sellingPrice: number | null;
  teamMember: {
    team: {
      id: string;
      name: string;
    };
  } | null;
}

import type { tournament, category } from "@/server/db/schema";

interface TournamentData {
  data: typeof tournament.$inferSelect & {
    participants: Participant[];
    categories: (typeof category.$inferSelect)[];
  };
  session: {
    session: Session;
    user: User;
  };
}

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
      status: "confirmed" | "pending" | "rejected";
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
  column: Column<Participant>;
  title: string;
}) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting()}
      className="flex items-center gap-1"
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
  participant: Participant;
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
  participant: Participant;
  tournamentId: string;
}) => {
  const { updateStatus } = useUpdateParticipant(tournamentId);

  return (
    <Select
      value={participant.status}
      onValueChange={(status: "confirmed" | "pending" | "rejected") => {
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
        {["confirmed", "pending", "rejected"].map((status) => (
          <SelectItem key={status} value={status}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Update the columns definition to use these components
const columns: ColumnDef<Participant>[] = [
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
    cell: ({ row }) => row?.original?.sellingPrice ?? "Not Set",
    sortingFn: "basic",
  },
  {
    accessorKey: "teamMember.team.name",
    id: "teamMember.team.name",
    header: "Team Name",
    cell: ({ row }) => row?.original?.teamMember?.team.name ?? "Not Assigned",
  },
];

export function ClientPage({ data: initialData }: { data: TournamentData }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery<TournamentData>({
    queryKey: ["tournament", initialData.data.id],
    queryFn: async () => {
      const response = await fetch(
        `/api/tournament/${initialData.data.slug}/edit/participants`,
      );
      const data = (await response.json()) as Promise<TournamentData>;
      console.log(data);
      return data;
    },
    initialData: initialData,
  });

  const table = useReactTable({
    data: data?.data?.participants ?? [],
    columns,
    meta: {
      categories: data?.data?.categories ?? [],
      tournamentId: initialData?.data?.id,
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
                      <TableCell key={cell.id}>
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
