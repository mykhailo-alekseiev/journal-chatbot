import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateChatSessionFn } from "../server";
import { getChatSessionsQueryOptions } from "./get-sessions";
import type { MutationConfig } from "~/lib/queryClient";

type UseUpdateChatSessionOptions = {
  mutationConfig?: MutationConfig<typeof updateChatSessionFn>;
};

export const useUpdateChatSession = ({ mutationConfig }: UseUpdateChatSessionOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (data, ...args) => {
      queryClient.invalidateQueries({ queryKey: getChatSessionsQueryOptions().queryKey });
      queryClient.invalidateQueries({ queryKey: ["chats", "session", data.id] });
      onSuccess?.(data, ...args);
    },
    ...restConfig,
    mutationFn: updateChatSessionFn,
  });
};
