import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteChatSessionFn } from "../server";
import { getChatSessionsQueryOptions } from "./get-sessions";
import type { MutationConfig } from "~/lib/queryClient";

type UseDeleteChatSessionOptions = {
  mutationConfig?: MutationConfig<typeof deleteChatSessionFn>;
};

export const useDeleteChatSession = ({ mutationConfig }: UseDeleteChatSessionOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: getChatSessionsQueryOptions().queryKey });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: deleteChatSessionFn,
  });
};
