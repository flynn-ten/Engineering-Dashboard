"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Shield, FileText, AlertTriangle, CheckCircle, Clock, Calendar, Search, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Dummy data untuk CAPA
const capaData = [
  {
    id: "CAPA-2024-001",
    title: "Perbaikan Sistem Kalibrasi Timbangan",
    description: "Implementasi prosedur kalibrasi yang lebih akurat untuk timbangan digital",
    category: "Corrective Action",
    priority: "High",
    status: "In Progress",
    assignee: "QAC Team",
    dueDate: "2024-01-20",
    createdDate: "2024-01-10",
    completionRate: 65,
    isOverdue: false,
    rootCause: "Prosedur kalibrasi tidak mengikuti standar ISO terbaru",
    actions: [
      { task: "Review prosedur existing", status: "Completed" },
      { task: "Update prosedur sesuai ISO", status: "In Progress" },
      { task: "Training teknisi", status: "Pending" },
      { task: "Implementasi prosedur baru", status: "Pending" },
    ],
  },
  {
    id: "CAPA-2024-002",
    title: "Pencegahan Kontaminasi Area Produksi",
    description: "Implementasi kontrol tambahan untuk mencegah kontaminasi silang",
    category: "Preventive Action",
    priority: "Medium",
    status: "Overdue",
    assignee: "Production Team",
    dueDate: "2024-01-15",
    createdDate: "2024-01-05",
    completionRate: 30,
    isOverdue: true,
    rootCause: "Kurangnya kontrol akses dan prosedur sanitasi",
    actions: [
      { task: "Analisis risiko kontaminasi", status: "Completed" },
      { task: "Desain kontrol tambahan", status: "In Progress" },
      { task: "Instalasi equipment", status: "Pending" },
      { task: "Validasi sistem", status: "Pending" },
    ],
  },
  {
    id: "CAPA-2024-003",
    title: "Peningkatan Sistem Dokumentasi",
    description: "Digitalisasi sistem dokumentasi untuk meningkatkan traceability",
    category: "Corrective Action",
    priority: "Low",
    status: "Completed",
    assignee: "QAC Team",
    dueDate: "2024-01-12",
    createdDate: "2024-01-01",
    completionRate: 100,
    isOverdue: false,
    rootCause: "Sistem dokumentasi manual rentan terhadap kesalahan",
    actions: [
      { task: "Evaluasi sistem existing", status: "Completed" },
      { task: "Pilih platform digital", status: "Completed" },
      { task: "Migrasi data", status: "Completed" },
      { task: "Training user", status: "Completed" },
    ],
  },
]

// Dummy data untuk SOP
const sopData = [
  {
    id: "SOP-ENG-001",
    title: "Prosedur Maintenance Preventif",
    version: "v2.1",
    status: "Active",
    category: "Engineering",
    lastReview: "2024-01-01",
    nextReview: "2024-07-01",
    owner: "Engineering Manager",
    isOverdue: false,
    daysUntilReview: 165,
  },
  {
    id: "SOP-QAC-002",
    title: "Prosedur Kalibrasi Equipment",
    version: "v1.8",
    status: "Under Review",
    category: "Quality",
    lastReview: "2023-12-15",
    nextReview: "2024-01-15",
    owner: "QAC Manager",
    isOverdue: true,
    daysUntilReview: -2,
  },
  {
    id: "SOP-UTY-003",
    title: "Prosedur Monitoring Energi",
    version: "v1.2",
    status: "Active",
    category: "Utility",
    lastReview: "2023-11-01",
    nextReview: "2024-05-01",
    owner: "Utility Supervisor",
    isOverdue: false,
    daysUntilReview: 105,
  },
  {
    id: "SOP-SAF-004",
    title: "Prosedur Keselamatan Kerja",
    version: "v3.0",
    status: "Draft",
    category: "Safety",
    lastReview: "2023-12-01",
    nextReview: "2024-06-01",
    owner: "Safety Officer",
    isOverdue: false,
    daysUntilReview: 135,
  },
]

