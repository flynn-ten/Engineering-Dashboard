"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, TrendingDown, Clock, Wrench, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Area,
  AreaChart,
} from "recharts"
import { useEffect, useState } from "react"

interface AnalyticsData {
  date: string;
  mttr_hours: number;
  mtbf_hours: number;
  failure_count: number;
}

interface CategoryData {
  category: string;
  count: number;
  avgMttr: number;
  avgMtbf: number;
}

interface EquipmentData {
  equipment: string;
  mttr: number;
  mtbf: number;
  failures: number;
}

interface DowntimeData {
  week: string;
  date: string;
  planned: number;
  unplanned: number;
  total: number;
}

interface MonthlyTrendData {
  month: string;
  date: string;
  mttr: number;
  mtbf: number;
  workOrders: number;
}

// Helper function to safely convert to number and format
const safeToFixed = (value: any, decimals: number = 1): string => {
  const num = parseFloat(value);
  return isNaN(num) ? '0.0' : num.toFixed(decimals);
};

// Helper function to safely convert to number
const safeToNumber = (value: any): number => {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [isLoading, setIsLoading] = useState(true);
  const [mttr_hours, setMttr_hours] = useState<number | null>(null);
  const [mtbf_hours, setMtbf_hours] = useState<number | null>(null);
  const [failure_count, setFailure_count] = useState<number | null>(null);
  const [analyticsData, setAnalytic_data] = useState<AnalyticsData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [equipmentData, setEquipmentData] = useState<EquipmentData[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrendData[]>([]);
  const [downtimeData, setDowntimeData] = useState<DowntimeData[]>([]);
  
  // Equipment pagination state
  const [equipmentCurrentPage, setEquipmentCurrentPage] = useState(1);
  const equipmentItemsPerPage = 5;

  // Category pagination state (month-based)
  const [categoryCurrentPage, setCategoryCurrentPage] = useState(1);

  // Filter data based on selected period
  const filterDataByPeriod = (data: any[], dateKey: string) => {
    const now = new Date();
    let cutoffDate = new Date();

    switch (selectedPeriod) {
      case "1month":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "3months":
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case "6months":
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case "1year":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return data;
    }

    return data.filter(item => {
      const itemDate = new Date(item[dateKey]);
      return itemDate >= cutoffDate;
    });
  };

  // Apply filters to all data
  const filteredMonthlyTrend = filterDataByPeriod(monthlyTrend, "date");
  const filteredDowntimeData = filterDataByPeriod(downtimeData, "date");
  const filteredAnalyticsData = filterDataByPeriod(analyticsData, "date");
  
  // For equipment and category data, we'll filter based on the period as well
  // assuming they have period-based filtering from the API
  const filteredEquipmentData = equipmentData;
  const filteredCategoryData = categoryData;

  // Equipment pagination logic
  const totalEquipmentPages = Math.ceil(filteredEquipmentData.length / equipmentItemsPerPage);
  const equipmentStartIndex = (equipmentCurrentPage - 1) * equipmentItemsPerPage;
  const equipmentEndIndex = equipmentStartIndex + equipmentItemsPerPage;
  const currentEquipmentData = filteredEquipmentData.slice(equipmentStartIndex, equipmentEndIndex);

  // Category pagination logic (month-based)
  const getUniqueMonths = (data: CategoryData[]) => {
    const months = [...new Set(data.map(item => {
      if (item.date) {
        const date = new Date(item.date);
        return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
      }
      return 'Unknown';
    }))].sort((a, b) => {
      if (a === 'Unknown') return 1;
      if (b === 'Unknown') return -1;
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });
    return months;
  };

  const availableMonths = getUniqueMonths(filteredCategoryData);
  const totalCategoryPages = availableMonths.length;
  const currentMonth = availableMonths[categoryCurrentPage - 1];
  
  const currentCategoryData = currentMonth ? filteredCategoryData.filter(item => {
    if (!item.date) return currentMonth === 'Unknown';
    const itemMonth = new Date(item.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
    return itemMonth === currentMonth;
  }) : [];

  // Calculate metrics with safe number conversion based on filtered data
  const currentMTTR = filteredAnalyticsData.length > 0 ? safeToNumber(filteredAnalyticsData[filteredAnalyticsData.length - 1]?.mttr_hours) : safeToNumber(mttr_hours);
  const currentMTBF = filteredAnalyticsData.length > 0 ? safeToNumber(filteredAnalyticsData[filteredAnalyticsData.length - 1]?.mtbf_hours) : safeToNumber(mtbf_hours);
  const previousMTTR = filteredAnalyticsData.length > 1 ? safeToNumber(filteredAnalyticsData[filteredAnalyticsData.length - 2]?.mttr_hours) : 3.9;
  const previousMTBF = filteredAnalyticsData.length > 1 ? safeToNumber(filteredAnalyticsData[filteredAnalyticsData.length - 2]?.mtbf_hours) : 125;

  // Get calculated metrics or use defaults
  const equipmentAvailability = typeof window !== 'undefined' && window.calculatedMetrics?.equipmentAvailability || 94.2;
  const criticalEquipmentCount = typeof window !== 'undefined' && window.calculatedMetrics?.criticalEquipmentCount || 
    filteredEquipmentData.filter(item => 
      safeToNumber(item.mttr) > 4 || safeToNumber(item.mtbf) < 120 || safeToNumber(item.failures) > 5
    ).length;

  const mttrTrend = previousMTTR > 0 ? ((currentMTTR - previousMTTR) / previousMTTR) * 100 : 0;
  const mtbfTrend = previousMTBF > 0 ? ((currentMTBF - previousMTBF) / previousMTBF) * 100 : 0;

  const totalPlanned = filteredDowntimeData.reduce((acc, d) => acc + safeToNumber(d.planned), 0);
  const totalUnplanned = filteredDowntimeData.reduce((acc, d) => acc + safeToNumber(d.unplanned), 0);
  const total = totalPlanned + totalUnplanned;
  const unplannedRatio = total > 0 ? Math.round((totalUnplanned / total) * 100) : 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        const periodParam = `period=${selectedPeriod}`;
        
        const [
          analyticsRes,
          categoryRes,
          equipmentRes,
          monthlyRes,
          downtimeRes
        ] = await Promise.all([
          fetch(`http://localhost:8000/api/analytics/?${periodParam}`),
          fetch(`http://localhost:8000/api/category-analytics/?${periodParam}`),
          fetch(`http://localhost:8000/api/equipment-analytics/?${periodParam}`),
          fetch(`http://localhost:8000/api/monthly-trend/?${periodParam}`),
          fetch(`http://localhost:8000/api/downtime/?${periodParam}`)
        ]);

        const [
          analyticsData,
          categoryData,
          equipmentData,
          monthlyData,
          rawDowntimeData
        ] = await Promise.all([
          analyticsRes.json(),
          categoryRes.json(),
          equipmentRes.json(),
          monthlyRes.json(),
          downtimeRes.json()
        ]);

        // Safely process analytics data
        const processedAnalyticsData = analyticsData.map((item: any) => ({
          ...item,
          mttr_hours: safeToNumber(item.mttr_hours),
          mtbf_hours: safeToNumber(item.mtbf_hours),
          failure_count: safeToNumber(item.failure_count)
        }));

        // Safely process category data
        const processedCategoryData = categoryData.map((item: any) => ({
          ...item,
          count: safeToNumber(item.count),
          avgMttr: safeToNumber(item.avgMttr),
          avgMtbf: safeToNumber(item.avgMtbf)
        }));

        // Safely process equipment data
        const processedEquipmentData = equipmentData.map((item: any) => ({
          ...item,
          mttr: safeToNumber(item.mttr),
          mtbf: safeToNumber(item.mtbf),
          failures: safeToNumber(item.failures)
        }));

        // Safely process monthly data
        const processedMonthlyData = monthlyData.map((item: any) => ({
          ...item,
          mttr: safeToNumber(item.mttr),
          mtbf: safeToNumber(item.mtbf),
          workOrders: safeToNumber(item.workOrders)
        }));

        setAnalytic_data(processedAnalyticsData);
        setCategoryData(processedCategoryData);
        setEquipmentData(processedEquipmentData);
        setMonthlyTrend(processedMonthlyData);

        const transformedDowntimeData = rawDowntimeData.map((item: any) => ({
          week: item.week || `W${item.week_of_month || 1}`,
          date: item.date || new Date().toISOString(),
          planned: safeToNumber(item.planned_hours || item.planned),
          unplanned: safeToNumber(item.unplanned_hours || item.unplanned),
          total: safeToNumber(item.planned_hours || item.planned) + safeToNumber(item.unplanned_hours || item.unplanned)
        }));

        // Calculate equipment availability based on filtered data
        const totalFailures = filteredAnalyticsData.reduce((acc, item) => acc + safeToNumber(item.failure_count), 0);
        const avgMTBF = filteredAnalyticsData.length > 0 ? 
          filteredAnalyticsData.reduce((acc, item) => acc + safeToNumber(item.mtbf_hours), 0) / filteredAnalyticsData.length : 0;
        const equipmentAvailability = avgMTBF > 0 ? Math.min(98, Math.max(85, 100 - (totalFailures / filteredAnalyticsData.length) * 2)) : 94.2;
        
        setDowntimeData(transformedDowntimeData);

        // Store calculated metrics for UI
        window.calculatedMetrics = {
          equipmentAvailability,
          criticalEquipmentCount
        };

        if (processedAnalyticsData.length > 0) {
          const latest = processedAnalyticsData[processedAnalyticsData.length - 1];
          setMttr_hours(latest.mttr_hours);
          setMtbf_hours(latest.mtbf_hours);
          setFailure_count(latest.failure_count);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedPeriod]);

  // Reset pagination when data changes
  useEffect(() => {
    setEquipmentCurrentPage(1);
    setCategoryCurrentPage(1);
  }, [selectedPeriod, equipmentData, categoryData]);

  const handleEquipmentPrevPage = () => {
    setEquipmentCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleEquipmentNextPage = () => {
    setEquipmentCurrentPage(prev => Math.min(prev + 1, totalEquipmentPages));
  };

  const handleCategoryPrevPage = () => {
    setCategoryCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleCategoryNextPage = () => {
    setCategoryCurrentPage(prev => Math.min(prev + 1, totalCategoryPages));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">Analytics Dashboard</h1>
              <p className="text-sm text-muted-foreground">Loading data...</p>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div>Loading dashboard data...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">Analisis performa MTTR, MTBF, dan efisiensi maintenance</p>
          </div>
          <div className="flex items-center gap-2">
            <Select 
              value={selectedPeriod}
              onValueChange={setSelectedPeriod}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">1 Bulan</SelectItem>
                <SelectItem value="3months">3 Bulan</SelectItem>
                <SelectItem value="6months">6 Bulan</SelectItem>
                <SelectItem value="1year">1 Tahun</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-6 p-6">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current MTTR</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeToFixed(mttr_hours)} jam</div>
              <div className="flex items-center gap-1 text-xs">
                {mttrTrend < 0 ? (
                  <>
                    <TrendingDown className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">{safeToFixed(Math.abs(mttrTrend))}% lebih baik</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-3 w-3 text-red-500" />
                    <span className="text-red-500">{safeToFixed(mttrTrend)}% lebih buruk</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current MTBF</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeToFixed(mtbf_hours)} jam</div>
              <div className="flex items-center gap-1 text-xs">
                {mtbfTrend > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">{safeToFixed(mtbfTrend)}% lebih baik</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-red-500" />
                    <span className="text-red-500">{safeToFixed(Math.abs(mtbfTrend))}% lebih buruk</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equipment Availability</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeToFixed(equipmentAvailability)}%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">+2.1%</span> dari periode sebelumnya
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Equipment</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{criticalEquipmentCount}</div>
              <p className="text-xs text-muted-foreground">Perlu perhatian khusus</p>
            </CardContent>
          </Card>
        </div>

        {/* MTTR & MTBF Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Trend MTTR & MTBF</CardTitle>
            <CardDescription>Data untuk periode terpilih</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              {filteredMonthlyTrend.length > 0 ? (
                <ComposedChart data={filteredMonthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="workOrders" fill="#e5e7eb" name="Work Orders" />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="mttr"
                    stroke="#ef4444"
                    strokeWidth={3}
                    name="MTTR (jam)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="mtbf"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="MTBF (jam)"
                  />
                </ComposedChart>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p>No trend data available</p>
                </div>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Equipment Performance & Category Analysis */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Equipment Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performa Equipment</CardTitle>
              <CardDescription>Data untuk periode terpilih</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredEquipmentData.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-4">
                    {currentEquipmentData.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.equipment}</span>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={item.failures > 5 ? "destructive" : item.failures > 3 ? "default" : "secondary"}
                            >
                              {item.failures} failures
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">MTTR:</span>
                            <span className={item.mttr > 4 ? "text-red-600" : "text-green-600"}>{safeToFixed(item.mttr)}h</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">MTBF:</span>
                            <span className={item.mtbf < 120 ? "text-red-600" : "text-green-600"}>{safeToFixed(item.mtbf)}h</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalEquipmentPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Halaman {equipmentCurrentPage} dari {totalEquipmentPages} ({filteredEquipmentData.length} total equipment)
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleEquipmentPrevPage}
                          disabled={equipmentCurrentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleEquipmentNextPage}
                          disabled={equipmentCurrentPage === totalEquipmentPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p>No equipment data available</p>
              )}
            </CardContent>
          </Card>

          {/* Category Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Analisis per Kategori</CardTitle>
              <CardDescription>
                Data untuk periode terpilih
                {currentMonth && ` - ${currentMonth}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredCategoryData.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={currentCategoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" name="Jumlah WO" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {currentCategoryData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{item.category}</p>
                          <p className="text-sm text-muted-foreground">{item.count} Work Orders</p>
                        </div>
                        <div className="text-right text-sm">
                          <p>
                            MTTR: <span className="font-medium">{safeToFixed(item.avgMttr)}h</span>
                          </p>
                          <p>
                            MTBF: <span className="font-medium">{safeToFixed(item.avgMtbf)}h</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Category Month-based Pagination Controls */}
                  {totalCategoryPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        {currentMonth} ({categoryCurrentPage} dari {totalCategoryPages} bulan)
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCategoryPrevPage}
                          disabled={categoryCurrentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCategoryNextPage}
                          disabled={categoryCurrentPage === totalCategoryPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p>No category data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Downtime Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Analisis Downtime</CardTitle>
            <CardDescription>Data untuk periode terpilih</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDowntimeData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={filteredDowntimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="planned"
                      stackId="1"
                      stroke="#10b981"
                      fill="#dcfce7"
                      name="Planned (jam)"
                    />
                    <Area
                      type="monotone"
                      dataKey="unplanned"
                      stackId="1"
                      stroke="#ef4444"
                      fill="#fee2e2"
                      name="Unplanned (jam)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{safeToFixed(totalPlanned)}</p>
                    <p className="text-sm text-muted-foreground">Total Planned</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{safeToFixed(totalUnplanned)}</p>
                    <p className="text-sm text-muted-foreground">Total Unplanned</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-2xl font-bold">{safeToFixed(total)}</p>
                    <p className="text-sm text-muted-foreground">Total Downtime</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-2xl font-bold">{unplannedRatio}%</p>
                    <p className="text-sm text-muted-foreground">Unplanned Ratio</p>
                  </div>
                </div>
              </>
            ) : (
              <p>No downtime data available</p>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
      </main>
    </div>
  );
}