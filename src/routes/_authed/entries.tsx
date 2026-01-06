import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useEntries } from "~/features/journal/api";
import { getMoodConfig } from "~/features/journal/types";
import { formatDate } from "~/lib/date";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { EntryDetailSheet } from "~/features/journal/components/EntryDetailSheet";

const entriesSearchSchema = z.object({
  entryId: z.string().optional(),
});

export const Route = createFileRoute("/_authed/entries")({
  component: Entries,
  validateSearch: entriesSearchSchema,
});

function Entries() {
  const navigate = useNavigate();
  const { entryId } = Route.useSearch();
  const { data: entries, isLoading, error } = useEntries();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading entries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Error loading entries: {error.message}</p>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="max-w-md space-y-3">
          <h2 className="text-2xl font-semibold">No entries yet</h2>
          <p className="text-muted-foreground">
            Start journaling by chatting with your AI assistant or create an entry here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-2xl font-semibold">Journal Entries</h1>
        <p className="text-sm text-muted-foreground mt-1">{entries.length} total entries</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl space-y-3">
          {entries.map((entry) => (
            <Card
              key={entry.id}
              className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => navigate({ to: "/entries", search: { entryId: entry.id } })}
            >
              <div className="flex items-start gap-3">
                {/* Mood emoji */}
                {entry.mood && (
                  <div className="text-2xl flex-shrink-0" title={getMoodConfig(entry.mood).label}>
                    {getMoodConfig(entry.mood).emoji}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {/* Date */}
                  <div className="text-sm text-muted-foreground mb-1">
                    {formatDate(entry.entry_date)}
                  </div>

                  {/* Summary */}
                  {entry.summary && (
                    <div className="font-medium mb-2 line-clamp-1">{entry.summary}</div>
                  )}

                  {/* Content preview */}
                  <div className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {entry.content}
                  </div>

                  {/* Tags */}
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <EntryDetailSheet entryId={entryId} onClose={() => navigate({ to: "/entries" })} />
    </div>
  );
}
