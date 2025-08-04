"use client"


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Upload, Search, MoreHorizontal, Eye, Folder, Calendar, User, Filter } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import supabase from "@/lib/supabase"
import { ChangeEvent, useEffect, useState } from "react"
import { formatDate } from "date-fns"
import { useRef } from "react";
// Assume these utility functions exist


interface Document {
  id: string;
  file_name: string;
  category: string;
  department: string;
  version: string;
  description: string;
  uploaded_at: string;
  uploaded_by_name: string;
  file_url: string;
}


const categories = [
  { name: "SOP", color: "bg-blue-100 text-blue-800" },
  { name: "Work Instruction", color: "bg-green-100 text-green-800" },
  { name: "Manual", color: "bg-purple-100 text-purple-800" },
  { name: "Form", color: "bg-orange-100 text-orange-800" },
  { name: "Specification", color: "bg-cyan-100 text-cyan-800" },
] as const;


const departments = [
  "Engineering",
  "Quality",
  "Utility",
  "Safety",
  "Production"
] as const;


const MAX_FILE_SIZE_MB = 10;




export default function FilesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filesData, setFilesData] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
 
  const [formData, setFormData] = useState({
    file_name: "",
    category: "",
    department: "",
    version: "",
    description: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");


  const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refresh");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }


    const res = await fetch("http://localhost:8000/api/token/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });


    if (!res.ok) {
      throw new Error("Failed to refresh token");
    }


    const data = await res.json();
    localStorage.setItem("accessToken", data.access);
    return data.access;
  } catch (error) {
    console.error("Token refresh failed:", error);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refresh");
    router.push("/login");  // fallback
    return null;
  }
};




  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    try {
      let token = localStorage.getItem("accessToken");
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
        const newToken = await refreshAccessToken();
        if (!newToken) {
          throw new Error("Failed to refresh token");
        }
        res = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
          },
        });
      }


      return res;
    } catch (error) {
      console.error("Fetch error:", error);
      throw error;
    }
  };


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetchWithAuth("http://localhost:8000/api/me/");
        const userData = await res.json();
        const role = userData.userprofile?.role || userData.role || "user";
        setCurrentRole(role);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        router.push("/login");
      }
    };


    const fetchFiles = async () => {
      try {
        const res = await fetchWithAuth("http://localhost:8000/api/documents/");
        const data = await res.json();
        setFilesData(data);
      } catch (error) {
        console.error("Failed to fetch files:", error);
      } finally {
        setLoading(false);
      }
    };


    fetchUserData();
    fetchFiles();
  }, [router]);


  const getCategoryColor = (category: string): string => {
    const foundCategory = categories.find(c => c.name === category);
    return foundCategory ? foundCategory.color : "bg-gray-100 text-gray-800";
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;


    // Validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`);
      return;
    }


    setSelectedFile(file);
    setFormData(prev => ({ ...prev, file_name: file.name }));
  };


  const handleDelete = async (documentId: string, file_url: string) => {
  if (!confirm("Are you sure you want to delete this document?")) return;


  try {
    const res = await fetchWithAuth(`http://localhost:8000/api/documents/${documentId}/`, {
      method: "DELETE"
    });


    if (res.ok) {
      // Refresh files list after deletion
      const filesRes = await fetchWithAuth("http://localhost:8000/api/documents/");
      const filesData = await filesRes.json();
      setFilesData(filesData);
      alert("Document deleted successfully");
    } else {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to delete document");
    }
  } catch (error) {
    console.error("Delete error:", error);
    alert(error.message || "Failed to delete document. Please try again.");
  }
};
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please choose a file");
      return;
    }


    setUploading(true);
    try {
      const filePath = `${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("sop")
        .upload(filePath, selectedFile);


      if (uploadError) throw uploadError;


      const { data: publicUrlData } = supabase.storage
        .from("sop")
        .getPublicUrl(filePath);


      const res = await fetchWithAuth("http://localhost:8000/api/documents/upload/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          file_url: publicUrlData.publicUrl,
          size: selectedFile.size,
        }),
      });


      if (!res.ok) throw new Error("Failed to upload metadata");


      // Refresh files list
      const filesRes = await fetchWithAuth("http://localhost:8000/api/documents/");
      const filesData = await filesRes.json();
      setFilesData(filesData);
     
      // Reset form
      setFormData({
        file_name: "",
        category: "",
        department: "",
        version: "",
        description: "",
      });
      setSelectedFile(null);
     
      alert("File uploaded successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };


  const filteredFiles = filesData.filter(file => {
    const matchesSearch = file.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || file.category === selectedCategory;
    const matchesDepartment = selectedDepartment === "all" || file.department === selectedDepartment;
   
    return matchesSearch && matchesCategory && matchesDepartment;
  });


  if (currentRole === null) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }


  function formatFileSize(sizeInBytes: number): React.ReactNode {
  if (sizeInBytes === 0) return "0 Bytes";


  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
  const size = sizeInBytes / Math.pow(1024, i);


  return `${size.toFixed(2)} ${units[i]}`;
}




  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">File Management</h1>
            <p className="text-sm text-muted-foreground">Manage SOPs, manuals, and technical documents</p>
          </div>
        </div>
      </header>


      <main className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filesData.length}</div>
            </CardContent>
          </Card>


          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <Folder className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatFileSize(filesData.reduce((acc, file) => acc + (file.size || 0), 0))}
              </div>
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


        <Tabs defaultValue="files" className="space-y-4">
          <TabsList>
            <TabsTrigger value="files">All Files</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            {currentRole === "admin" && (
              <TabsTrigger value="upload">Upload New</TabsTrigger>
            )}
          </TabsList>


          <TabsContent value="files" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Filter & Search</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search files by name or description..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.name} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>


            <div className="space-y-4">
              {loading ? (
                <p className="text-muted-foreground">Loading files...</p>
              ) : filteredFiles.length === 0 ? (
                <p className="text-muted-foreground">No files found matching your criteria</p>
              ) : (
                filteredFiles.map((file) => (
                  <Card key={file.id}>
  <CardContent className="p-6">
    <div className="flex items-start justify-between">
      <div className="space-y-3 flex-1">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">{file.file_name}</h3>
          <Badge className={getCategoryColor(file.category)}>
            {file.category}
          </Badge>
          {file.version && (
            <Badge variant="outline">{file.version}</Badge>
          )}
        </div>


        {file.description && (
          <p className="text-sm text-muted-foreground">{file.description}</p>
        )}


        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>By: {file.uploaded_by_name || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Uploaded: {formatDate(new Date(file.uploaded_at), "dd MMM yyyy")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-muted-foreground" />
            <span>Size: {formatFileSize(file.size || 0)}</span>
          </div>
        </div>


        <div className="flex items-center gap-4 mt-2">
          <Button
            size="sm"
            className="gap-2"
            onClick={() => window.open(file.file_url, '_blank')}
          >
            <Eye className="h-4 w-4" />
            View
          </Button>
        </div>
      </div>


      {currentRole === "admin" && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => handleDelete(file.id, file.file_url)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  </CardContent>
</Card>


                ))
              )}
            </div>
          </TabsContent>


          <TabsContent value="categories" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
                const fileCount = filesData.filter((file) => file.category === category.name).length;


                return (
                  <Card key={category.name}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{category.name}</span>
                        <Badge className={category.color}>{fileCount}</Badge>
                      </CardTitle>
                      <CardDescription>
                        {fileCount} file{fileCount !== 1 ? "s" : ""} in this category
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
                              <span className="truncate">{file.file_name}</span>
                            </div>
                          ))}
                        {fileCount > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{fileCount - 3} more file{fileCount - 3 > 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                      <Button size="sm" variant="outline" className="w-full mt-4">
                        View All {category.name}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>


          {currentRole === "admin" && (
            <TabsContent value="upload" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upload New File</CardTitle>
                  <CardDescription>Upload SOPs, manuals, or technical documents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">Drag & drop files here</p>
                    <p className="text-sm text-muted-foreground mb-4">or click to browse</p>


                   
<div className="flex justify-center">
  <input
    ref={fileInputRef}
    type="file"
    accept=".pdf,.doc,.docx"
    onChange={handleFileChange}
    className="hidden"
  />
  <Button
    type="button"
    onClick={() => fileInputRef.current?.click()}
    className="cursor-pointer"
  >
    Choose File
  </Button>
</div>


                    {selectedFile && (
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground">
                          Selected: <span className="font-medium">{selectedFile.name}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Size: {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    )}


                    <p className="text-xs text-muted-foreground mt-2">
                      Supported: PDF, DOC, DOCX (Max {MAX_FILE_SIZE_MB}MB)
                    </p>
                  </div>


                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>File Name</Label>
                        <Input
                          value={formData.file_name}
                          onChange={(e) => setFormData({...formData, file_name: e.target.value})}
                          placeholder="Enter file name..."
                          required
                        />
                      </div>


                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({...formData, category: value})}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category.name} value={category.name}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>


                      <div className="space-y-2">
                        <Label>Department</Label>
                        <Select
                          value={formData.department}
                          onValueChange={(value) => setFormData({...formData, department: value})}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map(dept => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>


                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Version</Label>
                        <Input
                          value={formData.version}
                          onChange={(e) => setFormData({...formData, version: e.target.value})}
                          placeholder="e.g., v1.0"
                        />
                      </div>


                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Brief description of the file..."
                        />
                      </div>
                    </div>
                  </div>


                  <div className="flex justify-end gap-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFormData({
                          file_name: "",
                          category: "",
                          department: "",
                          version: "",
                          description: "",
                        });
                        setSelectedFile(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleUpload} disabled={uploading}>
  {uploading ? "Uploading..." : "Upload File"}
</Button>


                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}



