import { queryOptions, useQuery } from "@tanstack/react-query";
import { getEntryByIdFn } from "../server";
import type { QueryConfig } from "~/lib/queryClient";

export const getEntryQueryOptions = (id: string) => {
  return queryOptions({
    queryKey: ["journal", "entry", id],
    queryFn: () => getEntryByIdFn({ data: id }),
  });
};

type UseEntryOptions = {
  id: string;
  queryConfig?: QueryConfig<typeof getEntryQueryOptions>;
};

export const useEntry = ({ id, queryConfig }: UseEntryOptions) => {
  return useQuery({
    ...getEntryQueryOptions(id),
    ...queryConfig,
  });
};
