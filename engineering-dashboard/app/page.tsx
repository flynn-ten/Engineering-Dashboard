"use client";

import { act, use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Zap, Wrench, ChevronLeft, ChevronRight } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { RoleIndicator } from "@/components/role-indicator";

// ✅ Dummy data tetap aman
// const energyData = [
//   { name: "Sen", listrik: 1200, air: 800, cng: 400 },
//   { name: "Sel", listrik: 1100, air: 750, cng: 380 },
//   { name: "Rab", listrik: 1300, air: 820, cng: 420 },
//   { name: "Kam", listrik: 1250, air: 790, cng: 410 },
//   { name: "Jum", listrik: 1400, air: 850, cng: 450 },
//   { name: "Sab", listrik: 900, air: 600, cng: 300 },
//   { name: "Min", listrik: 800, air: 550, cng: 280 },
// ];


// const mttrData = [
//   { month: "Jan", mttr: 4.2, mtbf: 120 },
//   { month: "Feb", mttr: 3.8, mtbf: 135 },
//   { month: "Mar", mttr: 4.5, mtbf: 110 },
//   { month: "Apr", mttr: 3.2, mtbf: 145 },
//   { month: "Mei", mttr: 3.9, mtbf: 125 },
//   { month: "Jun", mttr: 3.1, mtbf: 150 },
// ];



