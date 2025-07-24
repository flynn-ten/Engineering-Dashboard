"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Upload, Search, Filter, MoreHorizontal, Eye, Folder, Calendar, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Dummy data untuk files
const filesData = [
  {
    id: "FILE-001",
    name: "SOP Maintenance Preventif v2.1.pdf",
    category: "SOP",
    type: "PDF",
    size: "2.4 MB",
    uploadDate: "2024-01-15",
    uploadedBy: "Engineering Manager",
    department: "Engineering",
    version: "v2.1",
    status: "Active",
    downloads: 45,
    lastAccessed: "2024-01-16",
    description: "Standard Operating Procedure untuk maintenance preventif semua equipment",
  },
  {
    id: "FILE-002",
    name: "Work Instruction Kalibrasi Timbangan.pdf",
    category: "Work Instruction",
    type: "PDF",
    size: "1.8 MB",
    uploadDate: "2024-01-12",
    uploadedBy: "QAC Manager",
    department: "Quality",
    version: "v1.5",
    status: "Active",
    downloads: 23,
    lastAccessed: "2024-01-14",
    description: "Instruksi kerja detail untuk kalibrasi timbangan digital",
  },
  {
    id: "FILE-003",
    name: "Manual Equipment Pompa Air.pdf",
    category: "Manual",
    type: "PDF",
    size: "5.2 MB",
    uploadDate: "2024-01-10",
    uploadedBy: "Maintenance Supervisor",
    department: "Engineering",
    version: "v1.0",
    status: "Active",
    downloads: 12,
    lastAccessed: "2024-01-15",
    description: "Manual operasi dan maintenance untuk pompa air utama",
  },
  {
    id: "FILE-004",
    name: "Form Checklist Inspeksi Harian.pdf",
    category: "Form",
    type: "PDF",
    size: "0.8 MB",
    uploadDate: "2024-01-08",
    uploadedBy: "Utility Supervisor",
    department: "Utility",
    version: "v2.0",
    status: "Active",
    downloads: 67,
    lastAccessed: "2024-01-16",
    description: "Form checklist untuk inspeksi harian equipment utility",
  },
  {
    id: "FILE-005",
    name: "Prosedur Keselamatan Kerja v3.0.pdf",
    category: "SOP",
    type: "PDF",
    size: "3.1 MB",
    uploadDate: "2024-01-05",
    uploadedBy: "Safety Officer",
    department: "Safety",
    version: "v3.0",
    status: "Draft",
    downloads: 8,
    lastAccessed: "2024-01-12",
    description: "Prosedur keselamatan kerja terbaru dengan update regulasi",
  },
  {
    id: "FILE-006",
    name: "Spesifikasi Teknis Generator.pdf",
    category: "Specification",
    type: "PDF",
    size: "4.7 MB",
    uploadDate: "2024-01-03",
    uploadedBy: "Engineering Staff",
    department: "Engineering",
    version: "v1.2",
    status: "Active",
    downloads: 19,
    lastAccessed: "2024-01-11",
    description: "Spesifikasi teknis dan diagram generator backup",
  },
]

const categories = [
  { name: "SOP", count: 2, color: "bg-blue-100 text-blue-800" },
  { name: "Work Instruction", count: 1, color: "bg-green-100 text-green-800" },
  { name: "Manual", count: 1, color: "bg-purple-100 text-purple-800" },
  { name: "Form", count: 1, color: "bg-orange-100 text-orange-800" },
  { name: "Specification", count: 1, color: "bg-cyan-100 text-cyan-800" },
]

export default function FilesPage() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800"
      case "Draft":
        return "bg-yellow-100 text-yellow-800"
      case "Archived":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryColor = (category: string) => {
    const cat = categories.find((c) => c.name === category)
    return cat ? cat.color : "bg-gray-100 text-gray-800"
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">File Management</h1>
            <p className="text-sm text-muted-foreground">Kelola dokumen SOP, manual, dan file teknis</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filesData.length}</div>
              <p className="text-xs text-muted-foreground">
                {filesData.filter((f) => f.status === "Active").length} active files
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <Folder className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18.0 MB</div>
              <p className="text-xs text-muted-foreground">of 1 GB available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">Document types</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="files" className="space-y-4">
          <TabsList>
            <TabsTrigger value="files">All Files</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="space-y-4">
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
                      <Input placeholder="Cari file berdasarkan nama atau deskripsi..." className="pl-8" />
                    </div>
                  </div>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      <SelectItem value="sop">SOP</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="form">Form</SelectItem>
                      <SelectItem value="specification">Specification</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Department</SelectItem>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="quality">Quality</SelectItem>
                      <SelectItem value="utility">Utility</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Files List */}
            <div className="space-y-4">
              {filesData.map((file) => (
                <Card key={file.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <h3 className="text-lg font-semibold">{file.name}</h3>
                          <Badge className={getCategoryColor(file.category)}>{file.category}</Badge>
                          <Badge variant="outline">{file.version}</Badge>
                          <Badge className={getStatusColor(file.status)}>{file.status}</Badge>
                        </div>

                        <p className="text-sm text-muted-foreground">{file.description}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>By: {file.uploadedBy}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Uploaded: {file.uploadDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Size: {file.size}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <Button size="sm" className="gap-2">
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
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
                          <DropdownMenuItem>Edit Metadata</DropdownMenuItem>
                          <DropdownMenuItem>Version History</DropdownMenuItem>
                          <DropdownMenuItem>Share Link</DropdownMenuItem>
                          <DropdownMenuItem>Move to Archive</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Card key={category.name}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{category.name}</span>
                      <Badge className={category.color}>{category.count}</Badge>
                    </CardTitle>
                    <CardDescription>
                      {category.count} file{category.count !== 1 ? "s" : ""} in this category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {filesData
                        .filter((file) => file.category === category.name)
                        .slice(0, 3)
                        .map((file) => (
                          <div key={file.id} className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{file.name}</span>
                          </div>
                        ))}
                      {filesData.filter((file) => file.category === category.name).length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{filesData.filter((file) => file.category === category.name).length - 3} more files
                        </p>
                      )}
                    </div>
                    <Button size="sm" variant="outline" className="w-full mt-4 bg-transparent">
                      View All {category.name}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload File Baru</CardTitle>
                <CardDescription>Upload dokumen SOP, manual, atau file teknis lainnya</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Drag & drop files here</p>
                  <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                  <Button>Choose Files</Button>
                  <p className="text-xs text-muted-foreground mt-2">Supported formats: PDF, DOC, DOCX (Max 10MB)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">File Name</label>
                      <Input placeholder="Enter file name..." />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sop">SOP</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="form">Form</SelectItem>
                          <SelectItem value="specification">Specification</SelectItem>
                          <SelectItem value="instruction">Work Instruction</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Department</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="engineering">Engineering</SelectItem>
                          <SelectItem value="quality">Quality</SelectItem>
                          <SelectItem value="utility">Utility</SelectItem>
                          <SelectItem value="safety">Safety</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Version</label>
                      <Input placeholder="e.g., v1.0" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Input placeholder="Brief description of the file..." />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button variant="outline">Cancel</Button>
                  <Button>Upload File</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
