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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const WorkOrdersPage = () => {
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
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // New states for work order form functionality
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<any>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [workOrderForm, setWorkOrderForm] = useState({
    asset_area: '',
    asset_group: '',
    failure_cause: '',
    failure_code: '',
    failure_asset: '',
    resolution: ''
  });
  // Changed to track work orders that have been form-completed (ready for completion)
  const [formCompletedWorkOrders, setFormCompletedWorkOrders] = useState<Set<string>>(new Set());

  // Remove hardcoded data - we'll fetch from API instead
  const workingRequests = Array.isArray(workRequests) ? workRequests.filter(req => req.status === "pending" || req.status === "In Review") : [];
  
  // Get unreleased work orders for work order tab - ensure filteredWorkOrders is an array
  // Handle both "Unreleased" and "unreleased" status values using wo.status
  const unreleasedWorkOrders = Array.isArray(filteredWorkOrders) ? 
    filteredWorkOrders.filter(wo => 
      wo.status && (wo.status.toLowerCase() === "unreleased")
    ) : [];

  // Get released work orders that are ready to complete
  const releasedWorkOrders = Array.isArray(filteredWorkOrders) ? 
    filteredWorkOrders.filter(wo => 
      wo.status && (wo.status.toLowerCase() === "released")
    ) : [];

  useEffect(() => {
    // Hanya berjalan di client
    const token = localStorage.getItem("accessToken")
    setAccessToken(token)

    if (token) {
      fetch("http://localhost:8000/api/work-orders/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then(async (res) => {
          if (res.status === 401) {
            // Try to refresh token
            const newToken = await refreshAccessToken();
            if (newToken) {
              // Retry with new token
              const retryRes = await fetch("http://localhost:8000/api/work-orders/", {
                headers: {
                  Authorization: `Bearer ${newToken}`,
                  "Content-Type": "application/json",
                },
              });
              if (retryRes.ok) {
                const data = await retryRes.json();
                console.log("Data:", data)
                setWorkOrders(Array.isArray(data) ? data : [])
                return;
              }
            }
            // If refresh fails, redirect to login or show error
            console.error("Authentication failed. Please login again.");
            setWorkOrders([]);
            return;
          }
          
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          
          const data = await res.json();
          console.log("Data:", data)
          // Ensure data is an array before setting
          setWorkOrders(Array.isArray(data) ? data : [])
        })
        .catch((err) => {
          console.error("Error fetching work orders", err)
          setWorkOrders([]) // Set empty array on error
        })
    } else {
      console.error("No access token found. Please login.");
      setWorkOrders([]);
    }
  }, []);

  async function refreshAccessToken() {
    const refresh = localStorage.getItem("refresh");
    if (!refresh) return null;

    const res = await fetch("http://localhost:8000/api/token/refresh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("accessToken", data.access);
      return data.access;
    } else {
      console.error("Failed to refresh token");
      return null;
    }
  }

  const handleApprove = async (requestId: string) => {
    let token = localStorage.getItem("accessToken");

    if (!token) {
      alert("No token found.");
      return;
    }

    const res = await fetch(`http://localhost:8000/api/work-request/update-status/${requestId}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "approved" }),
    });

    if (res.status === 401) {
      // coba refresh token
      const newToken = await refreshAccessToken();
      if (newToken) {
        // retry with new token
        const retry = await fetch(`http://localhost:8000/api/work-request/update-status/${requestId}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${newToken}`,
          },
          body: JSON.stringify({ status: "approved" }),
        });

        if (retry.ok) {
          alert(`Request ${requestId} approved!`);
          fetchWorkRequests();
          return;
        } else {
          const data = await retry.json();
          alert(`Retry failed: ${data.detail || "Unknown error"}`);
          return;
        }
      } else {
        alert("Session expired. Please login again.");
        return;
      }
    }

    const data = await res.json();
    if (res.ok) {
      alert(`Request ${requestId} approved!`);
      fetchWorkRequests();
    } else {
      alert(`Failed to approve: ${data.detail || "Unknown error"}`);
    }
  };

  const handleCancel = async (requestId: string) => {
    try {
      // Use the correct token key that matches your other components
      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        alert("No authentication token found. Please login again.");
        return;
      }

      const res = await fetch(`http://localhost:8000/api/work-request/update-status/${requestId}/`, {
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

  // New function to handle work order click
  const handleWorkOrderClick = (workOrder: any) => {
    setSelectedWorkOrder(workOrder);
    setIsFormDialogOpen(true);
  };

  // Updated form submission function
const handleFormSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!selectedWorkOrder) {
    alert("No work order selected.");
    return;
  }

  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("No authentication token found. Please login again.");
      return;
    }

    console.log("Submitting form for work order:", selectedWorkOrder);
    console.log("Form data:", workOrderForm);

    const currentTimestamp = new Date().toISOString();

    const possibleEndpoints = [
      `http://localhost:8000/api/work-orders/${selectedWorkOrder.id}/`,
      `http://localhost:8000/api/work-orders/${selectedWorkOrder.no}/`,
      `http://localhost:8000/api/work-order/${selectedWorkOrder.id}/`,
      `http://localhost:8000/api/work-order/${selectedWorkOrder.no}/`
    ];

    let response = null;
    let successfulEndpoint = null;

    for (const endpoint of possibleEndpoints) {
      try {
        console.log("Trying endpoint:", endpoint);
        
        response = await fetch(endpoint, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            asset_area: workOrderForm.asset_area,
            asset_group: workOrderForm.asset_group,
            failure_cause: workOrderForm.failure_cause,
            failure_code: workOrderForm.failure_code,
            failure_asset: workOrderForm.failure_asset,
            resolution: workOrderForm.resolution,
            status: "released",
            wo_start_date: currentTimestamp
          }),
        });

        if (response.status === 404) {
          console.log("Endpoint not found, trying next...");
          continue;
        }

        if (response.status === 401) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            response = await fetch(endpoint, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newToken}`,
              },
              body: JSON.stringify({
                asset_area: workOrderForm.asset_area,
                asset_group: workOrderForm.asset_group,
                failure_cause: workOrderForm.failure_cause,
                failure_code: workOrderForm.failure_code,
                failure_asset: workOrderForm.failure_asset,
                resolution: workOrderForm.resolution,
                status: "released",
                wo_start_date: currentTimestamp
              }),
            });
          }
        }

        successfulEndpoint = endpoint;
        break;
      } catch (fetchError) {
        console.log("Error with endpoint:", endpoint, fetchError);
        continue;
      }
    }

    if (!response) {
      alert("Unable to connect to any API endpoint. Please check your connection.");
      return;
    }

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);

    const contentType = response.headers.get("content-type");
    
    if (response.ok) {
      let responseData = {};
      
      if (contentType && contentType.includes("application/json")) {
        try {
          responseData = await response.json();
        } catch (jsonError) {
          console.log("Response is not valid JSON, but request was successful");
        }
      }
      
      console.log('Form submitted successfully:', workOrderForm);
      console.log('API Response:', responseData);
      
      const workOrderId = selectedWorkOrder.no || selectedWorkOrder.id;
      setFormCompletedWorkOrders(prev => new Set([...prev, workOrderId]));
      
      setWorkOrders(prevWorkOrders => 
        prevWorkOrders.map(wo => 
          (wo.no === selectedWorkOrder.no || wo.id === selectedWorkOrder.id)
            ? { 
                ...wo, 
                status: "released",
                wo_start_date: currentTimestamp 
              }
            : wo
        )
      );

      

      setIsFormDialogOpen(false);

      setWorkOrderForm({
        asset_area: '',
        asset_group: '',
        failure_cause: '',
        failure_code: '',
        failure_asset: '',
        resolution: ''
      });

      // Auto-refresh from backend


      alert('Work Order form submitted successfully! Status updated to Released.');
    } else {
      let errorData = {};
      
      if (contentType && contentType.includes("application/json")) {
        try {
          errorData = await response.json();
        } catch (jsonError) {
          errorData = { error: "Server returned non-JSON error response" };
        }
      } else {
        const textResponse = await response.text();
        errorData = { error: textResponse || "Unknown server error" };
      }
      
      console.error("Failed to submit form:", errorData);
      console.error("Response status:", response.status);
      console.error("Successful endpoint was:", successfulEndpoint);
      
      alert(`Failed to submit work order form: ${JSON.stringify(errorData)}`);
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    alert(`Error occurred while submitting form: ${error.message}`);
  }
};


  // Updated function to handle complete work order
  const handleCompleteWorkOrder = async (workOrderNo: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("No authentication token found. Please login again.");
        return;
      }

      // Find the work order by number from the current work orders state
      const workOrderToComplete = workOrders.find(wo => wo.no === workOrderNo || wo.id === workOrderNo);
      if (!workOrderToComplete) {
        alert("Work order not found.");
        return;
      }

      // Update work order status to "Complete"
      const response = await fetch(`http://localhost:8000/api/work-orders/${workOrderToComplete.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "completed" // Using 'status' field for database
        }),
      });

      if (response.ok) {
        console.log('Completing work order:', workOrderNo);
        
        // Remove from form-completed set
        setFormCompletedWorkOrders(prev => {
          const newSet = new Set(prev);
          newSet.delete(workOrderNo);
          return newSet;
        });

        // Update the work order in the local state
        setWorkOrders(prevWorkOrders => 
          prevWorkOrders.map(wo => 
            (wo.no === workOrderNo || wo.id === workOrderNo)
              ? { ...wo, status: "completed" } // Update status field
              : wo
          )
        );

        // Also update filteredWorkOrders
        
        
        alert('Work Order completed successfully!');
      } else {
        const errorData = await response.json();
        console.error("Failed to complete work order:", errorData);
        alert('Failed to complete work order. Please try again.');
      }
    } catch (error) {
      console.error('Error completing work order:', error);
      alert('Failed to complete work order');
    }
  };

  // Fetch work requests from API
  const fetchWorkRequests = async () => {
    try {
      setIsLoadingRequests(true);
      
      // Get authentication token
      const token = localStorage.getItem("accessToken");
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      // Add authorization header if token exists
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch("http://localhost:8000/api/work-request/", {
        method: "GET",
        headers: headers,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // Ensure data is an array before setting
      setWorkRequests(Array.isArray(data) ? data : []);
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
    const fetchWorkOrders = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch("http://localhost:8000/api/work-orders/", {
          headers: headers,
        });

        if (response.status === 401) {
          // Try to refresh token
          const newToken = await refreshAccessToken();
          if (newToken) {
            // Retry with new token
            const retryResponse = await fetch("http://localhost:8000/api/work-orders/", {
              headers: {
                ...headers,
                Authorization: `Bearer ${newToken}`,
              },
            });
            
            if (retryResponse.ok) {
              const data = await retryResponse.json();
              const workOrdersData = Array.isArray(data) ? data : [];
              setWorkOrders(workOrdersData);
              setIsLoading(false);
              if (workOrdersData.length > 0) {
                const latestData = workOrdersData[0];
                setWo_no(latestData.no);
                setTitle(latestData.title);
                setWo_created_date(latestData.wo_created_date);
                setWo_status(latestData.status); // Using wo.status consistently
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
              return;
            }
          }
          // If refresh fails
          console.error("Authentication failed. Please login again.");
          setWorkOrders([]);
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const workOrdersData = Array.isArray(data) ? data : [];
        setWorkOrders(workOrdersData);
        setIsLoading(false);
        if (workOrdersData.length > 0) {
          const latestData = workOrdersData[0];
          setWo_no(latestData.no);
          setTitle(latestData.title);
          setWo_created_date(latestData.wo_created_date);
          setWo_status(latestData.status); // Using wo.status consistently
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
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading(false);
        setWorkOrders([]); // Set empty array on error
      }
    };

    fetchWorkOrders();
    // Also fetch work requests
    fetchWorkRequests();
  }, []);

  // Filter work orders based on week selection
  useEffect(() => {
    // Ensure workOrders is an array before filtering
    if (!Array.isArray(workOrders)) {
      setFilteredWorkOrders([]);
      return;
    }

    

    // Start with all work orders
    let filteredData = [...workOrders];

    // Apply filters only if they are set (not null and not undefined)
    if (week_of_month !== null && week_of_month !== undefined) {
      
      filteredData = filteredData.filter((wo) => wo.week_of_month === week_of_month);
      
    }

    if (year !== null && year !== undefined) {
      
      filteredData = filteredData.filter((wo) => wo.year === year);
      
    }

    if (month !== null && month !== undefined) {
      
      filteredData = filteredData.filter((wo) => wo.month === month);
      
    }

    
    // Set filtered work orders after all filters are applied
    setFilteredWorkOrders(filteredData);
  }, [year, month, week_of_month, workOrders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "released":
        return "bg-blue-100 text-blue-800";
      case "unreleased":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
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

  // Ensure arrays are always arrays for safe operations
  const safeFilteredWorkOrders = Array.isArray(filteredWorkOrders) ? filteredWorkOrders : [];
  const safeWorkRequests = Array.isArray(workRequests) ? workRequests : [];

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
              <div className="text-2xl font-bold">{safeFilteredWorkOrders.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Released</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {safeFilteredWorkOrders.filter((wo) => wo.status === "released").length}
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
                {safeFilteredWorkOrders.filter((wo) => wo.status === "Unreleased").length}
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
                {safeFilteredWorkOrders.filter((wo) => wo.status === "Complete").length}
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
            <TabsTrigger value="list">List Work Order</TabsTrigger>
            <TabsTrigger value="requests">Working Requests</TabsTrigger>
            <TabsTrigger value="work order">Work Order</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {safeFilteredWorkOrders.map((wo, index) => (
              <Card key={wo.no || `wo-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{wo.title}</h3>
                        <Badge variant="outline">{wo.no}</Badge>
                        <Badge className={getCategoryColor(wo.resource)}>{wo.resource}</Badge>
                        <Badge className={getStatusColor(wo.status)}>{wo.status}</Badge>
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
                      <Input placeholder="Cari request berdasarkan ID, judul, atau deskripsi..." className="pl-8" />
                    </div>
                  </div>
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
                  {workingRequests.map((request, index) => (
                    <Card key={request.wr_number || request.id || `request-${index}`}>
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
                              onClick={() => handleApprove(request.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => handleCancel(request.id)}
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
          
          <TabsContent value="work order" className="space-y-4">
            {/* Sub-tabs for work orders */}
            <Tabs defaultValue="pending-forms" className="space-y-4">
              <TabsList>
                <TabsTrigger value="pending-forms">Pending Forms</TabsTrigger>
                <TabsTrigger value="work-order-to-complete">Work Order to Complete</TabsTrigger>
              </TabsList>

              {/* Pending Forms Sub-tab */}
              <TabsContent value="pending-forms" className="space-y-4">
                <div className="space-y-4">
                  {unreleasedWorkOrders.length === 0 ? (
                    <Alert>
                      <AlertDescription>
                        Tidak ada work order yang memerlukan pengisian form saat ini.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {unreleasedWorkOrders.map((wo, index) => (
                        <Card key={wo.no || `unreleased-wo-${index}`}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-3">
                                  <h3 className="text-lg font-semibold">{wo.title}</h3>
                                  <Badge variant="outline">{wo.no}</Badge>
                                  <Badge className={getCategoryColor(wo.resource)}>{wo.resource}</Badge>
                                  <Badge className={getStatusColor(wo.status)}>{wo.status}</Badge>
                                </div>

                                <p className="text-sm text-muted-foreground">{wo.wo_description}</p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span>Assignee: {wo.wr_requestor}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>Due: {wo.wo_actual_completion_date}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>Est: {wo.actual_duration}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Wrench className="h-4 w-4 text-muted-foreground" />
                                    <span>Type: {wo.wo_type}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleWorkOrderClick(wo)}
                                >
                                  <Wrench className="h-4 w-4 mr-1" />
                                  Fill Form
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

              {/* Work Order to Complete Sub-tab */}
              <TabsContent value="work-order-to-complete" className="space-y-4">
                <div className="space-y-4">
                  {releasedWorkOrders.length === 0 ? (
                    <Alert>
                      <AlertDescription>
                        Tidak ada work order yang siap untuk diselesaikan saat ini.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {releasedWorkOrders.map((wo, index) => (
                        <Card key={wo.no || `released-wo-${index}`}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-3">
                                  <h3 className="text-lg font-semibold">{wo.title}</h3>
                                  <Badge variant="outline">{wo.no}</Badge>
                                  <Badge className={getCategoryColor(wo.resource)}>{wo.resource}</Badge>
                                  <Badge className={getStatusColor(wo.status)}>{wo.status}</Badge>
                                </div>

                                <p className="text-sm text-muted-foreground">{wo.wo_description}</p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span>Assignee: {wo.wr_requestor}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>Due: {wo.wo_actual_completion_date}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>Est: {wo.actual_duration}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Wrench className="h-4 w-4 text-muted-foreground" />
                                    <span>Type: {wo.wo_type}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleCompleteWorkOrder(wo.no || wo.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Complete
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

            {/* Work Order Form Dialog */}
            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Work Order Form - {selectedWorkOrder?.no}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="asset_area">Asset Area</Label>
                      <Select 
                        value={workOrderForm.asset_area} 
                        onValueChange={(value) => setWorkOrderForm(prev => ({...prev, asset_area: value}))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Asset Area" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="production">Production</SelectItem>
                          <SelectItem value="warehouse">Warehouse</SelectItem>
                          <SelectItem value="office">Office</SelectItem>
                          <SelectItem value="utilities">Utilities</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="asset_group">Asset Group</Label>
                      <Select 
                        value={workOrderForm.asset_group} 
                        onValueChange={(value) => setWorkOrderForm(prev => ({...prev, asset_group: value}))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Asset Group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="machinery">Machinery</SelectItem>
                          <SelectItem value="electrical">Electrical</SelectItem>
                          <SelectItem value="hvac">HVAC</SelectItem>
                          <SelectItem value="plumbing">Plumbing</SelectItem>
                          <SelectItem value="it_equipment">IT Equipment</SelectItem>
                          <SelectItem value="safety_equipment">Safety Equipment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="failure_code">Failure Code</Label>
                      <Select 
                        value={workOrderForm.failure_code} 
                        onValueChange={(value) => setWorkOrderForm(prev => ({...prev, failure_code: value}))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Failure Code" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEC001">MEC001 - Mechanical Failure</SelectItem>
                          <SelectItem value="ELC001">ELC001 - Electrical Failure</SelectItem>
                          <SelectItem value="HYD001">HYD001 - Hydraulic Failure</SelectItem>
                          <SelectItem value="PNE001">PNE001 - Pneumatic Failure</SelectItem>
                          <SelectItem value="WEA001">WEA001 - Wear and Tear</SelectItem>
                          <SelectItem value="CAL001">CAL001 - Calibration Issue</SelectItem>
                          <SelectItem value="COR001">COR001 - Corrosion</SelectItem>
                          <SelectItem value="OTH001">OTH001 - Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="failure_asset">Failure Asset</Label>
                      <Input
                        id="failure_asset"
                        value={workOrderForm.failure_asset}
                        onChange={(e) => setWorkOrderForm(prev => ({...prev, failure_asset: e.target.value}))}
                        placeholder="Enter failure asset"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="failure_cause">Failure Cause</Label>
                    <Textarea
                      id="failure_cause"
                      value={workOrderForm.failure_cause}
                      onChange={(e) => setWorkOrderForm(prev => ({...prev, failure_cause: e.target.value}))}
                      placeholder="Describe the failure cause"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resolution">Resolution</Label>
                    <Textarea
                      id="resolution"
                      value={workOrderForm.resolution}
                      onChange={(e) => setWorkOrderForm(prev => ({...prev, resolution: e.target.value}))}
                      placeholder="Describe the resolution taken"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsFormDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      Submit Form
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default WorkOrdersPage;