export default function Dashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeWorkOrders, setActiveWorkOrders] = useState(0);
  const [lastWeekChange, setLastWeekChange] = useState(0);
  const [unreleasedWorkOrders, setUnreleasedWorkOrders] = useState(0);
  const [unreleasedLastWeekChange, setUnreleasedLastWeekChange] = useState(0);
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
  const [mttrData, setMttrData] = useState([]);
  const [energyData, setEnergyByDayData] = useState([]);
  
  // Pagination state for work orders
  const [currentPage, setCurrentPage] = useState(1);
  const workOrdersPerPage = 10; // 5 per column x 2 columns

  const monthMap = {
  "01": "Jan",
  "02": "Feb",
  "03": "Mar",
  "04": "Apr",
  "05": "Mei", // pakai "May" kalau mau English
  "06": "Jun",
  "07": "Jul",
  "08": "Aug",
  "09": "Sep",
  "10": "Oct",
  "11": "Nov",
  "12": "Dec",
};
  
  const woStatusData = [
  { name: "Released", value: activeWorkOrders, color: "#ef4444" },
  { name: "Unreleased", value: unreleasedWorkOrders, color: "#f59e0b" },
];

  // Calculate pagination values
  const totalPages = Math.ceil(filteredWorkOrders.length / workOrdersPerPage);
  const startIndex = (currentPage - 1) * workOrdersPerPage;
  const endIndex = startIndex + workOrdersPerPage;
  const currentWorkOrders = filteredWorkOrders.slice(startIndex, endIndex);
  
  // Split current work orders into two columns
  const leftColumnWO = currentWorkOrders.slice(0, 5);
  const rightColumnWO = currentWorkOrders.slice(5, 10);

  // Handle page navigation
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  // Reset to first page when filtered data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredWorkOrders.length]);
  

  useEffect(() => {
    // Check for authentication and redirect if needed
    const access = localStorage.getItem("accessToken");
    const userJson = localStorage.getItem("user");

    if (!access || !userJson || userJson === "undefined") {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userJson);
      const userRole = user.userprofile?.role || user.role;

      if (!userRole) {
        router.push("/login");
        return;
      }

      setCurrentUser(user);
      setRole(userRole);
      setIsLoading(false);
    } catch {
      router.push("/login");
    }

    fetch("http://localhost:8000/api/monthly-trend/")
  .then((res) => res.json())
  .then((data) => {
    if (!Array.isArray(data)) {
      console.error("Unexpected response:", data);
      return;
    }

    const transformed = data.map((item) => {
      const monthCode = item.month?.split("-")[1]; // Pastikan item.month ada
      return {
        month: monthMap[monthCode] || item.month,
        mttr: item.mttr,
        mtbf: item.mtbf,
      };
    });

    setMttrData(transformed);
  })
  .catch((err) => console.error("Monthly trend fetch error:", err));


  fetch("http://localhost:8000/api/energydaily/")
    .then((res) => res.json())
    .then((data) => setEnergyByDayData(data))
    .catch((err) => console.error("Energy by day fetch error:", err));

    // Fetch Active Work Orders from Django API
    fetch("http://localhost:8000/api/active-work-orders/")
      .then((response) => response.json())
      .then((data) => {
        // Assuming data is an array of active work orders, get the first (latest) entry
        const latestData = data[0];

        setActiveWorkOrders(latestData.released_count); // Set the active work orders count
        setLastWeekChange(latestData.diff_from_last_week); // Set the difference from the previous week
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      });
      
  }, []);

  //fetch unreleased work orders
  useEffect(() => {
    fetch("http://localhost:8000/api/unreleased-work-orders/")
      .then((response) => response.json())
      .then((data) => {
        // Assuming data is an array of active work orders, get the first (latest) entry
        const latestData = data[0];

        setUnreleasedWorkOrders(latestData.unreleased_count); // Set the unreleased work orders count
        setUnreleasedLastWeekChange(latestData.diff_from_last_week_unreleased); // Set the difference from the previous week
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      });
  }, []);

    // Fetch Work Orders data
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
              setWo_status(latestData.status);
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

  useEffect(() => {
    const channel = supabase
      .channel('work_orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'main_data',
        },
        (payload) => {
          console.log("Change detected:", payload);
          // Handle data changes
          // Re-fetch or update the state based on the change type (INSERT, UPDATE, DELETE)
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            fetch("http://localhost:8000/api/active-work-orders/")
              .then((response) => response.json())
              .then((data) => {
                const latestData = data[0];
                setActiveWorkOrders(latestData.released_count);
                setLastWeekChange(latestData.diff_from_last_week);
              });
          }
        }
      )
      .subscribe();
      

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return <div className="p-8 text-muted-foreground text-center">⏳ Mengalihkan ke dashboard...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Engineering Dashboard</h1>
            <p className="text-sm text-muted-foreground">Selamat datang di platform monitoring teknis terintegrasi</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-green-600 border-green-600">
              System Online
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-6 p-6">
        {/* Role Indicator */}
        {role && <RoleIndicator currentRole={role} />}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Released Work Orders</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeWorkOrders}</div>
              <p className="text-xs text-muted-foreground">
                <span className={`text-${lastWeekChange >= 0 ? "green" : "red"}-500`}>
                  {lastWeekChange >= 0 ? `+${lastWeekChange} ` : lastWeekChange}
                </span>
                from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unrelease Work Orders</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreleasedWorkOrders}</div>
              <p className="text-xs text-muted-foreground">
                <span className={`text-${unreleasedLastWeekChange >= 0 ? "green" : "red"}-500`}>
                  {unreleasedLastWeekChange >= 0 ? `+${unreleasedLastWeekChange} ` : unreleasedLastWeekChange}
                </span>
                from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Energy Efficiency</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">+5%</span> dari bulan lalu
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CAPA Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Perlu tindakan segera</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Energy Consumption Chart */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Konsumsi Energi Mingguan</CardTitle>
              <CardDescription>Monitoring konsumsi listrik, air, dan CNG</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={energyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="listrik" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="air" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="cng" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* WO Status Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Status Work Orders</CardTitle>
              <CardDescription>Distribusi status WO aktif</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={woStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {woStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {woStatusData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MTTR/MTBF Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Analisis MTTR & MTBF</CardTitle>
            <CardDescription>Mean Time To Repair dan Mean Time Between Failures (6 bulan terakhir)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mttrData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="mttr" fill="#ef4444" name="MTTR (jam)" />
                <Bar yAxisId="right" dataKey="mtbf" fill="#10b981" name="MTBF (jam)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Work Orders - Full Width */}
        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Work Orders Terbaru</CardTitle>
            <CardDescription className="text-sm">
              {filteredWorkOrders.length} WO terakhir yang dibuat 
              {totalPages > 1 && (
                <span className="ml-2">
                  (Halaman {currentPage} dari {totalPages})
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredWorkOrders.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No work orders found for the selected filters.</div>
            ) : (
              <>
                {/* Two Column Layout */}
                <div className="grid grid-cols-2 gap-6 w-full">
                  {/* Left Column */}
                  <div className="space-y-2 w-full">
                    {leftColumnWO.map((wo) => (
                      <div key={wo.no} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors w-full">
                        <div className="flex-1 min-w-0 pr-3">
                          <p className="text-sm font-medium truncate" title={wo.title}>{wo.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{wo.no}</p>
                        </div>
                        <Badge
                          variant={wo.status === "Completed" ? "default" : "outline"}
                          className={`text-xs px-2 py-1 shrink-0 ${wo.status === "Completed" ? "bg-green-100 text-green-800" : ""}`}
                        >
                          {wo.status}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-2 w-full">
                    {rightColumnWO.map((wo) => (
                      <div key={wo.no} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors w-full">
                        <div className="flex-1 min-w-0 pr-3">
                          <p className="text-sm font-medium truncate" title={wo.title}>{wo.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{wo.no}</p>
                        </div>
                        <Badge
                          variant={wo.status === "Completed" ? "default" : "outline"}
                          className={`text-xs px-2 py-1 shrink-0 ${wo.status === "Completed" ? "bg-green-100 text-green-800" : ""}`}
                        >
                          {wo.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t w-full">
                    <div className="text-sm text-muted-foreground">
                      Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredWorkOrders.length)} dari {filteredWorkOrders.length} WO
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="h-8 px-3 text-sm"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Prev
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="h-8 px-3 text-sm"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}