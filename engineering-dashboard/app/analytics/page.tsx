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

  // Calculate trends
  const currentMTTR = mttr_hours;
  const currentMTBF = mtbf_hours;
  const previousMTTR = 3.9;
  const previousMTBF = 125;

  const mttrTrend = ((currentMTTR - previousMTTR) / previousMTTR) * 100;
  const mtbfTrend = ((currentMTBF - previousMTBF) / previousMTBF) * 100;

  // Filter data berdasarkan periode yang dipilih
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
      if (!item.date) return true; // Jika tidak ada date, include semua
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
    
    if (selectedPeriod === "1year") {
      const monthlyData: Record<string, any> = {};
      filteredData.forEach(item => {
        if (!item?.date) return;
        
        try {
          const date = new Date(item.date);
          if (isNaN(date.getTime())) return;
          
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = {
              date: monthYear,
              mttr_hours: 0,
              mtbf_hours: 0,
              failure_count: 0,
              count: 0
            };
          }
          
          monthlyData[monthYear].mttr_hours += Number(item.mttr_hours) || 0;
          monthlyData[monthYear].mtbf_hours += Number(item.mtbf_hours) || 0;
          monthlyData[monthYear].failure_count += Number(item.failure_count) || 0;
          monthlyData[monthYear].count++;
        } catch (e) {
          console.error("Error processing date:", e);
        }
      });

      return Object.values(monthlyData).map(month => ({
        date: month.date,
        mttr_hours: month.count > 0 ? month.mttr_hours / month.count : 0,
        mtbf_hours: month.count > 0 ? month.mtbf_hours / month.count : 0,
        failure_count: month.failure_count
      }));
    }
    return filteredData;
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
    
    // Untuk downtime, kita mungkin ingin mempertahankan struktur mingguan
    if (selectedPeriod === "1year") {
      // Agregasi bulanan untuk downtime jika periode 1 tahun
      const monthlyData: Record<string, any> = {};
      filteredData.forEach(item => {
        if (!item?.week) return;
        
        try {
          const date = new Date(item.week);
          if (isNaN(date.getTime())) return;
          
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = {
              week: monthYear,
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
      // Clone the element and remove unwanted parts
      const element = dashboardRef.current.cloneNode(true) as HTMLElement;
      
      // Remove elements that shouldn't be in PDF
      const elementsToRemove = element.querySelectorAll(
        '.no-print, .role-indicator, header, .pdf-exclude, button'
      );
      elementsToRemove.forEach(el => el.remove());

      // Apply print-specific styles
      element.style.padding = '20px';
      element.style.width = '100%';
      element.style.backgroundColor = 'white';

      // Create temporary container
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
      pdf.text('Analytics Dashboard Report', 105, 15, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleString()} | Period: ${getPeriodLabel()}`, 105, 22, { align: 'center' });

      // Add content with proper margins
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

  const processedTrendData = processTrendData(analyticsData);
  const processedCategoryData = processCategoryData(categoryData);
  const processedEquipmentData = processEquipmentData(equipmentData);
  const processedDowntimeData = processDowntimeData(downtimeData);

  // Calculate downtime stats from processed data
  const totalPlanned = processedDowntimeData.reduce((acc, d) => acc + (d?.planned || 0), 0);
  const totalUnplanned = processedDowntimeData.reduce((acc, d) => acc + (d?.unplanned || 0), 0);
  const total = totalPlanned + totalUnplanned;
  const unplannedRatio = total ? Math.round((totalUnplanned / total) * 100) : 0;

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
                  <div className="text-2xl font-bold">{formatNumber(mttr_hours)} jam</div>
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
                  <div className="text-2xl font-bold">{formatNumber(mtbf_hours)} jam</div>
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
                  <CardTitle className="text-sm font-medium">Critical Equipment</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2</div>
                  <p className="text-xs text-muted-foreground">Perlu perhatian khusus</p>
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
                        if (selectedPeriod === "1year") {
                          return value.split('-')[1];
                        }
                        return value.includes('-') ? value.split('-')[2] : value;
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

            <Card>
              <CardHeader>
                <CardTitle>Analisis Downtime</CardTitle>
                <CardDescription>Perbandingan planned vs unplanned downtime (4 minggu terakhir)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={downtimeData}>
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
                    <p className="text-2xl font-bold text-green-600">{formatNumber(totalPlanned, 0)}</p>
                    <p className="text-sm text-muted-foreground">Total Planned</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{formatNumber(totalUnplanned, 0)}</p>
                    <p className="text-sm text-muted-foreground">Total Unplanned</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-2xl font-bold">{formatNumber(total, 0)}</p>
                    <p className="text-sm text-muted-foreground">Total Downtime</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-2xl font-bold">{unplannedRatio}%</p>
                    <p className="text-sm text-muted-foreground">Unplanned Ratio</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rekomendasi Perbaikan</CardTitle>
                <CardDescription>Berdasarkan analisis data performa</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 border rounded-lg bg-red-50">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-800">Generator - Perlu Perhatian Khusus</h4>
                      <p className="text-sm text-red-700 mt-1">
                        MTTR tinggi (6.2 jam) dan MTBF rendah (90 jam). Pertimbangkan untuk melakukan overhaul atau
                        penggantian komponen kritis.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 border rounded-lg bg-yellow-50">
                    <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Tingkatkan Preventive Maintenance</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Rasio unplanned downtime masih tinggi (59%). Tingkatkan frekuensi preventive maintenance untuk
                        mengurangi unplanned failures.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 border rounded-lg bg-blue-50">
                    <BarChart3 className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800">Optimasi Kategori MTC</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Kategori MTC memiliki volume tertinggi (25 WO). Pertimbangkan untuk menganalisis root cause dan
                        implementasi predictive maintenance.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 border rounded-lg bg-green-50">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-800">Performa AC Unit Excellent</h4>
                      <p className="text-sm text-green-700 mt-1">
                        AC Unit menunjukkan performa terbaik dengan MTTR rendah (1.8 jam) dan MTBF tinggi (200 jam). Gunakan
                        sebagai benchmark untuk equipment lain.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}