"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, User, Settings, LogOut } from "lucide-react"

const availableUsers = [
  {
    role: "admin",
    name: "Admin User",
    email: "admin@company.com",
    avatar: "AD",
    department: "Engineering",
    permissions: "Full Access",
  },
  {
    role: "engineer",
    name: "Ahmad Teknisi",
    email: "ahmad@company.com",
    avatar: "AT",
    department: "Engineering",
    permissions: "WO Management",
  },
  {
    role: "utility",
    name: "Dedi Utility",
    email: "dedi@company.com",
    avatar: "DU",
    department: "Utility",
    permissions: "Energy Monitoring",
  },
  {
    role: "division",
    name: "Eko Produksi",
    email: "eko@company.com",
    avatar: "EP",
    department: "Production",
    permissions: "Request Only",
  },
  {
    role: "qac",
    name: "Citra QAC",
    email: "citra@company.com",
    avatar: "CQ",
    department: "Quality Control",
    permissions: "Compliance",
  },
]

export function UserSwitcher() {
  const [currentUser, setCurrentUser] = useState(availableUsers[0])

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "engineer":
        return "default"
      case "qac":
        return "secondary"
      case "utility":
        return "outline"
      case "division":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-auto px-3 justify-start">
          <Avatar className="h-8 w-8 mr-3">
            <AvatarImage src="/placeholder-user.jpg" alt={currentUser.name} />
            <AvatarFallback>{currentUser.avatar}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">{currentUser.name}</span>
            <span className="text-xs text-muted-foreground capitalize">{currentUser.role}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/placeholder-user.jpg" alt={currentUser.name} />
                <AvatarFallback>{currentUser.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                <p className="text-xs leading-none text-muted-foreground mt-1">{currentUser.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getRoleBadgeColor(currentUser.role)} className="text-xs">
                {currentUser.role.toUpperCase()}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {currentUser.department} • {currentUser.permissions}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Switch User (Demo Mode)
        </DropdownMenuLabel>
        {availableUsers.map((user) => (
          <DropdownMenuItem
            key={user.role}
            onClick={() => setCurrentUser(user)}
            className={`cursor-pointer ${currentUser.role === user.role ? "bg-accent" : ""}`}
          >
            <Avatar className="h-8 w-8 mr-3">
              <AvatarImage src="/placeholder-user.jpg" alt={user.name} />
              <AvatarFallback>{user.avatar}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1">
              <span className="text-sm font-medium">{user.name}</span>
              <div className="flex items-center gap-2">
                <Badge variant={getRoleBadgeColor(user.role)} className="text-xs">
                  {user.role.toUpperCase()}
                </Badge>
                <span className="text-xs text-muted-foreground">{user.department}</span>
              </div>
            </div>
            {currentUser.role === user.role && <div className="w-2 h-2 bg-green-500 rounded-full ml-2" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profile Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Account Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
