"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import {
  Users,
  UserPlus,
  Settings,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  MoreHorizontal,
  Search,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RegisterModal } from "@/components/modals/RegisterModal"
import { useState, useEffect } from "react";

export default function AdminPage() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [usersData, setUsersData] = useState<any[]>([]); // ✅ deklarasi di sini
  const activeUsers = usersData?.filter((user) => user.status === "Active").length || 0
  const totalUsers = usersData?.length || 0


  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800"
      case "Inactive":
        return "bg-red-100 text-red-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "destructive"
      case "Engineering Staff":
        return "default"
      case "QAC":
        return "secondary"
      case "Utility Team":
        return "outline"
      case "Division User":
        return "outline"
      default:
        return "outline"
    }
  }

useEffect(() => {
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      let res = await fetch("http://localhost:8000/api/users/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Kalau token expired, coba refresh token
      if (res.status === 401) {
        console.warn("Token expired. Trying to refresh...");

        const refreshToken = localStorage.getItem("refreshToken");
        const refreshRes = await fetch("http://localhost:8000/api/token/refresh/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (!refreshRes.ok) {
          console.error("Failed to refresh token, logging out...");
          localStorage.removeItem("access");
          localStorage.removeItem("refreshToken");
          window.location.replace("/login");
          throw new Error("Refresh token invalid, please login again");
        }

        const refreshData = await refreshRes.json();
        localStorage.setItem("access", refreshData.access);

        // Retry fetching users with the new token
        res = await fetch("http://localhost:8000/api/users/", {
          headers: {
            Authorization: `Bearer ${refreshData.access}`,
          },
        });
      }

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Fetch failed: ${res.status} - ${errorBody}`);
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setUsersData(data);
      } else {
        setUsersData([]);
        console.error("Expected array but got:", data);
      }
    } catch (err) {
      console.error("Final error fetching users:", err);
      setUsersData([]);  // Reset users data on error
      // Optionally show an error message to the user
      setError("Failed to load users.");
    }
  };

  fetchUsers();
}, []);



// Dummy data untuk audit trail
const auditData = [
  {
    id: "AUDIT-001",
    user: "Ahmad Teknisi",
    action: "Updated Work Order",
    resource: "WO-2024-001",
    timestamp: "2024-01-16 10:30:15",
    ipAddress: "192.168.1.100",
    details: "Changed status from Open to In Progress",
  },
  {
    id: "AUDIT-002",
    user: "Dedi Utility",
    action: "Input Energy Data",
    resource: "Energy-Listrik",
    timestamp: "2024-01-16 08:30:00",
    ipAddress: "192.168.1.105",
    details: "Added daily electricity consumption: 1600 kWh",
  },
  {
    id: "AUDIT-003",
    user: "Budi Manager",
    action: "Approved Request",
    resource: "REQ-2024-001",
    timestamp: "2024-01-15 15:45:30",
    ipAddress: "192.168.1.101",
    details: "Approved maintenance request for AC repair",
  },
  {
    id: "AUDIT-004",
    user: "Citra QAC",
    action: "Updated CAPA",
    resource: "CAPA-2024-001",
    timestamp: "2024-01-15 14:20:45",
    ipAddress: "192.168.1.103",
    details: "Updated completion rate to 65%",
  },
  {
    id: "AUDIT-005",
    user: "System",
    action: "File Upload",
    resource: "SOP-ENG-001",
    timestamp: "2024-01-15 11:15:20",
    ipAddress: "System",
    details: "New SOP file uploaded: Maintenance Preventif v2.1",
  },
]

// System settings
const systemSettings = {
  maintenanceMode: false,
  autoBackup: true,
  emailNotifications: true,
  dataRetention: "12 months",
  maxFileSize: "10 MB",
  sessionTimeout: "8 hours",
}



  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Kelola user, sistem, dan monitoring aktivitas</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600 border-green-600">
              System Healthy
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">{activeUsers} active users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeUsers}</div>
              <p className="text-xs text-muted-foreground">Currently online</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">100%</div>
              <p className="text-xs text-muted-foreground">All services running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">No active threats</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            {/* User Management Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Kelola user dan hak akses sistem</CardDescription>
                  </div>
                  <Button className="gap-2" onClick={() => setIsRegisterOpen(true)}>
                    <UserPlus className="h-4 w-4" />
                    Add New User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Cari user berdasarkan nama atau email..." className="pl-8" />
                    </div>
                  </div>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="engineer">Engineering Staff</SelectItem>
                      <SelectItem value="qac">QAC</SelectItem>
                      <SelectItem value="utility">Utility Team</SelectItem>
                      <SelectItem value="division">Division User</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Users List */}
            <div className="space-y-4">
              {usersData.map((user: any) => (
  <Card key={user.id}>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.full_name} />
            <AvatarFallback>
              {user.full_name
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{user.full_name}</h3>
              <Badge variant={getRoleColor(user.role)}>{user.role}</Badge>
              <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Division: {user.division}</span>
              <span>Joined: {new Date(user.date_joined).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

                      <div className="flex items-center gap-2">
                        <Switch checked={user.status === "Active"} />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <DropdownMenuItem>Edit User</DropdownMenuItem>
                            <DropdownMenuItem>Reset Password</DropdownMenuItem>
                            <DropdownMenuItem>View Permissions</DropdownMenuItem>
                            <DropdownMenuItem>Login History</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              {user.status === "Active" ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            {/* Audit Trail Header */}
            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>Log aktivitas dan perubahan sistem</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Cari aktivitas berdasarkan user atau action..." className="pl-8" />
                    </div>
                  </div>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Action Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="login">Login/Logout</SelectItem>
                      <SelectItem value="create">Create</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                      <SelectItem value="approve">Approve</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Time Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Audit Log */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditData.map((audit) => (
                    <div key={audit.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{audit.user}</span>
                          <span className="text-sm text-muted-foreground">{audit.action}</span>
                          <Badge variant="outline">{audit.resource}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{audit.details}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{audit.timestamp}</span>
                          <span>IP: {audit.ipAddress}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            {/* System Settings */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Konfigurasi umum sistem</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Maintenance Mode</p>
                      <p className="text-sm text-muted-foreground">Aktifkan untuk maintenance sistem</p>
                    </div>
                    <Switch checked={systemSettings.maintenanceMode} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto Backup</p>
                      <p className="text-sm text-muted-foreground">Backup otomatis setiap hari</p>
                    </div>
                    <Switch checked={systemSettings.autoBackup} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Kirim notifikasi via email</p>
                    </div>
                    <Switch checked={systemSettings.emailNotifications} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data & Security</CardTitle>
                  <CardDescription>Pengaturan keamanan dan data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Retention Period</label>
                    <Select defaultValue={systemSettings.dataRetention}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6 months">6 Months</SelectItem>
                        <SelectItem value="12 months">12 Months</SelectItem>
                        <SelectItem value="24 months">24 Months</SelectItem>
                        <SelectItem value="forever">Forever</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max File Upload Size</label>
                    <Select defaultValue={systemSettings.maxFileSize}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5 MB">5 MB</SelectItem>
                        <SelectItem value="10 MB">10 MB</SelectItem>
                        <SelectItem value="25 MB">25 MB</SelectItem>
                        <SelectItem value="50 MB">50 MB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Session Timeout</label>
                    <Select defaultValue={systemSettings.sessionTimeout}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2 hours">2 Hours</SelectItem>
                        <SelectItem value="4 hours">4 Hours</SelectItem>
                        <SelectItem value="8 hours">8 Hours</SelectItem>
                        <SelectItem value="24 hours">24 Hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                  <CardDescription>Informasi sistem dan versi</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Application Version</span>
                    <span className="text-sm font-medium">v1.2.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Database Version</span>
                    <span className="text-sm font-medium">PostgreSQL 14.2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Last Backup</span>
                    <span className="text-sm font-medium">2024-01-16 02:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Uptime</span>
                    <span className="text-sm font-medium">15 days, 8 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Storage Used</span>
                    <span className="text-sm font-medium">2.4 GB / 100 GB</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Aksi cepat untuk maintenance sistem</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Settings className="h-4 w-4 mr-2" />
                    Run System Diagnostics
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Activity className="h-4 w-4 mr-2" />
                    Generate System Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Shield className="h-4 w-4 mr-2" />
                    Security Scan
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-red-600 bg-transparent">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Clear All Logs
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        {isRegisterOpen && (
          <RegisterModal open={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
        )}
      </main>
    </div>
  )
}

function setError(arg0: string) {
  throw new Error("Function not implemented.")
}