export default function CompliancePage() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Overdue":
        return "bg-red-100 text-red-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Active":
        return "bg-green-100 text-green-800"
      case "Under Review":
        return "bg-yellow-100 text-yellow-800"
      case "Draft":
        return "bg-gray-100 text-gray-800"
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

  const overdueCapa = capaData.filter((item) => item.isOverdue).length
  const overdueSop = sopData.filter((item) => item.isOverdue).length

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Compliance Management</h1>
            <p className="text-sm text-muted-foreground">Monitor CAPA dan SOP untuk memastikan compliance</p>
          </div>
          <div className="flex items-center gap-2">
            {(overdueCapa > 0 || overdueSop > 0) && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {overdueCapa + overdueSop} Overdue
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total CAPA</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{capaData.length}</div>
              <p className="text-xs text-muted-foreground">
                {capaData.filter((c) => c.status === "Completed").length} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CAPA Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdueCapa}</div>
              <p className="text-xs text-muted-foreground">Perlu tindakan segera</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active SOP</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sopData.filter((s) => s.status === "Active").length}</div>
              <p className="text-xs text-muted-foreground">dari {sopData.length} total SOP</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SOP Review Due</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{overdueSop}</div>
              <p className="text-xs text-muted-foreground">Perlu review segera</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="capa" className="space-y-4">
          <TabsList>
            <TabsTrigger value="capa">CAPA Management</TabsTrigger>
            <TabsTrigger value="sop">SOP Tracker</TabsTrigger>
          </TabsList>

          <TabsContent value="capa" className="space-y-4">
            {/* CAPA Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filter CAPA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Cari CAPA berdasarkan ID atau judul..." className="pl-8" />
                    </div>
                  </div>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="progress">In Progress</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      <SelectItem value="corrective">Corrective Action</SelectItem>
                      <SelectItem value="preventive">Preventive Action</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* CAPA List */}
            <div className="space-y-4">
              {capaData.map((capa) => (
                <Card key={capa.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{capa.title}</h3>
                          <Badge variant="outline">{capa.id}</Badge>
                          <Badge variant={getPriorityColor(capa.priority)}>{capa.priority}</Badge>
                          <Badge className={getStatusColor(capa.status)}>{capa.status}</Badge>
                          {capa.isOverdue && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Overdue
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground">{capa.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Assignee: </span>
                            <span className="font-medium">{capa.assignee}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Due Date: </span>
                            <span className={`font-medium ${capa.isOverdue ? "text-red-600" : ""}`}>
                              {capa.dueDate}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Category: </span>
                            <span className="font-medium">{capa.category}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Progress</span>
                            <span className="text-sm text-muted-foreground">{capa.completionRate}%</span>
                          </div>
                          <Progress value={capa.completionRate} className="h-2" />
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium">Root Cause:</p>
                          <p className="text-sm text-muted-foreground">{capa.rootCause}</p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium">Action Items:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {capa.actions.map((action, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                {action.status === "Completed" ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : action.status === "In Progress" ? (
                                  <Clock className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                                )}
                                <span
                                  className={action.status === "Completed" ? "line-through text-muted-foreground" : ""}
                                >
                                  {action.task}
                                </span>
                              </div>
                            ))}
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
                          <DropdownMenuItem>Edit CAPA</DropdownMenuItem>
                          <DropdownMenuItem>Update Progress</DropdownMenuItem>
                          <DropdownMenuItem>Add Comment</DropdownMenuItem>
                          {capa.status !== "Completed" && (
                            <DropdownMenuItem className="text-green-600">Mark Complete</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sop" className="space-y-4">
            {/* SOP Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filter SOP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Cari SOP berdasarkan ID atau judul..." className="pl-8" />
                    </div>
                  </div>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="review">Under Review</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="quality">Quality</SelectItem>
                      <SelectItem value="utility">Utility</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* SOP List */}
            <div className="space-y-4">
              {sopData.map((sop) => (
                <Card key={sop.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{sop.title}</h3>
                          <Badge variant="outline">{sop.id}</Badge>
                          <Badge variant="outline">{sop.version}</Badge>
                          <Badge className={getStatusColor(sop.status)}>{sop.status}</Badge>
                          {sop.isOverdue && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Review Overdue
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Category: </span>
                            <span className="font-medium">{sop.category}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Owner: </span>
                            <span className="font-medium">{sop.owner}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Review: </span>
                            <span className="font-medium">{sop.lastReview}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Next Review: </span>
                            <span className={`font-medium ${sop.isOverdue ? "text-red-600" : ""}`}>
                              {sop.nextReview}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {sop.isOverdue ? (
                                <span className="text-red-600">Overdue by {Math.abs(sop.daysUntilReview)} days</span>
                              ) : (
                                <span className="text-muted-foreground">{sop.daysUntilReview} days until review</span>
                              )}
                            </span>
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
                          <DropdownMenuItem>View SOP</DropdownMenuItem>
                          <DropdownMenuItem>Download PDF</DropdownMenuItem>
                          <DropdownMenuItem>Edit SOP</DropdownMenuItem>
                          <DropdownMenuItem>Version History</DropdownMenuItem>
                          {sop.status === "Active" && (
                            <DropdownMenuItem className="text-blue-600">Start Review</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
