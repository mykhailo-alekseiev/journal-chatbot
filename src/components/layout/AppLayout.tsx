import { Outlet, useRouter } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Separator } from "~/components/ui/separator";

export function AppLayout() {
  const router = useRouter();

  return (
    <SidebarProvider>
      <AppSidebar onLogout={() => router.navigate({ to: "/logout" })} />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2" />
          <span className="text-sm font-medium">Journal Assistant</span>
        </header>
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
