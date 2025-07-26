// WorkRequestPage.tsx - Full Version with HandleForm, Submit, Reset
"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Clock, CheckCircle, XCircle, AlertCircle, Search, User, MoreHorizontal } from "lucide-react";
import { CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";


type UserProfile = {
  role: string;
  division: string;
  full_name: string;
  avatar?: string;
  status: string;
};



type CurrentUserType = {
  id: number;
  username: string;
  email?: string;
  userprofile: UserProfile;
};

type WorkRequest = {
  wr_number: number;
  title: string;
  wo_description: string;
  wr_type: string;
  wr_requestor: {
    id: number;
    username: string;
    email?: string;
  };
  wr_request_by_date: string;
  year: number;
  month: number;
  week_of_month: number;
  resource: "MTC" | "CAL" | "UTY";
  asset_number: string;
  asset_department: "EN" | "GA" | "PD" | "QA" | "QC" | "RD" | "WH";
  urgency: string;
  status: string;
  created_at?: string;
  updated_at?: string;

  // Tambahkan baris ini
  rejectionReason?: string;
  workOrderId?: number;
};


type Asset = {
  id: string;
  name: string;
  description: string;
};


const WorkRequestPage = () => {
  const [role, setRole] = useState(null);
  const [currentUser, setCurrentUser] = useState<CurrentUserType | null>(null);
  const [filteredWorkRequests, setFilteredWorkRequests] = useState<WorkRequest[]>([]);
  
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    wo_description: '',
    asset_department: '',
    asset_number: '',
    wr_type: 'Perbaikan',
    resource: '',
    urgency: 'Normal',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const assetsData = {
    EN: [
      { id: 'EN001', name: 'Boiler Unit 1', description: 'Steam boiler' },
      { id: 'EN002', name: 'Generator Set', description: 'Emergency power' },
    ],
    GA: [
      { id: 'GA001', name: 'AC Unit Central', description: 'Air conditioning' },
    ],
  };

  useEffect(() => {
    const checkUserAuth = async () => {
      try {
        const userJson = localStorage.getItem("user");
        if (!userJson) return;
        const user = JSON.parse(userJson);
        setCurrentUser(user);
        setRole(user.userprofile?.role);
        fetchWorkRequests();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    checkUserAuth();
  }, []);

  
  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const [categoryFilter, setCategoryFilter] = useState<string>('all');

const handleDepartmentChange = (value: string) => {
  setFormData((prev) => ({
    ...prev,
    asset_department: value,
    asset_number: "",
  }));
  const newAssets = assetsData[value as keyof typeof assetsData] || [];
  setAvailableAssets(newAssets);
};


  const resetForm = () => {
    setFormData({
      title: '',
      wo_description: '',
      asset_department: '',
      asset_number: '',
      wr_type: 'Perbaikan',
      resource: '',
      urgency: 'Normal',
    });
    setAvailableAssets([]);
  };

  const generateWRNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000) + 1;
    return parseInt(`${year}${random.toString().padStart(3, '0')}`);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.wo_description || !formData.asset_department || !formData.asset_number || !formData.resource) {
      alert("Harap lengkapi semua field.");
      return;
    }
    setSubmitting(true);
    try {
      const userJson = localStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      const now = new Date();
      const payload = {
        wr_number: generateWRNumber(),
        title: formData.title,
        wo_description: formData.wo_description,
        wr_type: formData.wr_type,
        wr_requestor: user.id,
        wr_request_by_date: now.toISOString().split("T")[0],
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        week_of_month: Math.ceil(now.getDate() / 7),
        resource: formData.resource,
        asset_number: formData.asset_number,
        asset_department: formData.asset_department,
        urgency: formData.urgency,
        status: "Pending",
      };
      const res = await fetch(`http://localhost:8000/api/work-requests/create/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert("Request berhasil dibuat!");
        resetForm();
        fetchWorkRequests();
      } else {
        const err = await res.json();
        alert(err.detail || "Gagal membuat request");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  };

  

  const fetchWorkRequests = async () => {
  const token = localStorage.getItem("accessToken");
  console.log("🔐 Access Token:", token); // 👈 DEBUG

  try {
    setLoading(true);
    const res = await fetch(`http://localhost:8000/api/work-requests/create/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.error("❌ Fetch error:", res.status);
    }

    const data = await res.json();
    setFilteredWorkRequests(data);
  } catch (err) {
    console.error("❗Error:", err);
    setFilteredWorkRequests([]);
  } finally {
    setLoading(false);
  }
};


  const displayedRequests = Array.isArray(filteredWorkRequests)
  ? filteredWorkRequests.filter((req) => {
      if (role === "admin") return true;
      return req.wr_requestor.id === currentUser?.id;
    })
  : [];
  

  const getStatusColor = (status: string) => {
  switch (status) {
    case "Pending":
      return "bg-yellow-100 text-yellow-800";
    case "In Review":
      return "bg-blue-100 text-blue-800";
    case "Approved":
      return "bg-green-100 text-green-800";
    case "Rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getCategoryColor = (resource: string) => {
  switch (resource) {
    case "MTC":
      return "bg-purple-100 text-purple-800";
    case "CAL":
      return "bg-orange-100 text-orange-800";
    case "UTY":
      return "bg-cyan-100 text-cyan-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const handleViewDetails = (request: WorkRequest) => {
  console.log("Detail request:", request);
  // bisa kamu ganti show modal/detail section
};


  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-6 w-6 mr-2" />Loading...</div>;


  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Request Management</h1>
            <p className="text-sm text-muted-foreground">Kelola permintaan perbaikan dan maintenance</p>
          </div>
          {currentUser && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{currentUser.userprofile?.full_name || currentUser.username}</p>
                <p className="text-xs text-muted-foreground">
                  {currentUser.userprofile?.division} - {currentUser.userprofile?.role}
                </p>
              </div>
              {currentUser.userprofile?.avatar && (
                <img 
                  src={currentUser.userprofile.avatar} 
                  alt="Avatar" 
                  className="h-8 w-8 rounded-full"
                />
              )}
            </div>
          )}
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
              <div className="text-2xl font-bold">{filteredWorkRequests.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {filteredWorkRequests.filter((req) => req.status === "Pending" || req.status === "In Review").length}
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
                {filteredWorkRequests.filter((req) => req.status === "Approved").length}
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
                {filteredWorkRequests.filter((req) => req.status === "Rejected").length}
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
                      <Input 
                        placeholder="Cari request berdasarkan ID, judul, atau deskripsi..." 
                        className="pl-8" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
              {displayedRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">Tidak ada work request yang ditemukan.</p>
                  </CardContent>
                </Card>
              ) : (
                displayedRequests.map((req) => (
                  <Card key={req.wr_number}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-lg font-semibold">{req.title}</h3>
                            <Badge variant="outline">{req.wr_number}</Badge>
                            <Badge className={getCategoryColor(req.resource)}>{req.resource}</Badge>
                            <Badge className={getStatusColor(req.status)}>{req.status}</Badge>
                          </div>

                          <p className="text-sm text-muted-foreground">{req.wo_description}</p>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>Requester: {req.wr_requestor.username}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>Date: {req.wr_request_by_date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-muted-foreground" />
                              <span>Urgency: {req.urgency}</span>
                            </div>
                          </div>

                          {req.status === "Approved" && req.workOrderId && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span>Work Order Created: {req.wr_request_by_date}</span>
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
                            <DropdownMenuItem onClick={() => handleViewDetails(req)}>View Details</DropdownMenuItem>
                            {req.status === "Pending" && (
                              <DropdownMenuItem>Edit Request</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
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
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Judul Request *</Label>
                    <Input 
                      id="title" 
                      placeholder="Masukkan judul request..." 
                      value={formData.title}
                      onChange={(e) => handleFormChange('title', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Request Description/Deskripsi Detail *</Label>
                    <Textarea
                      id="description"
                      placeholder="Jelaskan secara detail masalah yang dihadapi, gejala yang terlihat, dan tindakan yang diharapkan..."
                      rows={4}
                      value={formData.wo_description}
                      onChange={(e) => handleFormChange('wo_description', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wrType">Jenis Request *</Label>
                    <Select value={formData.wr_type} onValueChange={(value) => handleFormChange('wr_type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis request" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Perbaikan">Perbaikan</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Kalibrasi">Kalibrasi</SelectItem>
                        <SelectItem value="Instalasi">Instalasi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resource">Resource Category *</Label>
                    <Select value={formData.resource} onValueChange={(value) => handleFormChange('resource', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori resource" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MTC">MTC - Maintenance</SelectItem>
                        <SelectItem value="CAL">CAL - Calibration</SelectItem>
                        <SelectItem value="UTY">UTY - Utility</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assetDepartment">Asset Department *</Label>
                    <Select value={formData.asset_department} onValueChange={handleDepartmentChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih department asset" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EN">EN - Engineering</SelectItem>
                        <SelectItem value="GA">GA - General Affairs</SelectItem>
                        <SelectItem value="PD">PD - Production</SelectItem>
                        <SelectItem value="QA">QA - Quality Assurance</SelectItem>
                        <SelectItem value="QC">QC - Quality Control</SelectItem>
                        <SelectItem value="RD">RD - Research & Development</SelectItem>
                        <SelectItem value="WH">WH - Warehouse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assetNumber">Nomor Asset *</Label>
                    <Select 
                      value={formData.asset_number} 
                      onValueChange={(value) => handleFormChange('asset_number', value)} 
                      disabled={!formData.asset_department}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={formData.asset_department ? "Pilih nomor asset" : "Pilih department terlebih dahulu"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAssets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.id} - {asset.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.asset_number && (
                      <p className="text-sm text-muted-foreground">
                        {availableAssets.find((asset) => asset.id === formData.asset_number)?.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="urgency">Tingkat Urgency</Label>
                    <Select value={formData.urgency} onValueChange={(value) => handleFormChange('urgency', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tingkat urgency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Reset Form
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Request'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default WorkRequestPage;

function fetchWorkRequests() {
  throw new Error("Function not implemented.");
}
