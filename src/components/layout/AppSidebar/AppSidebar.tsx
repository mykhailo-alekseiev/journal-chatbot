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
import { useChatSessions } from "~/features/chats/api/get-sessions";
import { useDeleteChatSession } from "~/features/chats/api/delete-session";
import { formatTimestamp } from "~/lib/date";
import { Button } from "~/components/ui/button";
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
          <div className={styles.historyHeader}>
            <SidebarGroupLabel>History</SidebarGroupLabel>
            <Button
              variant="ghost"
              size="icon"
              className={styles.newChatButton}
              onClick={handleNewChat}
            >
              <Plus className={styles.plusIcon} />
            </Button>
          </div>
          <SidebarGroupContent>
            {isLoading ? (
              <div className={styles.loadingContainer}>
                <Loader2 className={styles.loadingSpinner} />
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
                      className={styles.sessionButton}
                    >
                      <div className={styles.sessionContent}>
                        <span className={styles.sessionTitle}>
                          {session.title || "Untitled Chat"}
                        </span>
                        <span className={styles.sessionDate}>
                          {formatTimestamp(session.updated_at)}
                        </span>
                      </div>
                    </SidebarMenuButton>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={styles.deleteButton}
                      onClick={(e) => handleDeleteChat(e, session.id)}
                    >
                      <Trash2 className={styles.deleteIcon} />
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
