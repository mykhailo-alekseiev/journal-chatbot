import { Outlet, useRouterState } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "~/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Separator } from "~/components/ui/separator";
import { useEffect } from "react";

function AppLayoutContent() {
  const router = useRouterState();
  const { setOpenMobile, isMobile, state } = useSidebar();

  useEffect(() => {
    if (!isMobile || state === "collapsed") return;

    setOpenMobile(false);
  }, [router.location.pathname, isMobile, setOpenMobile, state]);

  return (
    <>
      <AppSidebar />
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
