"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Clock, CheckCircle, XCircle, AlertCircle, Calendar, User, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

type Asset = {
  id: string;
  name: string;
  description: string;
};

export default function WorkRequestPage() {
  const [role, setRole] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('');
  const [filteredWorkRequests, setFilteredWorkRequests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    asset_number: '',
    asset_department: '',
    resource: '',
    urgency: '',
    wr_type: '',
    failure_code: '',
    failure_cause: '',
    resolution: '',
    actual_failure_date: '',
  });

  const displayedRequests = filteredWorkRequests.filter((req) => {
    const matchRole = role === "admin" || req.wr_requestor.id === currentUser?.id;
    const matchSearch = searchTerm === '' || req.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || req.status.toLowerCase() === statusFilter.toLowerCase();
    const matchCategory = categoryFilter === 'all' || req.resource.toLowerCase() === categoryFilter.toLowerCase();
    return matchRole && matchSearch && matchStatus && matchCategory;
  });

  const assetsData = {
    EN: [
      { id: 'EN001', name: 'Boiler Unit 1', description: 'Steam boiler' },
      { id: 'EN002', name: 'Generator Set', description: 'Emergency power' },
    ],
    GA: [
      { id: 'GA001', name: 'AC Unit Central', description: 'Air conditioning' },
    ],
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
    handleFormChange("asset_department", value);
    setAvailableAssets(assetsData[value as keyof typeof assetsData] || []);
    setSelectedAsset('');
  };

  const handleAssetChange = (value: string) => {
    setSelectedAsset(value);
    handleFormChange("asset_number", value);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      asset_number: '',
      asset_department: '',
      resource: '',
      urgency: '',
      wr_type: '',
      failure_code: '',
      failure_cause: '',
      resolution: '',
      actual_failure_date: '',
    });
    setSelectedAsset('');
    setSelectedDepartment('');
    setAvailableAssets([]);
  };

  const refreshAccessToken = async (): Promise<string> => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) throw new Error("Refresh token not found");

    const res = await fetch("http://localhost:8000/api/token/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    const data = await res.json();
    if (res.ok && data.access) {
      localStorage.setItem("accessToken", data.access);
      return data.access;
    } else {
      throw new Error("Refresh token invalid or expired");
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.asset_number || !formData.asset_department) {
      alert("🛑 Mohon lengkapi semua field wajib!");
      return;
    }

    const payload = {
      ...formData,
      wr_number: generateWRNumber(),
    };

    let token = localStorage.getItem("accessToken");

    const sendRequest = async (usedToken: string) => {
      return await fetch("http://localhost:8000/api/work-requests/create/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${usedToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    };

    try {
      setSubmitting(true);
      let res = await sendRequest(token!);
      if (res.status === 401) {
        token = await refreshAccessToken();
        res = await sendRequest(token);
      }
      const data = await res.json();
      if (res.ok) {
        alert("✅ Request berhasil dibuat!");
        resetForm();
      } else {
        alert(data.detail || "❌ Gagal membuat request");
      }
    } catch (err) {
      console.error("🔥 Error submitting:", err);
      alert("Terjadi kesalahan saat submit.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (!userJson) return;
    const user = JSON.parse(userJson);
    setCurrentUser(user);
    setRole(user.userprofile?.role);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-6 w-6 mr-2" /> Loading...
      </div>
    );
  }


  function getCategoryColor(resource: string): string {
  switch (resource.toLowerCase()) {
    case "personnel":
      return "bg-blue-100 text-blue-800";
    case "material":
      return "bg-yellow-100 text-yellow-800";
    case "tooling":
      return "bg-purple-100 text-purple-800";
    case "other":
      return "bg-gray-200 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}


  function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "in review":
      return "bg-blue-100 text-blue-800";
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}


  function handleViewDetails(req: any): void {
  alert(`📄 Detail Work Request\n\nWR Number: ${req.wr_number}\nJudul: ${req.title}\nDeskripsi: ${req.description}`);
}


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
                <div className="flex gap-4 mb-4">
  <Input
    placeholder="Cari berdasarkan judul..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-1/2"
  />
  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
    <SelectTrigger className="w-1/4">
      <SelectValue placeholder="Filter Status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Semua</SelectItem>
      <SelectItem value="pending">Pending</SelectItem>
      <SelectItem value="approved">Approved</SelectItem>
      <SelectItem value="rejected">Rejected</SelectItem>
      <SelectItem value="in_review">In Review</SelectItem>
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
        {/* Judul Request */}
        <div className="space-y-2">
          <Label htmlFor="title">Judul Request *</Label>
          <Input id="title" placeholder="Masukkan judul request..." />
        </div>

        {/* Deskripsi */}
        <div className="space-y-2">
          <Label htmlFor="description">Request Description/Deskripsi Detail *</Label>
          <Textarea
            id="description"
            placeholder="Jelaskan secara detail masalah yang dihadapi, gejala yang terlihat, dan tindakan yang diharapkan..."
            rows={4}
          />
        </div>

        {/* Department */}
        <div className="space-y-2">
          <Label htmlFor="assetDepartment">Asset Department *</Label>
          <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
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

        {/* Asset Number */}
        <div className="space-y-2">
          <Label htmlFor="assetNumber">Nomor Asset *</Label>
          <Select value={selectedAsset} onValueChange={setSelectedAsset} disabled={!selectedDepartment}>
            <SelectTrigger>
              <SelectValue
                placeholder={selectedDepartment ? "Pilih nomor asset" : "Pilih department terlebih dahulu"}
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
          {selectedAsset && (
            <p className="text-sm text-muted-foreground">
              {availableAssets.find((asset) => asset.id === selectedAsset)?.description}
            </p>
          )}
        </div>

        {/* Resource */}
        <div className="space-y-2">
          <Label htmlFor="resource">Resource Dibutuhkan *</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Pilih resource yang dibutuhkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personnel">Tenaga Kerja / Teknisi</SelectItem>
              <SelectItem value="material">Material / Spare Part</SelectItem>
              <SelectItem value="tooling">Peralatan / Tools</SelectItem>
              <SelectItem value="other">Lainnya</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Urgency */}
        <div className="space-y-2">
          <Label htmlFor="urgency">Tingkat Urgensi *</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Pilih tingkat urgensi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Work Request Type */}
        <div className="space-y-2">
          <Label htmlFor="wr_type">Tipe Permintaan *</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Pilih jenis permintaan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="repair">Repair</SelectItem>
              <SelectItem value="inspection">Inspection</SelectItem>
              <SelectItem value="corrective">Corrective</SelectItem>
              <SelectItem value="modification">Modification</SelectItem>
              <SelectItem value="routine">Routine Check</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Failure Code */}
        <div className="space-y-2">
          <Label htmlFor="failureCode">Failure Code (Opsional)</Label>
          <Input id="failureCode" placeholder="Kode kerusakan jika diketahui..." />
        </div>

        {/* Failure Cause */}
        <div className="space-y-2">
          <Label htmlFor="failureCause">Penyebab Kerusakan (Opsional)</Label>
          <Textarea id="failureCause" placeholder="Tuliskan penyebab kerusakan jika diketahui..." />
        </div>

        {/* Resolution */}
        <div className="space-y-2">
          <Label htmlFor="resolution">Solusi yang Diharapkan (Opsional)</Label>
          <Textarea id="resolution" placeholder="Saran solusi atau tindakan jika ada..." />
        </div>

        {/* Actual Failure Date */}
        <div className="space-y-2">
          <Label htmlFor="actualFailureDate">Tanggal Kejadian (Opsional)</Label>
          <Input id="actualFailureDate" type="date" />
        </div>
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
  );

  function generateWRNumber() {
    throw new Error("Function not implemented.");
  }
};
