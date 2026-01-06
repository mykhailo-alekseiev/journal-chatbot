import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteEntryFn } from "../server";
import { getEntriesQueryOptions } from "./get-entries";
import type { MutationConfig } from "~/lib/queryClient";

type UseDeleteEntryOptions = {
  mutationConfig?: MutationConfig<typeof deleteEntryFn>;
};

export const useDeleteEntry = ({ mutationConfig }: UseDeleteEntryOptions = {}) => {
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
    mutationFn: deleteEntryFn,
  });
};
