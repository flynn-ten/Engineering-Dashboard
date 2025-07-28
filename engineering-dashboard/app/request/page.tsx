"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import React, { useEffect, useState } from "react";

const WorkRequestPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [wr_number, setWr_number] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [wr_type, setWr_type] = useState("");
  const [wr_requestor, setWr_requestor] = useState("");
  const [wr_request_by_id, setWr_request_by_id] = useState("");
  const [status, setStatus] = useState("");
  const [year, setYear] = useState(null);
  const [month, setMonth] = useState(null);
  const [week_of_month, setWeek_of_month] = useState<number | null>(null);
  const [resource, setResource] = useState("");
  const [workRequests, setWorkRequests] = useState<any[]>([]);
  const [filteredWorkRequests, setFilteredWorkRequests] = useState<any[]>([]);

  // Form state for creating new work requests
  const [form, setForm] = useState({
  title: "",
  description: "",
  asset_department: "",
  asset_number: "",
  actual_failure_date: "",
  completion_by_date: "",
  urgency: "medium",       // ✅ default value biar gak error
  wr_type: "repair",       // ✅ default value biar gak error
});
  const formatDateToYYYYMMDD = (date: string | Date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
};


  const totalCount = filteredWorkRequests.length;
  const pendingCount = filteredWorkRequests.filter((req) => req.status === "pending").length;
  const approvedCount = filteredWorkRequests.filter((req) => req.status === "approved").length;
  const rejectedCount = filteredWorkRequests.filter((req) => req.status === "rejected").length;
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [availableAssets, setAvailableAssets] = useState([]);

  const assetsByDepartment = {
    EN: [
      { id: "EN-001", name: "Generator Utama", description: "Generator 500KVA" },
      { id: "EN-002", name: "Pompa Air Utama", description: "Pompa Centrifugal 100HP" },
      { id: "EN-003", name: "Kompresor Udara", description: "Kompresor Screw 75HP" },
      { id: "EN-004", name: "Panel Listrik Utama", description: "Panel MDP 2000A" },
      { id: "EN-005", name: "Cooling Tower", description: "Cooling Tower 200RT" },
    ],
    GA: [
      { id: "GA-001", name: "AC Central Lobby", description: "AC VRV 20PK" },
      { id: "GA-002", name: "Lift Penumpang", description: "Lift 8 Orang" },
      { id: "GA-003", name: "CCTV System", description: "CCTV 32 Channel" },
      { id: "GA-004", name: "Fire Alarm Panel", description: "Fire Alarm Addressable" },
      { id: "GA-005", name: "Access Control", description: "Card Reader System" },
    ],
    PD: [
      { id: "PD-001", name: "Mesin Produksi Line 1", description: "Injection Molding 250T" },
      { id: "PD-002", name: "Conveyor Belt A", description: "Belt Conveyor 50m" },
      { id: "PD-003", name: "Robot Welding", description: "Welding Robot 6-Axis" },
      { id: "PD-004", name: "Oven Curing", description: "Industrial Oven 200°C" },
      { id: "PD-005", name: "Packaging Machine", description: "Auto Packaging Line" },
    ],
    QA: [
      { id: "QA-001", name: "CMM Machine", description: "Coordinate Measuring Machine" },
      { id: "QA-002", name: "Hardness Tester", description: "Rockwell Hardness Tester" },
      { id: "QA-003", name: "Surface Roughness", description: "Surface Roughness Tester" },
      { id: "QA-004", name: "Optical Comparator", description: "Profile Projector 300mm" },
    ],
    QC: [
      { id: "QC-001", name: "Timbangan Digital", description: "Digital Scale 0.1mg" },
      { id: "QC-002", name: "pH Meter", description: "Digital pH Meter" },
      { id: "QC-003", name: "Spektrofotometer", description: "UV-Vis Spectrophotometer" },
      { id: "QC-004", name: "Mikroskop", description: "Digital Microscope 1000x" },
      { id: "QC-005", name: "Oven Lab", description: "Laboratory Oven 300°C" },
    ],
    RD: [
      { id: "RD-001", name: "3D Printer", description: "Industrial 3D Printer" },
      { id: "RD-002", name: "CAD Workstation", description: "High-End CAD Computer" },
      { id: "RD-003", name: "Testing Equipment", description: "Material Testing Machine" },
      { id: "RD-004", name: "Prototype Tools", description: "CNC Prototype Machine" },
    ],
    WH: [
      { id: "WH-001", name: "Forklift Electric", description: "Electric Forklift 3T" },
      { id: "WH-002", name: "Crane Overhead", description: "Overhead Crane 5T" },
      { id: "WH-003", name: "Pallet Jack", description: "Manual Pallet Jack 2.5T" },
      { id: "WH-004", name: "Conveyor System", description: "Warehouse Conveyor" },
      { id: "WH-005", name: "Barcode Scanner", description: "Wireless Barcode Scanner" },
    ],
  }

  // Asset Group options
  const assetGroups = [
    { value: "mechanical", label: "Mechanical Equipment" },
    { value: "electrical", label: "Electrical Equipment" },
    { value: "instrumentation", label: "Instrumentation & Control" },
    { value: "building", label: "Building & Infrastructure" },
    { value: "safety", label: "Safety Equipment" },
    { value: "utility", label: "Utility Systems" },
    { value: "transport", label: "Transportation Equipment" },
    { value: "it", label: "IT Equipment" },
  ];

  // Asset Area options
  const assetAreas = [
    { value: "production_floor", label: "Production Floor" },
    { value: "warehouse", label: "Warehouse" },
    { value: "office_area", label: "Office Area" },
    { value: "utility_room", label: "Utility Room" },
    { value: "laboratory", label: "Laboratory" },
    { value: "outdoor", label: "Outdoor Area" },
    { value: "parking", label: "Parking Area" },
    { value: "canteen", label: "Canteen" },
    { value: "security_post", label: "Security Post" },
  ];

  // Asset Activity options
  const assetActivities = [
    { value: "production", label: "Production Process" },
    { value: "quality_control", label: "Quality Control" },
    { value: "material_handling", label: "Material Handling" },
    { value: "maintenance", label: "Maintenance Support" },
    { value: "hvac", label: "HVAC System" },
    { value: "power_distribution", label: "Power Distribution" },
    { value: "water_treatment", label: "Water Treatment" },
    { value: "waste_management", label: "Waste Management" },
    { value: "security", label: "Security System" },
    { value: "communication", label: "Communication System" },
  ];

  // Parent Asset options (simplified - in real app this would be dynamic based on hierarchy)
  const parentAssets = [
    { value: "main_production_line", label: "Main Production Line" },
    { value: "power_system", label: "Main Power System" },
    { value: "water_system", label: "Water System" },
    { value: "hvac_system", label: "HVAC System" },
    { value: "building_structure", label: "Building Structure" },
    { value: "safety_system", label: "Safety System" },
    { value: "it_infrastructure", label: "IT Infrastructure" },
    { value: "waste_treatment", label: "Waste Treatment System" },
  ];

  // Form handlers
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDepartmentChange = (val) => {
    setSelectedDepartment(val);
    setAvailableAssets(assetsByDepartment[val] || []);
    setForm((prev) => ({ ...prev, asset_department: val, asset_number: "" }));
  };

  // Format currency for Indonesian Rupiah
  const formatCurrency = (value) => {
    if (!value) return "";
    const numericValue = value.replace(/[^\d]/g, "");
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(numericValue);
  };

  const handleCostChange = (e) => {
    const rawValue = e.target.value.replace(/[^\d]/g, "");
    setForm((prev) => ({ ...prev, cost: rawValue }));
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      asset_department: "",
      asset_number: "",
      urgency: "",
      wr_type: "",
      actual_failure_date: "",
      completion_by_date: "",
    });
    setSelectedDepartment("");
    setAvailableAssets([]);
  };

  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    const res = await fetch("http://localhost:8000/api/token/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (!res.ok) throw new Error("Refresh token expired or invalid");
    const data = await res.json();
    localStorage.setItem("accessToken", data.access);
    return data.access;
  };

  const handleSubmit = async () => {
  try {
    let token = localStorage.getItem("accessToken");

    const preparedForm = {
      ...form,
      actual_failure_date: formatDateToYYYYMMDD(form.actual_failure_date) || null,
      completion_by_date: formatDateToYYYYMMDD(form.completion_by_date) || null,
    };


    console.log("🔍 Data to be submitted:", preparedForm);

    let response = await fetch("http://localhost:8000/api/work-request/create/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(preparedForm), // ⬅️ pakai data yang sudah diformat
    });

    if (response.status === 401) {
      console.warn("Access token expired. Attempting refresh...");
      token = await refreshAccessToken();
      response = await fetch("http://localhost:8000/api/work-request/create/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(preparedForm),
      });
    }

    if (!response.ok) {
      const err = await response.json();
      console.error("❌ Submit failed:", err);
      alert("❌ Failed to submit work request. Check console for details.");
      return;
    }

    alert("✅ Work request submitted successfully!");
    resetForm();
    fetchWorkRequests();
  } catch (error) {
    console.error("💥 Error during submit:", error);
    alert("An error occurred while submitting the request.");
  }
};


  // Fetching data from API
  const fetchWorkRequests = () => {
  const token = localStorage.getItem("accessToken");

  fetch("http://localhost:8000/api/work-request/", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("✅ fetched data:", data);

      if (Array.isArray(data)) {
        setWorkRequests(data);
        setIsLoading(false);

        if (data.length > 0) {
          const latestData = data[0];
          setWr_number(latestData.wr_number);
          setTitle(latestData.title);
          setWr_request_by_id(latestData.wr_request_by_id);
          setWr_type(latestData.wr_type);
          setResource(latestData.resource);
          setDescription(latestData.description);
          setStatus(latestData.status);
          setYear(latestData.year);
          setMonth(latestData.month);
          setWeek_of_month(latestData.week_of_month);
        }
      } else {
        console.warn("❌ data is not array:", data);
        setWorkRequests([]);  // biar tetap aman
        setFilteredWorkRequests([]);
      }
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
      setIsLoading(false);
    });
};


  useEffect(() => {
    fetchWorkRequests();
  }, []);

  useEffect(() => {
    const checkAccessToken = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      
      const res = await fetch("http://localhost:8000/api/me/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        console.warn("Access token invalid at load, refreshing...");
        try {
          await refreshAccessToken();
        } catch (error) {
          console.error("Failed to refresh token:", error);
        }
      }
    };
    checkAccessToken();
  }, []);

  // Update available assets when department changes (original logic)
  const handleDepartmentChangeOriginal = (department) => {
    setSelectedDepartment(department)
    setSelectedAsset("") // Reset asset selection
    setAvailableAssets(assetsByDepartment[department] || [])
  }

  // Filter work orders based on week selection
  useEffect(() => {
    // First filter by week_of_month if it's not null
    let filteredData = workRequests;
    if (week_of_month !== null) {
      filteredData = filteredData.filter((wr) => wr.week_of_month === week_of_month);
    }

    // Then filter by year if it's not null
    if (year !== null) {
      filteredData = filteredData.filter((wr) => wr.year === year);
    }

    if (month !== null) {
      filteredData = filteredData.filter((wr) => wr.month === month);
    }

    // Set filtered work orders after both filters are applied
    setFilteredWorkRequests(filteredData);
  }, [year, month, week_of_month, workRequests]);

  // Status color helper function
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

  // Category color helper function
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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Request Management</h1>
            <p className="text-sm text-muted-foreground">Kelola permintaan perbaikan dan maintenance</p>
          </div>
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
              <div className="text-2xl font-bold">{totalCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
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
              {filteredWorkRequests.map((req) => (
                <Card key={req.wr_number || req.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{req.title}</h3>
                          <Badge variant="outline">{req.wr_number}</Badge>
                          <Badge className={getCategoryColor(req.resource)}>{req.resource}</Badge>
                          <Badge className={getStatusColor(req.status)}>{req.status}</Badge>
                        </div>

                        <p className="text-sm text-muted-foreground">{req.wo_description}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>Requester: {req.requester_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {<Calendar className="h-4 w-4 text-muted-foreground" />}
                            <span>Date: {new Date(req.created_at).toLocaleDateString()}</span>
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
                <div className="space-y-6">
                  {/* Judul Request */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Judul Request *</Label>
                    <Input 
                      id="title" 
                      name="title"
                      value={form.title}
                      onChange={handleFormChange}
                      placeholder="Masukkan judul request..." 
                    />
                  </div>

                  {/* Deskripsi */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Request Description/Deskripsi Detail *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                      placeholder="Jelaskan secara detail masalah yang dihadapi, gejala yang terlihat, dan tindakan yang diharapkan..."
                      rows={4}
                    />
                  </div>

                  {/* Department */}
                  <div className="space-y-2">
                    <Label htmlFor="assetDepartment">Asset Department *</Label>
                    <Select value={form.asset_department} onValueChange={handleDepartmentChange}>
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
                    <Select 
                      value={form.asset_number} 
                      onValueChange={(val) => setForm((prev) => ({ ...prev, asset_number: val }))} 
                      disabled={!form.asset_department}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={form.asset_department ? "Pilih nomor asset" : "Pilih department terlebih dahulu"}
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
                    {form.asset_number && (
                      <p className="text-sm text-muted-foreground">
                        {availableAssets.find((asset) => asset.id === form.asset_number)?.description}
                      </p>
                    )}
                  </div>

                  {/* Asset Group */}
                  

                  {/* Asset Area */}


                  {/* Asset Activity */}
                  

                  {/* Parent Asset */}
                  

                  {/* Cost */}
                  

                  {/* Resource
                  <div className="space-y-2">
                    <Label htmlFor="resource">Kategori Resource *</Label>
                    <Select
                      value={form.resource}
                      onValueChange={(val) => setForm((prev) => ({ ...prev, resource: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori resource" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MTC">Maintenance (MTC)</SelectItem>
                        <SelectItem value="CAL">Calibration (CAL)</SelectItem>
                        <SelectItem value="UTY">Utility (UTY)</SelectItem>
                      </SelectContent>
                    </Select>s
                  </div> */}

                  

                  {/* Urgency */}
                  <div className="space-y-2">
                    <Label htmlFor="urgency">Tingkat Urgensi *</Label>
                    <Select 
                      value={form.urgency}
                      onValueChange={(val) => setForm((prev) => ({ ...prev, urgency: val }))}
                    >
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
                    <Select 
                      value={form.wr_type}
                      onValueChange={(val) => setForm((prev) => ({ ...prev, wr_type: val }))}
                    >
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
                

                  {/* Failure Cause */}
                  

                  {/* Resolution */}
                  

                  {/* Actual Failure Date */}
                  <div className="space-y-2">
                    <Label htmlFor="actualFailureDate">Tanggal Kejadian (Opsional)</Label>
                    <Input 
                      id="actualFailureDate" 
                      name="actual_failure_date"
                      value={form.actual_failure_date}
                      onChange={handleFormChange}
                      type="date" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="completionByDate">harus beres kapan ?</Label>
                  <Input 
                    id="completionByDate" 
                    name="completion_by_date"
                    value={form.completion_by_date}
                    onChange={handleFormChange}
                    type="date" 
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Button variant="outline" onClick={resetForm}>Reset Form</Button>
                  <Button onClick={handleSubmit}>Submit Request</Button>
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

