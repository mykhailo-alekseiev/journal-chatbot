import { useState } from "react";
import Markdown from "react-markdown";
import { useEntry } from "../api";
import { getMoodConfig } from "../types";
import { formatDate, formatTimestamp } from "~/lib/date";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { EntryDeleteDialog } from "./EntryDeleteDialog";

interface EntryDetailSheetProps {
  entryId: string | undefined;
  onClose: () => void;
}

export function EntryDetailSheet({ entryId, onClose }: EntryDetailSheetProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { data: entry, isLoading } = useEntry({
    id: entryId || "",
    queryConfig: {
      enabled: !!entryId,
    },
  });

  return (
    <Sheet open={!!entryId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-2xl flex flex-col">
        {isLoading && <div className="p-4">Loading...</div>}
        {entry && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3 pr-12">
                {entry.mood && <div className="text-3xl">{getMoodConfig(entry.mood).emoji}</div>}
                <div className="flex-1">
                  <SheetTitle>{formatDate(entry.entry_date)}</SheetTitle>
                  {entry.summary && <SheetDescription>{entry.summary}</SheetDescription>}
                </div>
              </div>
            </SheetHeader>

            <div className="grid flex-1 auto-rows-min gap-6 px-4 overflow-y-auto">
              {/* Tags */}
              {entry.tags && entry.tags.length > 0 && (
                <div className="grid gap-3">
                  <div className="flex flex-wrap gap-2">
                    {entry.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="grid gap-3">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <Markdown>{entry.content}</Markdown>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid gap-3">
                <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
                  <div>Created: {formatTimestamp(entry.created_at)}</div>
                  <div>Updated: {formatTimestamp(entry.updated_at)}</div>
                </div>
              </div>
            </div>

            <SheetFooter className="flex-row gap-2">
              <Button variant="outline" className="gap-2 flex-1">
                <Pencil className="size-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="gap-2 flex-1 text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>

      <EntryDeleteDialog
        entryId={entryId}
        open={showDeleteDialog}
        onSuccess={() => {
          setShowDeleteDialog(false);
          onClose();
        }}
        onOpenChange={setShowDeleteDialog}
      />
    </Sheet>
  );
}
