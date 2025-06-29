"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateTournamentAction } from "./action";
import { updateTournamentFormSchema } from "./form-schema";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { type user, type tournament } from "@/server/db/schema";
import { type Session, type User } from "better-auth";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FormSchema = z.infer<typeof updateTournamentFormSchema>;

interface BasicFormProps {
  tournament: typeof tournament.$inferSelect & {
    organizer: typeof user.$inferSelect;
  };
  session: {
    session: Session;
    user: User;
  };
}

export function BasicForm(initData: BasicFormProps) {
  const params = useParams();
  const queryClient = useQueryClient();
  const slug = params.slug as string;

  const { data } = useQuery({
    queryKey: ["tournament", slug],
    queryFn: async () => {
      const response = await fetch(`/api/tournament/${slug}/edit/basic`);
      const data = (await response.json()) as Promise<BasicFormProps>;
      console.log("data from query", data);
      return data;
    },
    initialData: initData,
  });

  // Form setup with initial data
  const form = useForm<FormSchema>({
    resolver: zodResolver(updateTournamentFormSchema),
    defaultValues: {
      tournamentId: data?.tournament?.id,
      name: data?.tournament?.name,
      description: data?.tournament?.description ?? "",
      bannerImage: data?.tournament?.bannerImage ?? "",
      maxTeamParticipants: data?.tournament?.maxTeamParticipants ?? 4,
    },
  });

  // Mutation for updating tournament
  const { mutate: updateTournament, isPending } = useMutation({
    mutationFn: async (values: FormSchema) => {
      const result = await updateTournamentAction({
        ...values,
        tournamentId: data?.tournament?.id,
      });
      console.log("values", { ...values, tournamentId: data?.tournament?.id });
      console.log("result", result);
      if (result && "data" in result) {
        return result.data;
      } else {
        throw new Error(
          result?.bindArgsValidationErrors?.toString() ??
            result?.serverError?.toString() ??
            // result?.validationErrors?.toString() ??
            "Error Updating Tournament",
        );
      }
    },
    onSuccess: async () => {
      toast.success("Tournament updated successfully");
      await queryClient.invalidateQueries({ queryKey: ["tournament", slug] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update tournament");
    },
  });

  function onSubmit(data: FormSchema) {
    updateTournament(data);
  }

  return (
    <div className="mx-auto max-w-7xl">
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle>Edit Tournament</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tournament Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

              <FormField
                control={form.control}
                name="bannerImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banner Image URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxTeamParticipants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Participants per Team</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col gap-2">
                <Label>Description</Label>
                <RichTextEditor
                  value={form.getValues("description")}
                  onChange={(content: string) =>
                    form.setValue("description", content)
                  }
                />
              </div>

              <Button type="submit" disabled={isPending}>
                {isPending ? "Updating..." : "Update Tournament"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
