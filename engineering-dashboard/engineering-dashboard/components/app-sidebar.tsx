"use client"
import { useState } from "react"
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
} from "lucide-react"

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
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Menu items berdasarkan role
const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    roles: ["admin", "engineer", "utility", "division", "qac"],
  },
  {
    title: "Work Orders",
    url: "/wo",
    icon: Wrench,
    roles: ["admin", "engineer"],
    badge: "12",
  },
  {
    title: "Requests",
    url: "/request",
    icon: ClipboardList,
    roles: ["admin", "division"],
    badge: "5",
  },
  {
    title: "Energy Monitor",
    url: "/energy",
    icon: Zap,
    roles: ["admin", "utility"],
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
    roles: ["admin"],
  },
  {
    title: "Compliance",
    url: "/compliance",
    icon: Shield,
    roles: ["admin", "qac"],
    badge: "3",
  },
  {
    title: "Files",
    url: "/files",
    icon: FileText,
    roles: ["admin", "engineer", "utility", "division", "qac"],
  },
  {
    title: "Admin",
    url: "/admin",
    icon: Settings,
    roles: ["admin"],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [currentUser, setCurrentUser] = useState({
    role: "admin",
    name: "Admin User",
    email: "admin@company.com",
    avatar: "AD",
  })

  // Tambahkan data users yang tersedia
  const availableUsers = [
    { role: "admin", name: "Admin User", email: "admin@company.com", avatar: "AD" },
    { role: "engineer", name: "Ahmad Teknisi", email: "ahmad@company.com", avatar: "AT" },
    { role: "utility", name: "Dedi Utility", email: "dedi@company.com", avatar: "DU" },
    { role: "division", name: "Eko Produksi", email: "eko@company.com", avatar: "EP" },
    { role: "qac", name: "Citra QAC", email: "citra@company.com", avatar: "CQ" },
  ]

  const currentRole = currentUser.role

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(currentRole))

  return (
    <Sidebar collapsible="icon">
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
                    <AvatarImage src="/placeholder-user.jpg" alt={currentUser.name} />
                    <AvatarFallback className="rounded-lg">{currentUser.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{currentUser.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{currentUser.email}</span>
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
                      <AvatarImage src="/placeholder-user.jpg" alt={currentUser.name} />
                      <AvatarFallback className="rounded-lg">{currentUser.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{currentUser.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{currentUser.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Switch User</DropdownMenuLabel>
                {availableUsers.map((user) => (
                  <DropdownMenuItem
                    key={user.role}
                    onClick={() => setCurrentUser(user)}
                    className={currentUser.role === user.role ? "bg-accent" : ""}
                  >
                    <Avatar className="h-6 w-6 rounded-lg mr-2">
                      <AvatarImage src="/placeholder-user.jpg" alt={user.name} />
                      <AvatarFallback className="rounded-lg text-xs">{user.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <span>Account Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
