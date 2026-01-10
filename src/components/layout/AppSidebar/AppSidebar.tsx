import { Link, useMatchRoute, useRouter, useSearch } from "@tanstack/react-router";
import { BookOpen, MessageSquare, LogOut, Plus, Trash2, Loader2 } from "lucide-react";
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
import { useChatSessions, useDeleteChatSession } from "~/features/chats/api";
import { formatTimestamp } from "~/lib/date";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import styles from "./AppSidebar.module.css";

const navItems = [
  { to: "/chat", icon: MessageSquare, label: "Chat" },
  { to: "/entries", icon: BookOpen, label: "Entries" },
] as const;

export function AppSidebar() {
  const matchRoute = useMatchRoute();
  const router = useRouter();
  const { data: sessions, isLoading } = useChatSessions();
  const deleteSession = useDeleteChatSession();

  const { chatId: currentChatId } = useSearch({ from: "/_authed" });

  const handleNewChat = () => {
    router.navigate({ to: "/chat", search: { chatId: undefined } });
  };

  const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    await deleteSession.mutateAsync({ data: id });

    // If deleting current chat, navigate to new chat
    if (id === currentChatId) {
      router.navigate({ to: "/chat", search: { chatId: undefined } });
    }
  };

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

        <SidebarGroup>
          <div className="flex items-center justify-between px-2">
            <SidebarGroupLabel>History</SidebarGroupLabel>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleNewChat}>
              <Plus className="size-4" />
            </Button>
          </div>
          <SidebarGroupContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-4 animate-spin" />
              </div>
            ) : sessions?.length === 0 ? (
              <p className={styles.placeholder}>No chat history</p>
            ) : (
              <SidebarMenu>
                {sessions?.map((session) => (
                  <SidebarMenuItem key={session.id} className="group">
                    <SidebarMenuButton
                      isActive={session.id === currentChatId}
                      render={<Link to="/chat" search={{ chatId: session.id }} />}
                      className="pr-8"
                    >
                      <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                        <span className="truncate w-full text-sm">
                          {session.title || "Untitled Chat"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(session.updated_at)}
                        </span>
                      </div>
                    </SidebarMenuButton>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6",
                        "opacity-0 group-hover:opacity-100 transition-opacity",
                      )}
                      onClick={(e) => handleDeleteChat(e, session.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
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
