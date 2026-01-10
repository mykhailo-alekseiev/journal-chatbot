import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useEntries } from "~/features/journal/api";
import { getMoodConfig } from "~/features/journal/types";
import { formatDate } from "~/lib/date";
import { stripMarkdown } from "~/lib/utils";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { EntryDetailSheet } from "~/features/journal/components/EntryDetailSheet";
import styles from "./entries.module.css";

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
      <div className={styles.centered}>
        <p className={styles.mutedText}>Loading entries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.centered}>
        <p className={styles.errorText}>Error loading entries: {error.message}</p>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className={styles.centeredColumn}>
        <div className={styles.contentBox}>
          <h2 className={styles.pageTitle}>No entries yet</h2>
          <p className={styles.mutedText}>
            Start journaling by chatting with your AI assistant or create an entry here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Journal Entries</h1>
        <p className={styles.entryCount}>{entries.length} total entries</p>
      </div>

      <div className={styles.entriesScroll}>
        <div className={styles.entriesContainer}>
          {entries.map((entry) => (
            <Card
              key={entry.id}
              className={styles.entryCard}
              onClick={() => navigate({ to: "/entries", search: { entryId: entry.id } })}
            >
              <div className={styles.entryRow}>
                {/* Mood emoji */}
                {entry.mood && (
                  <div className={styles.moodEmoji} title={getMoodConfig(entry.mood).label}>
                    {getMoodConfig(entry.mood).emoji}
                  </div>
                )}

                <div className={styles.entryContent}>
                  {/* Date */}
                  <div className={styles.entryDate}>
                    {formatDate(entry.entry_date)}
                  </div>

                  {/* Summary */}
                  {entry.summary && (
                    <div className={styles.entrySummary}>{entry.summary}</div>
                  )}

                  {/* Content preview */}
                  <div className={styles.entryPreview}>
                    {stripMarkdown(entry.content)}
                  </div>

                  {/* Tags */}
                  {entry.tags && entry.tags.length > 0 && (
                    <div className={styles.tagsContainer}>
                      {entry.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className={styles.tag}>
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
