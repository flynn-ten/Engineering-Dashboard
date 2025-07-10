"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, User, Wrench, Zap, FileText } from "lucide-react"

interface RoleIndicatorProps {
  currentRole: string
}

const rolePermissions = {
  admin: {
    name: "Administrator",
    description: "Full system access with all permissions",
    color: "destructive",
    icon: Shield,
    permissions: [
      "Dashboard Overview",
      "Work Orders Management",
      "Request Approval",
      "Energy Monitoring",
      "Analytics & Reports",
      "Compliance Management",
      "File Management",
      "User Administration",
    ],
  },
  engineer: {
    name: "Engineering Staff",
    description: "Work order management and technical documentation",
    color: "default",
    icon: Wrench,
    permissions: ["Dashboard Overview", "Work Orders Management", "File Access (Technical)", "Equipment Analytics"],
  },
  utility: {
    name: "Utility Team",
    description: "Energy monitoring and utility management",
    color: "outline",
    icon: Zap,
    permissions: ["Dashboard Overview", "Energy Data Input", "Energy Monitoring", "Utility Reports"],
  },
  division: {
    name: "Division User",
    description: "Request submission and status tracking",
    color: "outline",
    icon: User,
    permissions: ["Dashboard Overview", "Request Submission", "Request Status Tracking", "Basic File Access"],
  },
  qac: {
    name: "QAC/Compliance",
    description: "Compliance monitoring and quality assurance",
    color: "secondary",
    icon: FileText,
    permissions: [
      "Dashboard Overview",
      "CAPA Management",
      "SOP Tracking",
      "Compliance Reports",
      "Quality Documentation",
    ],
  },
}

export function RoleIndicator({ currentRole }: RoleIndicatorProps) {
  const role = rolePermissions[currentRole as keyof typeof rolePermissions]

  if (!role) return null

  const IconComponent = role.icon

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <IconComponent className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{role.name}</CardTitle>
              <Badge variant={role.color as any} className="text-xs">
                {currentRole.toUpperCase()}
              </Badge>
            </div>
            <CardDescription>{role.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Available Permissions:</p>
          <div className="flex flex-wrap gap-2">
            {role.permissions.map((permission, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {permission}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
