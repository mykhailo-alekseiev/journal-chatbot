import { queryOptions, useQuery } from "@tanstack/react-query";
import { getChatSessionFn } from "../server";
import type { QueryConfig } from "~/lib/queryClient";

export const getChatSessionQueryOptions = (id: string) => {
  return queryOptions({
    queryKey: ["chats", "session", id],
    queryFn: () => getChatSessionFn({ data: id }),
    enabled: !!id,
  });
};

type UseChatSessionOptions = {
  id: string;
  queryConfig?: QueryConfig<typeof getChatSessionQueryOptions>;
};

export const useChatSession = ({ id, queryConfig }: UseChatSessionOptions) => {
  return useQuery({
    ...getChatSessionQueryOptions(id),
    ...queryConfig,
  });
};
