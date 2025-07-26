"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
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
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  Home,
  Settings,
  Shield,
  Wrench,
  Zap,
  ChevronUp,
} from "lucide-react";

// Daftar menu
const menuItems = [
  { title: "Dashboard", url: "/", icon: Home, roles: ["admin", "engineer", "utility", "requester", "qac"] },
  { title: "Work Orders", url: "/wo", icon: Wrench, roles: ["admin", "engineer"], badge: "12" },
  { title: "Requests", url: "/request", icon: ClipboardList, roles: ["admin", "requester"], badge: "5" },
  { title: "Energy Monitor", url: "/energy", icon: Zap, roles: ["admin", "utility"] },
  { title: "Analytics", url: "/analytics", icon: BarChart3, roles: ["admin"] },
  { title: "Compliance", url: "/compliance", icon: Shield, roles: ["admin", "qac"], badge: "3" },
  { title: "Files", url: "/files", icon: FileText, roles: ["admin", "engineer", "utility", "requester", "qac"] },
  { title: "Admin", url: "/admin", icon: Settings, roles: ["admin"] },
];

// Custom hook untuk cek client-side render
function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  return hasMounted;
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const hasMounted = useHasMounted();
  const [currentUser, setCurrentUser] = useState<any>(null);

<<<<<<< HEAD
  // Function untuk update user saat login/logout
  const updateUserFromLocalStorage = () => {
    const access = localStorage.getItem("access");
    const userJson = localStorage.getItem("user");
=======
  useEffect(() => {
    const access = localStorage.getItem("accessToken")
    const userJson = localStorage.getItem("user")
>>>>>>> bd5f93c570d713006d9458112bb727d9a5503c8f

    if (access && userJson && userJson !== "undefined") {
      try {
        const user = JSON.parse(userJson);
        setCurrentUser(user); // Set currentUser state

        const currentRole = user.userprofile?.role || user.role;
        console.log("User Role:", currentRole); // Log current role
      } catch (err) {
        console.error("Failed to parse user", err);
      }
    } else {
      // Jika tidak ada user atau access token, set currentUser ke null (logout)
      setCurrentUser(null);
    }
  };

<<<<<<< HEAD
  // Gunakan useEffect untuk memantau perubahan localStorage
  useEffect(() => {
    updateUserFromLocalStorage(); // Update user saat pertama kali render
    window.addEventListener("storage", updateUserFromLocalStorage); // Tambahkan listener untuk perubahan localStorage

    // Cleanup listener saat komponen di-unmount
    return () => {
      window.removeEventListener("storage", updateUserFromLocalStorage);
    };
  }, []);

  // Jangan render sebelum mount (hindari hydration error)
  if (!hasMounted) return null;

  const isAuthPage = pathname === "/login";
  const accessToken = localStorage.getItem("access");

  // Sembunyikan sidebar jika di halaman login atau tidak ada akses token
  if (isAuthPage || !accessToken) return null;

  // Loading saat currentUser belum siap
=======
  if (!hasMounted) return null

  const isAuthPage = pathname === "/login"
  const accessToken = localStorage.getItem("accessToken")

  if (isAuthPage || !accessToken) return null

>>>>>>> bd5f93c570d713006d9458112bb727d9a5503c8f
  if (!currentUser) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        ⏳ Loading sidebar...
      </div>
    );
  }

  const currentRole = currentUser.userprofile?.role || currentUser.role;
  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(currentRole));

  return (
    <Sidebar key={currentUser?.username} collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Engineering</span>
            <span className="truncate text-xs text-muted-foreground">Dashboard</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <Link href={item.url} className="flex items-center gap-2">
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="/placeholder-user.jpg" alt={currentUser.username} />
                    <AvatarFallback className="rounded-lg">
                      {currentUser.username?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{currentUser.username}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {currentUser.userprofile?.role || "Role tidak tersedia"}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src="/placeholder-user.jpg" alt={currentUser.username} />
                      <AvatarFallback className="rounded-lg">
                        {currentUser.username?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{currentUser.username}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {currentUser.userprofile?.role || "Role tidak tersedia"}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    localStorage.clear();
                    router.push("/login");
                  }}
                >
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
