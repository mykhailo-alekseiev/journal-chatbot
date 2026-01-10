import { Link, useMatchRoute, useRouter } from "@tanstack/react-router";
import { BookOpen, MessageSquare, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import styles from "./AppSidebar.module.css";

const navItems = [
  { to: "/chat", icon: MessageSquare, label: "Chat" },
  { to: "/entries", icon: BookOpen, label: "Entries" },
] as const;

export function AppSidebar() {
  const matchRoute = useMatchRoute();
  const router = useRouter();

  return (
    <Sidebar>
      <SidebarHeader className={styles.headerContainer}>
        <div className={styles.logoContainer}>
          <BookOpen className={styles.logoIcon} />
          <span className={styles.logoText}>Journal</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = matchRoute({ to: item.to });
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton isActive={!!isActive} render={<Link to={item.to} />}>
                      <item.icon className={styles.navIcon} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Placeholder for Phase 3: Chat History */}
        <SidebarGroup>
          <SidebarGroupLabel>History</SidebarGroupLabel>
          <SidebarGroupContent>
            <p className={styles.placeholder}>Coming in Phase 3</p>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                router.navigate({ to: "/logout" });
              }}
              className={styles.logoutButton}
            >
              <LogOut className={styles.navIcon} />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
