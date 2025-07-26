'use client';

import React, { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Calendar, Clock, User, Wrench, AlertCircle, CheckCircle, MoreHorizontal, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

const WorkOrdersPage = async () => {
  const [isLoading, setIsLoading] = useState(true);
  const [wo_no, setWo_no] = useState(null);
  const [title, setTitle] = useState("");
  const [wo_created_date, setWo_created_date] = useState("");
  const [wo_status, setWo_status] = useState("");
  const [wo_description, setWo_description] = useState("");
  const [wo_type, setWo_type] = useState("");
  const [wr_requestor, setWr_requestor] = useState("");
  const [wo_actual_completion_date, setWo_actual_completion_date] = useState("");
  const [actual_duration, setActual_duration] = useState(null);
  const [year, setYear] = useState(null);
  const [month, setMonth] = useState(null);
  const [week_of_month, setWeek_of_month] = useState<number | null>(null);
  const [resource, setResource] = useState("");
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [filteredWorkOrders, setFilteredWorkOrders] = useState<any[]>([]);
  const [workRequests, setWorkRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  // Remove hardcoded data - we'll fetch from API instead
  const workingRequests = workRequests.filter(req => req.status === "pending" || req.status === "In Review");

  

  const handleApprove = async (requestId: string) => {
    try {
      // Use the correct token key that matches your other components
      const token = localStorage.getItem("access") || localStorage.getItem("accessToken");
      
      if (!token) {
        alert("No authentication token found. Please login again.");
        return;
      }

      // Using the correct API endpoint structure
      const res = await fetch(`http://localhost:8000/api/work-request/create/${requestId}/approve/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "approved" }),
      });

      // Check if response is actually JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Server returned non-JSON response:", await res.text());
        alert(`Server error: Expected JSON response but got ${contentType}`);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        alert(`Request ${requestId} approved! Work Order will be created.`);
        // Refresh the work requests list
        fetchWorkRequests();
      } else {
        const data = await res.json();
        alert(`Failed to approve: ${data.error || data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Error approving:", err);
      alert("Error occurred while approving request. Please check the console for details.");
    }
  };

  const handleCancel = async (requestId: string) => {
    try {
      // Use the correct token key that matches your other components
      const token = localStorage.getItem("access") || localStorage.getItem("accessToken");
      
      if (!token) {
        alert("No authentication token found. Please login again.");
        return;
      }

      // Using the correct API endpoint structure
      const res = await fetch(`http://localhost:8000/api/work-request/${requestId}/reject/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "rejected" }),
      });

      // Check if response is actually JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Server returned non-JSON response:", await res.text());
        alert(`Server error: Expected JSON response but got ${contentType}`);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        alert(`Request ${requestId} has been cancelled.`);
        // Refresh the work requests list
        fetchWorkRequests();
      } else {
        const data = await res.json();
        alert(`Failed to cancel: ${data.error || data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Error rejecting:", err);
      alert("Error occurred while cancelling request. Please check the console for details.");
    }
  };

  // Fetch work requests from API
  const fetchWorkRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const response = await fetch("http://localhost:8000/api/work-request/create/");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      
      const data = await response.json();
      setWorkRequests(data);
      console.log("Work Request API response:", data);
    } catch (error) {
      console.error("Error fetching work requests:", error);
      // Keep empty array as fallback
      setWorkRequests([]);
      
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Fetching data from API
  useEffect(() => {
    fetch("http://localhost:8000/api/work-order-list/")
      .then((response) => response.json())
      .then((data) => {
        setWorkOrders(data);
        setIsLoading(false);
        if (data.length > 0) {
          const latestData = data[0];
          setWo_no(latestData.no);
          setTitle(latestData.title);
          setWo_created_date(latestData.wo_created_date);
          setWo_status(latestData.wo_status);
          setResource(latestData.resource);
          setWo_description(latestData.wo_description);
          setWo_type(latestData.wo_type);
          setWr_requestor(latestData.wr_requestor);
          setWo_actual_completion_date(latestData.wo_actual_completion_date);
          setActual_duration(latestData.actual_duration);
          setYear(latestData.year);
          setMonth(latestData.month);
          setWeek_of_month(latestData.week_of_month);
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      });
    
    // Also fetch work requests
    fetchWorkRequests();
  }, []);

  // Filter work orders based on week selection
  useEffect(() => {
    // First filter by week_of_month if it's not null
    let filteredData = workOrders;
    if (week_of_month !== null) {
      filteredData = filteredData.filter((wo) => wo.week_of_month === week_of_month);
    }

    // Then filter by year if it's not null
    if (year !== null) {
      filteredData = filteredData.filter((wo) => wo.year === year);
    }

    if (month !== null) {
      filteredData = filteredData.filter((wo) => wo.month === month);
    }

    // Set filtered work orders after both filters are applied
    setFilteredWorkOrders(filteredData);
  }, [year, month, week_of_month, workOrders]);

  // Supabase real-time subscription (commented out since supabase import is missing)
  /*
  useEffect(() => {
    const channel = supabase
      .channel('list_orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'main_data',
        },
        (payload) => {
          console.log("Change detected:", payload);

          // If it's an insert event, add the new work order to the state
          if (payload.eventType === "INSERT") {
            setWorkOrders((prev) => [...prev, payload.new]);
          }

          // If it's an update event, find and update the corresponding work order
          if (payload.eventType === "UPDATE") {
            setWorkOrders((prev) =>
              prev.map((wo) => (wo.no === payload.new.no ? payload.new : wo))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  */

  const getStatusColor = (wo_status: string) => {
    switch (wo_status) {
      case "Released":
        return "bg-blue-100 text-blue-800";
      case "Unreleased":
        return "bg-yellow-100 text-yellow-800";
      case "Complete":
        return "bg-green-100 text-green-800";
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
      case "personnel":
        return "bg-blue-100 text-blue-800";
      case "material":
        return "bg-green-100 text-green-800";
      case "tooling":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Loading state */}
      {isLoading && <div>Loading...</div>}

      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Work Orders Management</h1>
            <p className="text-sm text-muted-foreground">Kelola dan pantau semua work orders</p>
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
              <CardTitle className="text-sm font-medium">Total WO</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredWorkOrders.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Released</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {filteredWorkOrders.filter((wo) => wo.wo_status === "Released").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unreleased</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {filteredWorkOrders.filter((wo) => wo.wo_status === "Unreleased").length}
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
                {filteredWorkOrders.filter((wo) => wo.wo_status === "Complete").length}
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
                  <Input placeholder="Cari WO berdasarkan ID, judul, atau deskripsi..." className="pl-8" />
                </div>
              </div>
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

        {/* Work Orders Tabs */}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="requests">Working Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {filteredWorkOrders.map((wo) => (
              <Card key={wo.no}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{wo.title}</h3>
                        <Badge variant="outline">{wo.no}</Badge>
                        <Badge className={getCategoryColor(wo.resource)}>{wo.resource}</Badge>
                        <Badge className={getStatusColor(wo.wo_status)}>{wo.wo_status}</Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">{wo.wo_description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>Assignee: {wo.wr_requestor}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Due: {wo.wo_actual_completion_date} </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Est: {wo.actual_duration} </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-muted-foreground" />
                          <span>Type: {wo.wo_type}</span>
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
          
          <TabsContent value="requests" className="space-y-4">
            {/* Filter & Pencarian untuk Requests */}
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
                      <SelectValue placeholder="Prioritas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Prioritas</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
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

            {/* Working Requests List */}
            <div className="space-y-4">
              {isLoadingRequests ? (
                <div className="text-center py-8">Loading work requests...</div>
              ) : workingRequests.length === 0 ? (
                <Alert>
                  <AlertDescription>Tidak ada working request yang menunggu persetujuan saat ini.</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {workingRequests.map((request) => (
                    <Card key={request.wr_number || request.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold">{request.title}</h3>
                              <Badge variant="outline">{request.wr_number || request.id}</Badge>
                              <Badge className={getCategoryColor(request.resource || request.category)}>
                                {request.resource || request.category}
                              </Badge>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                {request.urgency}
                              </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground">
                              {request.wo_description || request.description}
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>Requester: {request.wr_requestor || request.requester}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>Date: {request.wr_request_by_date || request.requestDate}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(request.wr_number || request.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => handleCancel(request.wr_number || request.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default WorkOrdersPage;