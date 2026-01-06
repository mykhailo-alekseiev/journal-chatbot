import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { updateEntryFn } from "../server";
import { getEntriesQueryOptions } from "./get-entries";
import { getEntryQueryOptions } from "./get-entry";
import { Constants } from "~/lib/database.types";
import type { MutationConfig } from "~/lib/queryClient";

const moodLevels = Constants.public.Enums.mood_level;

export const updateEntryInputSchema = z.object({
  id: z.string(),
  updates: z.object({
    content: z.string().optional(),
    summary: z.string().optional(),
    entry_date: z.string().optional(),
    mood: z.enum(moodLevels).optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export type UpdateEntryInput = z.infer<typeof updateEntryInputSchema>;

type UseUpdateEntryOptions = {
  mutationConfig?: MutationConfig<typeof updateEntryFn>;
};

export const useUpdateEntry = ({ mutationConfig }: UseUpdateEntryOptions = {}) => {
  const queryClient = useQueryClient();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, ...args) => {
      queryClient.invalidateQueries({
        queryKey: getEntriesQueryOptions().queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: getEntryQueryOptions(data.id).queryKey,
      });
      onSuccess?.(data, ...args);
    },
    ...restConfig,
    mutationFn: updateEntryFn,
  });
};
