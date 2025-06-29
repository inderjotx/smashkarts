"use client";

import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type CreateTournamentInput,
  createTournamentSchema,
} from "./form-schema";
import { createTournament } from "./action";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CreateTournamentForm() {
  const form = useForm<CreateTournamentInput>({
    resolver: zodResolver(createTournamentSchema),
    defaultValues: {
      name: "",
      description: "",
      bannerImage: "",
    },
  });

  const router = useRouter();

  const onSubmit = async (data: CreateTournamentInput) => {
    try {
      const result = await createTournament(data);
      if (result?.data) {
        toast("Tournament created successfully!");
        router.push(`/tournament/${result.data.slug}`);
      } else {
        toast.error("Failed to create tournament");
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error("Failed to create tournament: " + error.message);
      } else {
        toast.error("Failed to create tournament");
      }
      console.error(error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tournament Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter tournament name" {...field} />
              </FormControl>
              <FormDescription>
                The name of your tournament as it will appear to participants.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bannerImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Banner Image URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com/banner.jpg"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A URL to the banner image for your tournament (optional).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <RichTextEditor
                  value={form.getValues("description")}
                  onChange={(content) => {
                    form.setValue("description", content);
                  }}
                />
              </FormControl>
              <FormDescription>
                Provide details about your tournament, rules, and other
                important information.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Creating..." : "Create Tournament"}
        </Button>
      </form>
    </Form>
  );
}
