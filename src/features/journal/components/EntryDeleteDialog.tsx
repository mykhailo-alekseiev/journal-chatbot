import { useDeleteEntry } from "../api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";

interface EntryDeleteDialogProps {
  entryId: string | undefined;
  open: boolean;
  onOpenChange: (state: boolean) => void;
  onSuccess: () => void;
}

export function EntryDeleteDialog({
  entryId,
  open,
  onOpenChange,
  onSuccess,
}: EntryDeleteDialogProps) {
  const deleteMutation = useDeleteEntry({
    mutationConfig: {
      onSuccess,
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete entry?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this journal entry.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => entryId && deleteMutation.mutate({ data: entryId })}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
