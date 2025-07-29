"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  UserPlus,
  Activity,
  Shield,
  CheckCircle,
  MoreHorizontal,
  Search,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RegisterModal } from "@/components/modals/RegisterModal"
import { useState, useEffect } from "react";

// Define auditData outside the component to avoid duplicate declarations
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
];

export default function AdminPage() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [auditTimeFilter, setAuditTimeFilter] = useState('all');

  // Filter users based on search and filters
  const filteredUsers = usersData.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = 
      roleFilter === 'all' || 
      user.role?.toLowerCase().includes(roleFilter.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' ||
      user.status?.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeUsers = usersData?.filter((user) => user.status === "Active").length || 0;
  const totalUsers = usersData?.length || 0;

  // Filter audit data
  const filteredAuditData = auditData.filter(audit => {
    const matchesSearch = 
      audit.user.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
      audit.action.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
      audit.details.toLowerCase().includes(auditSearchTerm.toLowerCase());
    
    const matchesAction = 
      auditActionFilter === 'all' || 
      audit.action.toLowerCase().includes(auditActionFilter.toLowerCase());
    
    const matchesTime = auditTimeFilter === 'all';
    
    return matchesSearch && matchesAction && matchesTime;
  });

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
  switch (role.toLowerCase()) {
    case "admin":
      return "destructive"; // Merah
    case "engineering staff":
    case "engineer":
      return "default";     // Biru default
    case "qac":
      return "secondary";   // Abu-abu
    case "utility team":
    case "utility":
      return "outline";    // Outline biru
    case "division user":
    case "requester":
      return "outline";    // Outline biru
    default:
      return "outline";
  }
};

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No access token");
    }

    let res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    // If token expired, try to refresh
    if (res.status === 401) {
      const refreshToken = localStorage.getItem("refreshToken");
      const refreshRes = await fetch("http://localhost:8000/api/token/refresh/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!refreshRes.ok) {
        throw new Error("Failed to refresh token");
      }

      const data = await refreshRes.json();
      localStorage.setItem("accessToken", data.access);
      
      res = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${data.access}`,
        },
      });
    }

    return res;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};
  const resetUserPassword = async (id: number, newPassword: string) => {
    const access = localStorage.getItem("accessToken")

    try {
      const res = await fetch(`http://localhost:8000/api/users/${id}/reset-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify({ new_password: newPassword }),
      })

      if (res.ok) {
        alert("Password reset successfully!")
      } else {
        const errorData = await res.json();
        console.error("Reset failed:", errorData);
        alert("Failed to reset password: " + (errorData.error || "Unknown error"))
      }
    } catch (error) {
      console.error("Error resetting password:", error)
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
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            window.location.replace("/login");
            throw new Error("Refresh token invalid, please login again");
          }

          const refreshData = await refreshRes.json();
          localStorage.setItem("accessToken", refreshData.access);

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
        setUsersData([]);
      }
    };
    
    fetchUsers();
  }, []);

  const [isUpdating, setIsUpdating] = useState(false);

const toggleUserStatus = async (userId: number, currentStatus: string) => {
  if (!confirm(`Are you sure you want to ${currentStatus === "Active" ? "deactivate" : "activate"} this user?`)) {
    return;
  }

  setIsUpdating(true);
  try {
    const res = await fetchWithAuth(`http://localhost:8000/api/users/${userId}/status/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        status: currentStatus === "Active" ? "Inactive" : "Active" 
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to update status");
    }

    const data = await res.json();

    // Update state lokal
    setUsersData(prevUsers => 
      prevUsers.map(user => 
        user.id === userId ? { 
          ...user, 
          status: data.status,
          is_active: data.is_active 
        } : user
      )
    );

    alert(`User status updated to ${data.status}`);
  } catch (error) {
    console.error("Update error:", error);
    alert(error.message || "Failed to update user status");
  } finally {
    setIsUpdating(false);
  }
};

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
                      <Input 
                        placeholder="Cari user berdasarkan nama atau email..." 
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="engineer">Engineering Staff</SelectItem>
                      <SelectItem value="qac">QAC</SelectItem>
                      <SelectItem value="utility">Utility Team</SelectItem>
                      <SelectItem value="requester">Division User</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
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
              {filteredUsers.map((user: any) => (
                <Card key={user.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.full_name} />
                          <AvatarFallback>
                            {user.full_name
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{user.full_name}</h3>
                            <Badge variant={getRoleColor(user.role)}>{user.role}</Badge>
                            <Badge className={user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
  {user.is_active ? "Active" : "Inactive"}
</Badge>

                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Division: {user.division}</span>
                            <span>Joined: {new Date(user.date_joined).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              const newPass = window.prompt("Enter new password for this user:");
                              if (newPass) resetUserPassword(user.id, newPass);
                            }}>
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem
      className={user.status === "Active" ? "text-red-600" : "text-green-600"}
      onClick={() => toggleUserStatus(user.id, user.status)}
      disabled={isUpdating}
    >
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
                      <Input 
                        placeholder="Cari aktivitas berdasarkan user atau action..." 
                        className="pl-8"
                        value={auditSearchTerm}
                        onChange={(e) => setAuditSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Select value={auditActionFilter} onValueChange={setAuditActionFilter}>
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
                  <Select value={auditTimeFilter} onValueChange={setAuditTimeFilter}>
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
                  {filteredAuditData.map((audit) => (
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
        </Tabs>
        {isRegisterOpen && (
          <RegisterModal open={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
        )}
      </main>
    </div>
  );
}