import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/entries")({
  component: Entries,
});

function Entries() {
  return (
    <div className="flex flex-col h-full p-6">
      <h1 className="text-2xl font-semibold mb-4">Journal Entries</h1>
      <p className="text-muted-foreground">Coming soon...</p>
    </div>
  );
}
