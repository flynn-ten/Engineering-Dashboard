"use client";


import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Zap, Wrench, Download } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { RoleIndicator } from "@/components/role-indicator";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { ChevronLeft, ChevronRight } from "lucide-react";


export default function Dashboard() {
  const router = useRouter();
  const dashboardRef = useRef<HTMLDivElement>(null);
 
  // State declarations
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeWorkOrders, setActiveWorkOrders] = useState(0);
  const [lastWeekChange, setLastWeekChange] = useState(0);
  const [unreleasedWorkOrders, setUnreleasedWorkOrders] = useState(0);
  const [unreleasedLastWeekChange, setUnreleasedLastWeekChange] = useState(0);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [filteredWorkOrders, setFilteredWorkOrders] = useState<any[]>([]);
  const [mttrData, setMttrData] = useState<{month: string, mttr: number, mtbf: number}[]>([]);
  const [energyData, setEnergyByDayData] = useState<any[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);


  const monthMap: Record<string, string> = {
    "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May",
    "06": "Jun", "07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct",
    "11": "Nov", "12": "Dec",
  };


  const woStatusData = [
    { name: "Released", value: activeWorkOrders, color: "#ef4444" },
    { name: "Unreleased", value: unreleasedWorkOrders, color: "#f59e0b" },
  ];

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleDownloadPDF = async () => {
    if (!dashboardRef.current) return;


    setIsGeneratingPDF(true);


    try {
      // Create a clone of the dashboard content
      const element = dashboardRef.current.cloneNode(true) as HTMLElement;
     
      // Remove elements that shouldn't be in the PDF
      const elementsToRemove = element.querySelectorAll(
        '.no-print, .role-indicator, header, .pdf-exclude, button'
      );
      elementsToRemove.forEach(el => el.remove());


      // Apply print-specific styles
      element.style.padding = '20px';
      element.style.width = '100%';
      element.style.backgroundColor = 'white';


      // Create a temporary container
      const pdfContainer = document.createElement('div');
      pdfContainer.appendChild(element);
      pdfContainer.style.position = 'fixed';
      pdfContainer.style.left = '-9999px';
      pdfContainer.style.top = '0';
      document.body.appendChild(pdfContainer);


      const options = {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      };


      const canvas = await html2canvas(element, options);
      document.body.removeChild(pdfContainer);


      // Calculate PDF dimensions
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190; // Reduced width for margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const marginLeft = 10;


      // Add title and date
      pdf.setFontSize(18);
      pdf.setTextColor(40);
      pdf.text('Engineering Dashboard Report', 105, 15, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 105, 22, { align: 'center' });


      // Add content with proper margins
      pdf.addImage(imgData, 'PNG', marginLeft, 30, imgWidth, imgHeight);


      pdf.save(`dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(filteredWorkOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const currentItems = filteredWorkOrders.slice(startIndex, endIndex);
  const midpoint = Math.ceil(currentItems.length / 2);
  const leftColumnWO = currentItems.slice(0, midpoint);
  const rightColumnWO = currentItems.slice(midpoint);

  useEffect(() => {
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


    // Fetch all data in parallel
    const fetchData = async () => {
      try {
        const [
          monthlyTrendRes,
          energyDailyRes,
          activeOrdersRes,
          unreleasedOrdersRes,
          workOrdersRes
        ] = await Promise.all([
          fetch("http://localhost:8000/api/monthly-trend/"),
          fetch("http://localhost:8000/api/energydaily/"),
          fetch("http://localhost:8000/api/active-work-orders/"),
          fetch("http://localhost:8000/api/unreleased-work-orders/"),
          fetch("http://localhost:8000/api/work-order-list/")
        ]);


        const [
          monthlyTrendData,
          energyDailyData,
          activeOrdersData,
          unreleasedOrdersData,
          workOrdersData
        ] = await Promise.all([
          monthlyTrendRes.json(),
          energyDailyRes.json(),
          activeOrdersRes.json(),
          unreleasedOrdersRes.json(),
          workOrdersRes.json()
        ]);


        // Process and set data
        setMttrData(monthlyTrendData.map((item: any) => ({
          month: monthMap[item.month?.split("-")[1] as keyof typeof monthMap] || item.month,
          mttr: item.mttr,
          mtbf: item.mtbf,
        })));


        setEnergyByDayData(energyDailyData);
        setActiveWorkOrders(activeOrdersData[0]?.released_count || 0);
        setLastWeekChange(activeOrdersData[0]?.diff_from_last_week || 0);
        setUnreleasedWorkOrders(unreleasedOrdersData[0]?.unreleased_count || 0);
        setUnreleasedLastWeekChange(unreleasedOrdersData[0]?.diff_from_last_week_unreleased || 0);
        setWorkOrders(workOrdersData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };


    fetchData();


    // Set up Supabase realtime subscription
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
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            fetch("http://localhost:8000/api/active-work-orders/")
              .then((response) => response.json())
              .then((data) => {
                setActiveWorkOrders(data[0]?.released_count || 0);
                setLastWeekChange(data[0]?.diff_from_last_week || 0);
              });
          }
        }
      )
      .subscribe();


    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  useEffect(() => {
    let filteredData = workOrders;
    setFilteredWorkOrders(filteredData);
  }, [workOrders]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredWorkOrders]);


  if (isLoading) {
    return <div className="p-8 text-muted-foreground text-center">⏳ Loading dashboard...</div>;
  }


  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 no-print">
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Engineering Dashboard</h1>
            <p className="text-sm text-muted-foreground">Integrated technical monitoring platform</p>
          </div>
          <div className="flex items-center gap-4">
            {role === "admin" && (
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 no-print"
                disabled={isGeneratingPDF}
              >
                <Download className="h-4 w-4" />
                {isGeneratingPDF ? "Generating PDF..." : "Download PDF"}
              </Button>
            )}
          </div>
        </div>
      </header>


      <main className="flex-1 space-y-6 p-6" ref={dashboardRef}>
        {role && <RoleIndicator currentRole={role} className="no-print" />}


        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Work Orders</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeWorkOrders}</div>
              <p className="text-xs text-muted-foreground">
                <span className={`${lastWeekChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {lastWeekChange >= 0 ? `+${lastWeekChange} ` : lastWeekChange}
                </span>
                from last week
              </p>
            </CardContent>
          </Card>


          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unreleased Work Orders</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreleasedWorkOrders}</div>
              <p className="text-xs text-muted-foreground">
                <span className={`${unreleasedLastWeekChange >= 0 ? "text-green-500" : "text-red-500"}`}>
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
                <span className="text-green-500">+5%</span> from last month
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
              <p className="text-xs text-muted-foreground">Requires immediate action</p>
            </CardContent>
          </Card>
        </div>


        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Weekly Energy Consumption</CardTitle>
              <CardDescription>Monitoring electricity, water, and CNG usage</CardDescription>
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


          <Card>
            <CardHeader>
              <CardTitle>Work Order Status</CardTitle>
              <CardDescription>Distribution of active work orders</CardDescription>
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


        <Card>
          <CardHeader>
            <CardTitle>MTTR & MTBF Analysis</CardTitle>
            <CardDescription>Mean Time To Repair and Mean Time Between Failures (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mttrData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="mttr" fill="#ef4444" name="MTTR (hours)" />
                <Bar yAxisId="right" dataKey="mtbf" fill="#10b981" name="MTBF (hours)" />
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

