import { Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "~/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Separator } from "~/components/ui/separator";
import { useIsMobile } from "~/hooks/use-mobile";

function AppLayoutContent() {
  const router = useRouter();
  const { setOpen } = useSidebar();
  const isMobile = useIsMobile();
  const routerState = useRouterState();

  // Close sidebar on mobile after navigation
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [routerState.location.pathname, isMobile, setOpen]);

  return (
    <>
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
    </>
  );
}

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppLayoutContent />
    </SidebarProvider>
  );
}
