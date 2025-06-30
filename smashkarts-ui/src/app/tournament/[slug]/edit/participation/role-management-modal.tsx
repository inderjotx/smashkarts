"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  assignTournamentRole,
  removeTournamentRole,
} from "@/actions/tournament";
import type { TournamentRole } from "@/lib/utils";
import type {
  participant,
  user,
  tournamentRoleAssignment,
} from "@/server/db/schema";
import { Check, X } from "lucide-react";

type ParticipantWithUser = typeof participant.$inferSelect & {
  user: typeof user.$inferSelect;
  tournamentRoles: (typeof tournamentRoleAssignment.$inferSelect)[];
};

interface RoleManagementModalProps {
  participant: ParticipantWithUser;
  tournamentId: string;
  currentUserParticipantId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Role information with descriptions and permissions
const ROLE_INFO = {
  organizer: {
    title: "Organizer",
    description:
      "Full control over the tournament. Can manage all aspects including participants, teams, categories, and auction.",
    permissions: [
      { text: "Manage tournament settings", has: true },
      { text: "Assign/remove all roles", has: true },
      { text: "Manage participants and teams", has: true },
      { text: "Control auction process", has: true },
      { text: "Access all tournament features", has: true },
    ],
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    level: 3,
  },
  admin: {
    title: "Admin",
    description:
      "High-level management permissions. Can manage participants, teams, and auction process.",
    permissions: [
      { text: "Manage participants and teams", has: true },
      { text: "Control auction process", has: true },
      { text: "Access dashboard features", has: true },
      { text: "Assign/remove roles", has: false },
    ],
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    level: 2,
  },
  maintainer: {
    title: "Maintainer",
    description:
      "Basic management permissions. Can manage participants and teams but cannot control auction.",
    permissions: [
      { text: "Manage participants and teams", has: true },
      { text: "Access dashboard features", has: true },
      { text: "Control auction", has: false },
      { text: "Assign/remove roles", has: false },
    ],
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    level: 1,
  },
  auctioneer: {
    title: "Auctioneer",
    description:
      "Auction-specific permissions. Can control the auction process but cannot manage other aspects.",
    permissions: [
      { text: "Control auction process", has: true },
      { text: "Start/stop bidding", has: true },
      { text: "Manage participants", has: false },
      { text: "Assign/remove roles", has: false },
    ],
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    level: 1,
  },
} as const;

export function RoleManagementModal({
  participant,
  tournamentId,
  currentUserParticipantId,
  isOpen,
  onClose,
}: RoleManagementModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const updateRoleMutation = useMutation({
    mutationFn: async ({
      role,
      action,
    }: {
      role: TournamentRole;
      action: "add" | "remove";
    }): Promise<{ success: boolean }> => {
      if (action === "add") {
        await assignTournamentRole(
          tournamentId,
          participant.id,
          role,
          currentUserParticipantId,
        );
      } else {
        await removeTournamentRole(tournamentId, participant.id, role);
      }
      return { success: true };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["tournament", tournamentId],
      });
      toast.success("Tournament role updated successfully");
      // Close the dialog after successful update
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update tournament role");
    },
  });

  const handleRoleToggle = async (role: TournamentRole) => {
    setIsUpdating(true);
    const hasRole = participant.tournamentRoles.some((r) => r.role === role);

    try {
      await updateRoleMutation.mutateAsync({
        role,
        action: hasRole ? "remove" : "add",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const availableRoles: TournamentRole[] = [
    "organizer",
    "admin",
    "maintainer",
    "auctioneer",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Tournament Roles</DialogTitle>
          <DialogDescription>
            Manage roles for {participant.user.name}. Roles determine what
            actions this participant can perform in the tournament.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Roles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Roles</CardTitle>
            </CardHeader>
            <CardContent>
              {participant.tournamentRoles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {participant.tournamentRoles.map((roleAssignment) => {
                    const roleInfo = ROLE_INFO[roleAssignment.role];
                    return (
                      <Badge
                        key={roleAssignment.id}
                        className={`${roleInfo.color} text-sm font-medium`}
                      >
                        {roleInfo.title}
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No roles assigned</p>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Available Roles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Roles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {availableRoles.map((role) => {
                const roleInfo = ROLE_INFO[role];
                const hasRole = participant.tournamentRoles.some(
                  (r) => r.role === role,
                );
                const isUpdatingThisRole = isUpdating;

                return (
                  <div
                    key={role}
                    className={`rounded-lg border p-4 transition-colors ${
                      hasRole ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge
                            className={`${roleInfo.color} text-sm font-medium`}
                          >
                            {roleInfo.title}
                          </Badge>
                          {hasRole && (
                            <Badge variant="secondary" className="text-xs">
                              Assigned
                            </Badge>
                          )}
                        </div>
                        <p className="mb-3 text-sm text-muted-foreground">
                          {roleInfo.description}
                        </p>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            Permissions:
                          </p>
                          <ul className="space-y-1 text-xs text-muted-foreground">
                            {roleInfo.permissions.map((permission, index) => (
                              <li
                                key={index}
                                className="flex items-center gap-2"
                              >
                                {permission.has ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <X className="h-3 w-3 text-red-600" />
                                )}
                                <span
                                  className={
                                    permission.has
                                      ? "text-green-700"
                                      : "text-red-700"
                                  }
                                >
                                  {permission.text}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Button
                          variant={hasRole ? "destructive" : "default"}
                          size="sm"
                          onClick={() => handleRoleToggle(role)}
                          disabled={isUpdatingThisRole}
                          className="min-w-[100px]"
                        >
                          {isUpdatingThisRole ? (
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                              Updating...
                            </div>
                          ) : hasRole ? (
                            "Remove Role"
                          ) : (
                            "Add Role"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Role Hierarchy Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Role Hierarchy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Roles are hierarchical. Higher-level roles inherit permissions
                  from lower-level roles:
                </p>
                <div className="space-y-1">
                  {availableRoles
                    .sort((a, b) => ROLE_INFO[b].level - ROLE_INFO[a].level)
                    .map((role) => {
                      const roleInfo = ROLE_INFO[role];
                      return (
                        <div key={role} className="flex items-center gap-2">
                          <Badge className={`${roleInfo.color} text-xs`}>
                            {roleInfo.title}
                          </Badge>
                          <span className="text-muted-foreground">
                            Level {roleInfo.level}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
