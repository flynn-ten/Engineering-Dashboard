"use client"


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp, TrendingDown, Clock, Wrench, AlertTriangle, CheckCircle, Download } from "lucide-react"
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
import { useEffect, useState, useRef } from "react"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
import { Button } from "@/components/ui/button"


interface AnalyticsData {
  date: string;
  mttr_hours: number;
  mtbf_hours: number;
  failure_count: number;
}


interface CategoryData {
  resource?: string;
  category?: string;
  count: number;
  avgMttr: number;
  avgMtbf: number;
  date?: string;
}


interface EquipmentData {
  asset_group?: string;
  equipment?: string;
  mttr: number;
  mtbf: number;
  failures: number;
  date?: string;
}


interface DowntimeData {
  week: string;
  month?: string;
  planned: number;
  unplanned: number;
  total: number;
  date?: string;
}


export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [mttr_hours, setMttr_hours] = useState<number>(0);
  const [mtbf_hours, setMtbf_hours] = useState<number>(0);
  const [failure_count, setFailure_count] = useState<number>(0);
  const [analyticsData, setAnalytic_data] = useState<AnalyticsData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [equipmentData, setEquipmentData] = useState<EquipmentData[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [downtimeData, setDowntimeData] = useState<DowntimeData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("6months");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);


  const formatNumber = (value: unknown, decimals: number = 1): string => {
    const num = typeof value === 'number' ? value :
               typeof value === 'string' ? parseFloat(value) : 0;
    return isNaN(num) ? '0' : num.toFixed(decimals);
  };


  const calculateTrend = (current: number, previous: number): number => {
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  };


  // Filter data by selected period
  const filterDataByPeriod = <T extends { date?: string }>(data: T[]): T[] => {
    if (!Array.isArray(data)) return [];
   
    const now = new Date();
    let cutoffDate = new Date();


    switch (selectedPeriod) {
      case "1month":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "3months":
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case "1year":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default: // 6months
        cutoffDate.setMonth(now.getMonth() - 6);
    }


    return data.filter(item => {
      if (!item.date) return true;
      try {
        const itemDate = new Date(item.date);
        return itemDate >= cutoffDate;
      } catch {
        return false;
      }
    });
  };


  // Process data for charts based on selected period
  const processTrendData = (data: AnalyticsData[]) => {
    const filteredData = filterDataByPeriod(data);


    const grouped: Record<string, {
      mttr_total: number;
      mtbf_total: number;
      failure_total: number;
      count: number;
    }> = {};


    const formatKey = (date: Date): string => {
      switch (selectedPeriod) {
        case "1month":
          return date.toISOString().split("T")[0]; // per day
        case "3months": {
          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay()); // Sunday
          return `W-${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
        }
        case "6months": {
          const day = date.getDate();
          const start = day <= 15 ? 1 : 16;
          return `H-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${start === 1 ? '01-15' : '16-30'}`;
        }
        case "1year":
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        default:
          return date.toISOString().split("T")[0];
      }
    };


    for (const item of filteredData) {
      if (!item.date) continue;
      const date = new Date(item.date);
      const key = formatKey(date);


      if (!grouped[key]) {
        grouped[key] = { mttr_total: 0, mtbf_total: 0, failure_total: 0, count: 0 };
      }


      grouped[key].mttr_total += item.mttr_hours || 0;
      grouped[key].mtbf_total += item.mtbf_hours || 0;
      grouped[key].failure_total += item.failure_count || 0;
      grouped[key].count++;
    }


    return Object.entries(grouped).map(([key, value]) => ({
      date: key,
      mttr_hours: value.count > 0 ? value.mttr_total / value.count : 0,
      mtbf_hours: value.count > 0 ? value.mtbf_total / value.count : 0,
      failure_count: value.failure_total
    }));
  };


  // Process category data for period
  const processCategoryData = (data: CategoryData[]) => {
    return filterDataByPeriod(data);
  };


  // Process equipment data for period
  const processEquipmentData = (data: EquipmentData[]) => {
    return filterDataByPeriod(data);
  };


  // Process downtime data for period
  const processDowntimeData = (data: DowntimeData[]) => {
    const filteredData = filterDataByPeriod(data);
   
    if (selectedPeriod === "1year") {
      const monthlyData: Record<string, any> = {};
      filteredData.forEach(item => {
        if (!item?.week && !item?.date) return;
       
        try {
          const date = new Date(item.week || item.date || '');
          if (isNaN(date.getTime())) return;
         
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
         
          if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = {
              month: monthYear,
              planned: 0,
              unplanned: 0,
              total: 0
            };
          }
         
          monthlyData[monthYear].planned += Number(item.planned) || 0;
          monthlyData[monthYear].unplanned += Number(item.unplanned) || 0;
          monthlyData[monthYear].total += Number(item.total) || 0;
        } catch (e) {
          console.error("Error processing week:", e);
        }
      });


      return Object.values(monthlyData);
    }
    return filteredData;
  };


  const handleDownloadPDF = async () => {
    if (!dashboardRef.current) return;


    setIsGeneratingPDF(true);


    try {
      const element = dashboardRef.current.cloneNode(true) as HTMLElement;
     
      const elementsToRemove = element.querySelectorAll(
        '.no-print, .role-indicator, header, .pdf-exclude, button'
      );
      elementsToRemove.forEach(el => el.remove());


      element.style.padding = '20px';
      element.style.width = '100%';
      element.style.backgroundColor = 'white';


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


      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const marginLeft = 10;


      pdf.setFontSize(18);
      pdf.setTextColor(40);
      pdf.text('Analytics Dashboard Report', 105, 15, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleString()} | Period: ${getPeriodLabel()}`, 105, 22, { align: 'center' });


      pdf.addImage(imgData, 'PNG', marginLeft, 30, imgWidth, imgHeight);


      pdf.save(`analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };


  const fetchAllData = async (period: string) => {
    setIsLoading(true);
    try {
      const [
        analyticsRes,
        categoryRes,
        equipmentRes,
        trendRes,
        downtimeRes
      ] = await Promise.all([
        fetch(`http://localhost:8000/api/analytics/?period=${period}`),
        fetch(`http://localhost:8000/api/category-analytics/?period=${period}`),
        fetch(`http://localhost:8000/api/equipment-analytics/?period=${period}`),
        fetch(`http://localhost:8000/api/monthly-trend/?period=${period}`),
        fetch(`http://localhost:8000/api/downtime/?period=${period}`),
      ]);


      const [
        analytics,
        categories,
        equipment,
        trend,
        downtime
      ] = await Promise.all([
        analyticsRes.json(),
        categoryRes.json(),
        equipmentRes.json(),
        trendRes.json(),
        downtimeRes.json(),
      ]);


      setAnalytic_data(Array.isArray(analytics) ? analytics.map(item => ({
        date: item?.date || '',
        mttr_hours: Number(item?.mttr_hours) || 0,
        mtbf_hours: Number(item?.mtbf_hours) || 0,
        failure_count: Number(item?.failure_count) || 0
      })) : []);


      setCategoryData(Array.isArray(categories) ? categories.map(item => ({
        category: item?.category || item?.resource || '',
        count: Number(item?.count) || 0,
        avgMttr: Number(item?.avgMttr) || 0,
        avgMtbf: Number(item?.avgMtbf) || 0,
        date: item?.date || ''
      })) : []);


      setEquipmentData(Array.isArray(equipment) ? equipment.map(item => ({
        equipment: item?.equipment || item?.asset_group || '',
        mttr: Number(item?.mttr) || 0,
        mtbf: Number(item?.mtbf) || 0,
        failures: Number(item?.failures) || 0,
        date: item?.date || ''
      })) : []);


      setMonthlyTrend(Array.isArray(trend) ? trend : []);
      setDowntimeData(Array.isArray(downtime) ? downtime.map(item => ({
        week: item?.week || '',
        planned: Number(item?.planned) || 0,
        unplanned: Number(item?.unplanned) || 0,
        total: Number(item?.total) || 0,
        date: item?.date || ''
      })) : []);


      if (Array.isArray(analytics) && analytics.length > 0) {
        const latest = analytics[analytics.length - 1];
        setMttr_hours(Number(latest?.mttr_hours) || 0);
        setMtbf_hours(Number(latest?.mtbf_hours) || 0);
        setFailure_count(Number(latest?.failure_count) || 0);
      } else {
        setMttr_hours(0);
        setMtbf_hours(0);
        setFailure_count(0);
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setMttr_hours(0);
      setMtbf_hours(0);
      setFailure_count(0);
      setAnalytic_data([]);
      setCategoryData([]);
      setEquipmentData([]);
      setMonthlyTrend([]);
      setDowntimeData([]);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchAllData(selectedPeriod);
  }, [selectedPeriod]);


  // Process all data based on selected period
  const processedTrendData = processTrendData(analyticsData);
  const processedCategoryData = processCategoryData(categoryData);
  const processedEquipmentData = processEquipmentData(equipmentData);
  const processedDowntimeData = processDowntimeData(downtimeData);


  // Calculate average values from processed trend data
  const avgMttr = processedTrendData.length
    ? processedTrendData.reduce((sum, d) => sum + d.mttr_hours, 0) / processedTrendData.length
    : 0;


  const avgMtbf = processedTrendData.length
    ? processedTrendData.reduce((sum, d) => sum + d.mtbf_hours, 0) / processedTrendData.length
    : 0;


  const totalFailures = processedTrendData.reduce((sum, d) => sum + d.failure_count, 0);


  // Previous values for trend calculation
  const previousMTTR = 3.9;
  const previousMTBF = 125;


  const mttrTrend = calculateTrend(avgMttr, previousMTTR);
  const mtbfTrend = calculateTrend(avgMtbf, previousMTBF);


  // Calculate downtime stats from processed data
  const totalPlanned = processedDowntimeData.reduce((acc, d) => acc + (d?.planned || 0), 0);
  const totalUnplanned = processedDowntimeData.reduce((acc, d) => acc + (d?.unplanned || 0), 0);
  const total = totalPlanned + totalUnplanned;
  const unplannedRatio = total ? Math.round((totalUnplanned / total) * 100) : 0;


  // Format X-axis labels for downtime chart
  const formatDowntimeXAxis = (value: string) => {
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;


      if (selectedPeriod === "1year") {
        return date.toLocaleString('id-ID', { month: 'short' });
      } else if (selectedPeriod === "1month") {
        return date.getDate().toString();
      } else {
        const oneJan = new Date(date.getFullYear(), 0, 1);
        const weekNumber = Math.ceil(
          ((date.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7
        );
        return `W${weekNumber}`;
      }
    } catch {
      return value;
    }
  };


  // Format tooltip for downtime chart
  const formatDowntimeTooltip = (label: string) => {
    try {
      const date = new Date(label);
      if (isNaN(date.getTime())) return label;


      if (selectedPeriod === "1year") {
        return date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
      } else if (selectedPeriod === "1month") {
        return `Tanggal ${date.getDate()} ${date.toLocaleString('id-ID', { month: 'long' })}`;
      } else {
        return `Minggu ke-${Math.ceil(date.getDate() / 7)}, ${date.toLocaleString('id-ID', { month: 'long' })}`;
      }
    } catch {
      return label;
    }
  };


  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case "1month": return "1 Bulan Terakhir";
      case "3months": return "3 Bulan Terakhir";
      case "1year": return "1 Tahun Terakhir";
      default: return "6 Bulan Terakhir";
    }
  };


  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 no-print">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">Analisis performa MTTR, MTBF, dan efisiensi maintenance</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">1 Bulan Terakhir</SelectItem>
                <SelectItem value="3months">3 Bulan Terakhir</SelectItem>
                <SelectItem value="6months">6 Bulan Terakhir</SelectItem>
                <SelectItem value="1year">1 Tahun Terakhir</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 no-print"
              disabled={isGeneratingPDF}
            >
              <Download className="h-4 w-4" />
              {isGeneratingPDF ? "Generating..." : "PDF"}
            </Button>
          </div>
        </div>
      </header>


      <main className="flex-1 space-y-6 p-6" ref={dashboardRef}>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p>Loading data...</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current MTTR</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(avgMttr)} jam</div>
                  <div className="flex items-center gap-1 text-xs">
                    {mttrTrend < 0 ? (
                      <>
                        <TrendingDown className="h-3 w-3 text-green-500" />
                        <span className="text-green-500">{Math.abs(mttrTrend).toFixed(1)}% lebih baik</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-3 w-3 text-red-500" />
                        <span className="text-red-500">{mttrTrend.toFixed(1)}% lebih buruk</span>
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
                  <div className="text-2xl font-bold">{formatNumber(avgMtbf)} jam</div>
                  <div className="flex items-center gap-1 text-xs">
                    {mtbfTrend > 0 ? (
                      <>
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-green-500">{mtbfTrend.toFixed(1)}% lebih baik</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3 w-3 text-red-500" />
                        <span className="text-red-500">{Math.abs(mtbfTrend).toFixed(1)}% lebih buruk</span>
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
                  <div className="text-2xl font-bold">94.2%</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500">+2.1%</span> dari bulan lalu
                  </p>
                </CardContent>
              </Card>


              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Failures</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalFailures}</div>
                  <p className="text-xs text-muted-foreground">Dalam periode {getPeriodLabel().toLowerCase()}</p>
                </CardContent>
              </Card>
            </div>


            <Card>
              <CardHeader>
                <CardTitle>Trend MTTR & MTBF ({getPeriodLabel()})</CardTitle>
                <CardDescription>Mean Time To Repair dan Mean Time Between Failures</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={processedTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => {
                        if (selectedPeriod === "1month") return value.split("-")[2]; // show day
                        if (selectedPeriod === "3months") return value.slice(2);     // "W-24-07-01"
                        if (selectedPeriod === "6months") return value.slice(2);     // "H-24-07-01-15"
                        if (selectedPeriod === "1year") return value.split("-")[1];  // show month
                        return value;
                      }}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "MTTR (jam)" || name === "MTBF (jam)") {
                          return [Number(value).toFixed(1), name];
                        }
                        return [value, name];
                      }}
                    />
                    <Bar yAxisId="left" dataKey="failure_count" fill="#e5e7eb" name="Jumlah Failure" />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="mttr_hours"
                      stroke="#ef4444"
                      strokeWidth={3}
                      name="MTTR (jam)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="mtbf_hours"
                      stroke="#10b981"
                      strokeWidth={3}
                      name="MTBF (jam)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>


            <Card>
              <CardHeader>
                <CardTitle>Analisis Downtime</CardTitle>
                <CardDescription>
                  Perbandingan planned vs unplanned downtime ({getPeriodLabel()})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {processedDowntimeData.length > 0 ? (
                  <>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={processedDowntimeData}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis
                            dataKey={selectedPeriod === "1year" ? "month" : "week"}
                            tickFormatter={formatDowntimeXAxis}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis
                            tickFormatter={(value) => `${value}j`}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip
                            formatter={(value: number, name: string) => [
                              `${value.toFixed(1)} jam`,
                              name === 'planned' ? 'Planned' : 'Unplanned'
                            ]}
                            labelFormatter={formatDowntimeTooltip}
                            contentStyle={{
                              borderRadius: '8px',
                              border: 'none',
                              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="planned"
                            stackId="1"
                            stroke="#10b981"
                            fill="#dcfce7"
                            name="planned"
                          />
                          <Area
                            type="monotone"
                            dataKey="unplanned"
                            stackId="1"
                            stroke="#ef4444"
                            fill="#fee2e2"
                            name="unplanned"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>


                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="bg-green-50 border-green-100">
                        <CardHeader className="flex flex-row items-center justify-between p-4">
                          <div>
                            <p className="text-sm font-medium text-green-800">Planned</p>
                            <p className="text-2xl font-bold text-green-600">
                              {totalPlanned.toFixed(1)}j
                            </p>
                          </div>
                          <CheckCircle className="h-6 w-6 text-green-400" />
                        </CardHeader>
                      </Card>


                      <Card className="bg-red-50 border-red-100">
                        <CardHeader className="flex flex-row items-center justify-between p-4">
                          <div>
                            <p className="text-sm font-medium text-red-800">Unplanned</p>
                            <p className="text-2xl font-bold text-red-600">
                              {totalUnplanned.toFixed(1)}j
                            </p>
                          </div>
                          <AlertTriangle className="h-6 w-6 text-red-400" />
                        </CardHeader>
                      </Card>


                      <Card className="bg-blue-50 border-blue-100">
                        <CardHeader className="flex flex-row items-center justify-between p-4">
                          <div>
                            <p className="text-sm font-medium text-blue-800">Total</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {total.toFixed(1)}j
                            </p>
                          </div>
                          <Clock className="h-6 w-6 text-blue-400" />
                        </CardHeader>
                      </Card>


                      <Card className="bg-amber-50 border-amber-100">
                        <CardHeader className="flex flex-row items-center justify-between p-4">
                          <div>
                            <p className="text-sm font-medium text-amber-800">Unplanned Ratio</p>
                            <p className="text-2xl font-bold text-amber-600">
                              {unplannedRatio.toFixed(1)}%
                            </p>
                          </div>
                          <TrendingUp className="h-6 w-6 text-amber-400" />
                        </CardHeader>
                      </Card>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <BarChart3 className="h-10 w-10 text-gray-400" />
                    <p className="text-gray-500 font-medium">Tidak ada data downtime</p>
                    <p className="text-sm text-gray-400 text-center max-w-md">
                      {selectedPeriod === "1year"
                        ? "Tidak ditemukan data downtime untuk periode satu tahun terakhir"
                        : "Data downtime tidak tersedia untuk periode yang dipilih"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>


            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Performa Equipment</CardTitle>
                  <CardDescription>MTTR dan MTBF per equipment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {equipmentData.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.equipment || item.asset_group || `Equipment ${index + 1}`}</span>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={item.failures > 5 ? "destructive" : item.failures > 3 ? "default" : "secondary"}
                            >
                              {item.failures || 0} failures
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">MTTR:</span>
                            <span className={item.mttr > 4 ? "text-red-600" : "text-green-600"}>
                              {formatNumber(item.mttr)}h
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">MTBF:</span>
                            <span className={item.mtbf < 120 ? "text-red-600" : "text-green-600"}>
                              {formatNumber(item.mtbf)}h
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>


              <Card>
                <CardHeader>
                  <CardTitle>Analisis per Kategori</CardTitle>
                  <CardDescription>Performa maintenance berdasarkan kategori</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" name="Jumlah WO" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-3">
                    {categoryData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{item.category || item.resource || `Kategori ${index + 1}`}</p>
                          <p className="text-sm text-muted-foreground">{item.count || 0} Work Orders</p>
                        </div>
                        <div className="text-right text-sm">
                          <p>
                            MTTR: <span className="font-medium">{formatNumber(item.avgMttr)}h</span>
                          </p>
                          <p>
                            MTBF: <span className="font-medium">{formatNumber(item.avgMtbf)}h</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

