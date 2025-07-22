"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Calendar, Clock, User, Wrench, AlertCircle, CheckCircle, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Dummy data untuk Work Orders
const workOrders = [
  {
    id: "WO-2024-001",
    title: "Perbaikan Pompa Air Utama",
    description: "Pompa air utama mengalami kebocoran dan perlu perbaikan segera",
    category: "MTC",
    type: "Unplanned",
    priority: "High",
    status: "In Progress",
    assignee: "Ahmad Teknisi",
    requester: "Divisi Produksi",
    createdDate: "2024-01-15",
    dueDate: "2024-01-17",
    completedDate: null,
    estimatedHours: 8,
    actualHours: 6,
  },
  {
    id: "WO-2024-002",
    title: "Maintenance AC Unit 3",
    description: "Maintenance rutin AC unit 3 sesuai jadwal preventif",
    category: "MTC",
    type: "Preventive",
    priority: "Medium",
    status: "Open",
    assignee: "Budi Teknisi",
    requester: "Engineering",
    createdDate: "2024-01-14",
    dueDate: "2024-01-20",
    completedDate: null,
    estimatedHours: 4,
    actualHours: 0,
  },
  {
    id: "WO-2024-003",
    title: "Kalibrasi Sensor Suhu",
    description: "Kalibrasi sensor suhu ruang produksi sesuai standar ISO",
    category: "CAL",
    type: "Preventive",
    priority: "Low",
    status: "Completed",
    assignee: "Citra Teknisi",
    requester: "QAC",
    createdDate: "2024-01-10",
    dueDate: "2024-01-15",
    completedDate: "2024-01-14",
    estimatedHours: 2,
    actualHours: 1.5,
  },
  {
    id: "WO-2024-004",
    title: "Penggantian Filter HVAC",
    description: "Penggantian filter HVAC area clean room",
    category: "UTY",
    type: "Preventive",
    priority: "Medium",
    status: "Open",
    assignee: "Dedi Teknisi",
    requester: "Divisi QC",
    createdDate: "2024-01-12",
    dueDate: "2024-01-18",
    completedDate: null,
    estimatedHours: 3,
    actualHours: 0,
  },
  {
    id: "WO-2024-005",
    title: "Inspeksi Kelistrikan Panel",
    description: "Inspeksi rutin panel listrik utama dan backup",
    category: "UTY",
    type: "Predictive",
    priority: "High",
    status: "In Progress",
    assignee: "Eko Teknisi",
    requester: "Engineering",
    createdDate: "2024-01-13",
    dueDate: "2024-01-16",
    completedDate: null,
    estimatedHours: 6,
    actualHours: 4,
  },
]

export default function WorkOrdersPage() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-800"
      case "In Progress":
        return "bg-yellow-100 text-yellow-800"
      case "Completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "destructive"
      case "Medium":
        return "default"
      case "Low":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "MTC":
        return "bg-purple-100 text-purple-800"
      case "CAL":
        return "bg-orange-100 text-orange-800"
      case "UTY":
        return "bg-cyan-100 text-cyan-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Work Orders Management</h1>
            <p className="text-sm text-muted-foreground">Kelola dan pantau semua work orders</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total WO</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workOrders.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {workOrders.filter((wo) => wo.status === "Open").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {workOrders.filter((wo) => wo.status === "In Progress").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {workOrders.filter((wo) => wo.status === "Completed").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter & Pencarian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Cari WO berdasarkan ID, judul, atau deskripsi..." className="pl-8" />
                </div>
              </div>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  <SelectItem value="mtc">MTC</SelectItem>
                  <SelectItem value="cal">CAL</SelectItem>
                  <SelectItem value="uty">UTY</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Prioritas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Prioritas</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Work Orders Tabs */}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {workOrders.map((wo) => (
              <Card key={wo.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{wo.title}</h3>
                        <Badge variant="outline">{wo.id}</Badge>
                        <Badge className={getCategoryColor(wo.category)}>{wo.category}</Badge>
                        <Badge variant={getPriorityColor(wo.priority)}>{wo.priority}</Badge>
                        <Badge className={getStatusColor(wo.status)}>{wo.status}</Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">{wo.description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>Assignee: {wo.assignee}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Due: {wo.dueDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Est: {wo.estimatedHours}h</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-muted-foreground" />
                          <span>Type: {wo.type}</span>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit WO</DropdownMenuItem>
                        <DropdownMenuItem>Update Status</DropdownMenuItem>
                        <DropdownMenuItem>Add Comment</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Close WO</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="kanban" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Open Column */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                    Open ({workOrders.filter((wo) => wo.status === "Open").length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {workOrders
                    .filter((wo) => wo.status === "Open")
                    .map((wo) => (
                      <Card key={wo.id} className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {wo.id}
                            </Badge>
                            <Badge variant={getPriorityColor(wo.priority)} className="text-xs">
                              {wo.priority}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-sm">{wo.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{wo.assignee}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Due: {wo.dueDate}</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                </CardContent>
              </Card>

              {/* In Progress Column */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    In Progress ({workOrders.filter((wo) => wo.status === "In Progress").length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {workOrders
                    .filter((wo) => wo.status === "In Progress")
                    .map((wo) => (
                      <Card key={wo.id} className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {wo.id}
                            </Badge>
                            <Badge variant={getPriorityColor(wo.priority)} className="text-xs">
                              {wo.priority}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-sm">{wo.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{wo.assignee}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {wo.actualHours}h / {wo.estimatedHours}h
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                </CardContent>
              </Card>

              {/* Completed Column */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Completed ({workOrders.filter((wo) => wo.status === "Completed").length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {workOrders
                    .filter((wo) => wo.status === "Completed")
                    .map((wo) => (
                      <Card key={wo.id} className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {wo.id}
                            </Badge>
                            <Badge className="bg-green-100 text-green-800 text-xs">Done</Badge>
                          </div>
                          <h4 className="font-medium text-sm">{wo.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{wo.assignee}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle className="h-3 w-3" />
                            <span>Completed: {wo.completedDate}</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
