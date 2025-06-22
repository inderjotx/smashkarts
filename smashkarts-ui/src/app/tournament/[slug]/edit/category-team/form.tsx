"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { createCategoryAction, createTeamActionAndAddCaptain } from "./action";
import { toast } from "sonner";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCategorySchema, createTeamSchema } from "./schema";
import { participant, user } from "@/server/db/schema";

interface CategoryFormProps {
  tournamentId: string;
  onSuccess?: () => void;
}

export function CreateCategoryForm({
  tournamentId,
  onSuccess,
}: CategoryFormProps) {
  const [open, setOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      tournamentId,
      name: "",
      basePrice: 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof createCategorySchema>) => {
    try {
      await createCategoryAction(values);
      toast.success("Category created successfully");
      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to create category");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Category</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="basePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Create</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface TeamFormProps {
  tournamentId: string;
  participants: (typeof participant.$inferSelect & {
    user: typeof user.$inferSelect;
  })[];
  onSuccess?: () => void;
}

export function CreateTeamForm({
  tournamentId,
  participants,
  onSuccess,
}: TeamFormProps) {
  const [open, setOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      tournamentId,
      name: "",
      captainId: "",
      purse: 0,
    },
  });

  // Filter participants who are confirmed and not already captains
  const eligibleCaptains = participants?.filter(
    (participant) => participant.status === "confirmed" && !participant.teamId, // Not part of any team
  );

  const onSubmit = async (values: z.infer<typeof createTeamSchema>) => {
    try {
      await createTeamActionAndAddCaptain(values);
      toast.success("Team created successfully");
      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to create team");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Team</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="captainId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Captain</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select captain" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eligibleCaptains.map((participant) => (
                        <SelectItem key={participant.id} value={participant.id}>
                          {participant?.user?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Purse</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Create</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
