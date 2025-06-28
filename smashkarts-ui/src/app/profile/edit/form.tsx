"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserAction } from "./action";
import { updateUserFormSchema } from "./form-schema";
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
import { toast } from "sonner";
import { type user } from "@/server/db/schema";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Label } from "@/components/ui/label";

type FormSchema = z.infer<typeof updateUserFormSchema>;

interface UserFormProps {
  userData: typeof user.$inferSelect;
}

export function UserForm({ userData }: UserFormProps) {
  const queryClient = useQueryClient();

  // Form setup with initial data
  const form = useForm<FormSchema>({
    resolver: zodResolver(updateUserFormSchema),
    defaultValues: {
      name: userData?.name ?? "",
      image: userData?.image ?? "",
      description: userData?.description ?? "",
      sId: userData?.sId ?? "",
    },
  });

  // Mutation for updating user
  const { mutate: updateUser, isPending } = useMutation({
    mutationFn: async (values: FormSchema) => {
      const result = await updateUserAction(values);
      if (result && "data" in result) {
        return result.data;
      } else {
        throw new Error(
          result?.bindArgsValidationErrors?.toString() ??
            result?.serverError?.toString() ??
            "Error Updating User Profile",
        );
      }
    },
    onSuccess: async () => {
      toast.success("Profile updated successfully");
      await queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  function onSubmit(data: FormSchema) {
    updateUser(data);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 py-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Image URL</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="https://example.com/image.jpg"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Smashkart ID</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Smashkart ID" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-2">
            <Label>Description</Label>
            <RichTextEditor
              content={form.getValues("description")}
              onChange={(content) => form.setValue("description", content)}
            />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Updating..." : "Update Profile"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
