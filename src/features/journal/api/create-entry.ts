import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { createEntryFn } from "../server";
import { getEntriesQueryOptions } from "./get-entries";
import { Constants } from "~/lib/database.types";
import type { MutationConfig } from "~/lib/queryClient";

const moodLevels = Constants.public.Enums.mood_level;

export const createEntryInputSchema = z.object({
  content: z.string().min(1, "Content is required"),
  summary: z.string().optional(),
  entry_date: z.string().optional(),
  mood: z.enum(moodLevels).optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateEntryInput = z.infer<typeof createEntryInputSchema>;

type UseCreateEntryOptions = {
  mutationConfig?: MutationConfig<typeof createEntryFn>;
};

export const useCreateEntry = ({ mutationConfig }: UseCreateEntryOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: getEntriesQueryOptions().queryKey,
      });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: createEntryFn,
  });
};
