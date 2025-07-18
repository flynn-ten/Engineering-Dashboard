"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import {
  Plus,
  Search,
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Dummy data untuk Requests
const requests = [
  {
    id: "REQ-2024-001",
    title: "Perbaikan AC Ruang Meeting",
    description: "AC ruang meeting lantai 2 tidak dingin dan mengeluarkan suara bising",
    category: "MTC",
    priority: "High",
    status: "Approved",
    requester: "Divisi HR",
    requesterEmail: "hr@company.com",
    department: "Human Resources",
    location: "Lantai 2 - Ruang Meeting A",
    requestDate: "2024-01-15",
    approvalDate: "2024-01-15",
    approver: "Engineering Manager",
    estimatedCost: 2500000,
    urgency: "Urgent",
    workOrderId: "WO-2024-001",
  },
  {
    id: "REQ-2024-002",
    title: "Kalibrasi Timbangan Digital",
    description: "Timbangan digital di lab QC perlu dikalibrasi sesuai jadwal",
    category: "CAL",
    priority: "Medium",
    status: "Pending",
    requester: "Divisi QC",
    requesterEmail: "qc@company.com",
    department: "Quality Control",
    location: "Lab QC - Area Timbang",
    requestDate: "2024-01-14",
    approvalDate: null,
    approver: null,
    estimatedCost: 1500000,
    urgency: "Normal",
    workOrderId: null,
  },
  {
    id: "REQ-2024-003",
    title: "Penggantian Lampu Penerangan",
    description: "Beberapa lampu di area produksi mati dan perlu diganti",
    category: "UTY",
    priority: "Low",
    status: "Rejected",
    requester: "Divisi Produksi",
    requesterEmail: "produksi@company.com",
    department: "Production",
    location: "Area Produksi Line 1",
    requestDate: "2024-01-12",
    approvalDate: "2024-01-13",
    approver: "Engineering Manager",
    estimatedCost: 500000,
    urgency: "Normal",
    workOrderId: null,
    rejectionReason: "Budget tidak tersedia untuk bulan ini",
  },
  {
    id: "REQ-2024-004",
    title: "Maintenance Printer Network",
    description: "Printer network di area admin sering paper jam dan perlu maintenance",
    category: "MTC",
    priority: "Medium",
    status: "In Review",
    requester: "Divisi Admin",
    requesterEmail: "admin@company.com",
    department: "Administration",
    location: "Area Admin - Lantai 1",
    requestDate: "2024-01-13",
    approvalDate: null,
    approver: null,
    estimatedCost: 800000,
    urgency: "Normal",
    workOrderId: null,
  },
]

export default function RequestPage() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "In Review":
        return "bg-blue-100 text-blue-800"
      case "Approved":
        return "bg-green-100 text-green-800"
      case "Rejected":
        return "bg-red-100 text-red-800"
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
            <h1 className="text-lg font-semibold">Request Management</h1>
            <p className="text-sm text-muted-foreground">Kelola permintaan perbaikan dan maintenance</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Buat Request Baru
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{requests.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {requests.filter((req) => req.status === "Pending" || req.status === "In Review").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {requests.filter((req) => req.status === "Approved").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {requests.filter((req) => req.status === "Rejected").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">Daftar Request</TabsTrigger>
            <TabsTrigger value="create">Buat Request Baru</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
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
                      <Input placeholder="Cari request berdasarkan ID, judul, atau deskripsi..." className="pl-8" />
                    </div>
                  </div>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="review">In Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
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
                </div>
              </CardContent>
            </Card>

            {/* Request List */}
            <div className="space-y-4">
              {requests.map((req) => (
                <Card key={req.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{req.title}</h3>
                          <Badge variant="outline">{req.id}</Badge>
                          <Badge className={getCategoryColor(req.category)}>{req.category}</Badge>
                          <Badge variant={getPriorityColor(req.priority)}>{req.priority}</Badge>
                          <Badge className={getStatusColor(req.status)}>{req.status}</Badge>
                        </div>

                        <p className="text-sm text-muted-foreground">{req.description}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>Requester: {req.requester}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Date: {req.requestDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            <span>Urgency: {req.urgency}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Cost: Rp {req.estimatedCost.toLocaleString()}</span>
                          </div>
                        </div>

                        {req.status === "Approved" && req.workOrderId && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Work Order Created: {req.workOrderId}</span>
                          </div>
                        )}

                        {req.status === "Rejected" && req.rejectionReason && (
                          <div className="flex items-center gap-2 text-sm text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span>Rejection Reason: {req.rejectionReason}</span>
                          </div>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Request</DropdownMenuItem>
                          {req.status === "Pending" && (
                            <>
                              <DropdownMenuItem className="text-green-600">Approve</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">Reject</DropdownMenuItem>
                            </>
                          )}
                          {req.status === "Approved" && !req.workOrderId && (
                            <DropdownMenuItem className="text-blue-600">Create Work Order</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Buat Request Baru</CardTitle>
                <CardDescription>
                  Isi form di bawah untuk mengajukan permintaan perbaikan atau maintenance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Judul Request *</Label>
                    <Input id="title" placeholder="Masukkan judul request..." />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mtc">MTC (Maintenance)</SelectItem>
                        <SelectItem value="cal">CAL (Calibration)</SelectItem>
                        <SelectItem value="uty">UTY (Utility)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioritas *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih prioritas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="urgency">Tingkat Urgensi *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tingkat urgensi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Departemen *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih departemen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="qc">Quality Control</SelectItem>
                        <SelectItem value="hr">Human Resources</SelectItem>
                        <SelectItem value="admin">Administration</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Lokasi *</Label>
                    <Input id="location" placeholder="Contoh: Lantai 2 - Ruang Meeting A" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimatedCost">Estimasi Biaya (Rp)</Label>
                    <Input id="estimatedCost" type="number" placeholder="0" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requesterEmail">Email Requester *</Label>
                    <Input id="requesterEmail" type="email" placeholder="email@company.com" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi Detail *</Label>
                  <Textarea
                    id="description"
                    placeholder="Jelaskan secara detail masalah yang dihadapi, gejala yang terlihat, dan tindakan yang diharapkan..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Button variant="outline">Reset Form</Button>
                  <Button>Submit Request</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
