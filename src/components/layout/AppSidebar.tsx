import { Link, useMatchRoute } from "@tanstack/react-router";
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

const navItems = [
  { to: "/chat", icon: MessageSquare, label: "Chat" },
  { to: "/entries", icon: BookOpen, label: "Entries" },
] as const;

interface AppSidebarProps {
  onLogout: () => void;
}

export function AppSidebar({ onLogout }: AppSidebarProps) {
  const matchRoute = useMatchRoute();

  return (
    <Sidebar>
      <SidebarHeader className="h-12 flex items-center">
        <div className="flex items-center gap-2 px-2">
          <BookOpen className="size-5" />
          <span className="font-semibold">Journal</span>
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
                      <item.icon className="size-4" />
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
            <p className="px-2 text-xs text-muted-foreground">Coming in Phase 3</p>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onLogout} className="cursor-pointer">
              <LogOut className="size-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
