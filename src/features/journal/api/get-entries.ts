import { queryOptions, useQuery } from "@tanstack/react-query";
import { getEntriesFn } from "../server";
import type { QueryConfig } from "~/lib/queryClient";

export const getEntriesQueryOptions = () => {
  return queryOptions({
    queryKey: ["journal", "entries"],
    queryFn: () => getEntriesFn(),
  });
};

type UseEntriesOptions = {
  queryConfig?: QueryConfig<typeof getEntriesQueryOptions>;
};

export const useEntries = ({ queryConfig }: UseEntriesOptions = {}) => {
  return useQuery({
    ...getEntriesQueryOptions(),
    ...queryConfig,
  });
};
