import { Outlet, useRouterState } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "~/components/ui/sidebar";
import { AppSidebar } from "../AppSidebar";
import { Separator } from "~/components/ui/separator";
import { useEffect } from "react";
import styles from "./AppLayout.module.css";

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
      <SidebarInset className={styles.inset}>
        <header className={styles.header}>
          <SidebarTrigger />
          <Separator orientation="vertical" className={styles.separator} />
          <span className={styles.title}>Journal Assistant</span>
        </header>
        <main className={styles.main}>
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
