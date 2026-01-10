import { queryOptions, useQuery } from "@tanstack/react-query";
import { getChatSessionsFn } from "../server";
import type { QueryConfig } from "~/lib/queryClient";

export const getChatSessionsQueryOptions = () => {
  return queryOptions({
    queryKey: ["chats", "sessions"],
    queryFn: () => getChatSessionsFn(),
  });
};

type UseChatSessionsOptions = {
  queryConfig?: QueryConfig<typeof getChatSessionsQueryOptions>;
};

export const useChatSessions = ({ queryConfig }: UseChatSessionsOptions = {}) => {
  return useQuery({
    ...getChatSessionsQueryOptions(),
    ...queryConfig,
  });
};
