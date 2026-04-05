import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Building2,
  ChevronRight,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Upload,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { UserProfile } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type Page =
  | "dashboard"
  | "upload"
  | "my-submissions"
  | "groups"
  | "admin-submissions"
  | "admin-users";

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isAdmin: boolean;
  profile: UserProfile | null;
}

const userNavItems = [
  { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
  { id: "upload" as Page, label: "Upload Files", icon: Upload },
  { id: "my-submissions" as Page, label: "My Submissions", icon: FileText },
  { id: "groups" as Page, label: "Groups", icon: FolderOpen },
];

const adminNavItems = [
  { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
  { id: "admin-submissions" as Page, label: "All Submissions", icon: FileText },
  { id: "admin-users" as Page, label: "All Users", icon: Users },
  { id: "groups" as Page, label: "Groups", icon: FolderOpen },
];

export default function Layout({
  children,
  currentPage,
  onNavigate,
  isAdmin,
  profile,
}: LayoutProps) {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = isAdmin ? adminNavItems : userNavItems;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const initials = profile?.username
    ? profile.username
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <Building2 size={18} className="text-white" />
          </div>
          <span className="font-bold text-base text-sidebar-foreground tracking-tight">
            Office Portal
          </span>
        </div>
      </div>

      {/* Role Badge */}
      <div className="px-5 pt-4 pb-2">
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            isAdmin
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isAdmin ? "Administrator" : "Team Member"}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-ocid={`nav.${item.id}.link`}
              onClick={() => {
                onNavigate(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-background hover:text-foreground"
              }`}
            >
              <Icon
                size={17}
                className={
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                }
              />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && (
                <ChevronRight size={14} className="text-primary opacity-60" />
              )}
            </button>
          );
        })}
      </nav>

      <Separator className="mx-4" />

      {/* User + Logout */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {profile?.username ?? "User"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? "Admin" : "Member"}
            </p>
          </div>
        </div>
        <Button
          data-ocid="nav.logout.button"
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9"
        >
          <LogOut size={15} />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-card border-r border-border fixed top-0 left-0 h-full z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="fixed top-0 left-0 h-full w-60 bg-card border-r border-border z-40 lg:hidden"
            >
              <div className="absolute top-3 right-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X size={16} />
                </Button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border h-14 flex items-center px-6 gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden h-8 w-8 p-0"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
          </Button>
          <div className="flex-1" />
          <button
            type="button"
            data-ocid="nav.notifications.button"
            className="relative h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Bell size={17} />
          </button>
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground hidden sm:inline">
              {profile?.username ?? "User"}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="bg-navy text-white py-4 px-6">
          <p className="text-xs text-white/60 text-center">
            © {new Date().getFullYear()} Office Portal. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white underline"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
