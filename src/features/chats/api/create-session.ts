import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createChatSessionFn } from "../server";
import { getChatSessionsQueryOptions } from "./get-sessions";
import type { MutationConfig } from "~/lib/queryClient";

type UseCreateChatSessionOptions = {
  mutationConfig?: MutationConfig<typeof createChatSessionFn>;
};

export const useCreateChatSession = ({ mutationConfig }: UseCreateChatSessionOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: getChatSessionsQueryOptions().queryKey });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: createChatSessionFn,
  });
};
