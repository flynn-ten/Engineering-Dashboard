"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp, TrendingDown, Clock, Wrench, AlertTriangle, CheckCircle } from "lucide-react"
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

// Dummy data untuk analytics
const mttrMtbfData = [
  { month: "Jan", mttr: 4.2, mtbf: 120, workOrders: 15 },
  { month: "Feb", mttr: 3.8, mtbf: 135, workOrders: 12 },
  { month: "Mar", mttr: 4.5, mtbf: 110, workOrders: 18 },
  { month: "Apr", mttr: 3.2, mtbf: 145, workOrders: 10 },
  { month: "May", mttr: 3.9, mtbf: 125, workOrders: 14 },
  { month: "Jun", mttr: 3.1, mtbf: 150, workOrders: 9 },
]

const equipmentData = [
  { equipment: "Pompa Air", mttr: 2.5, mtbf: 180, failures: 3 },
  { equipment: "AC Unit", mttr: 1.8, mtbf: 200, failures: 2 },
  { equipment: "Generator", mttr: 6.2, mtbf: 90, failures: 8 },
  { equipment: "Kompresor", mttr: 4.1, mtbf: 120, failures: 5 },
  { equipment: "Conveyor", mttr: 3.3, mtbf: 160, failures: 4 },
]

const categoryData = [
  { category: "MTC", count: 25, avgMttr: 3.5, avgMtbf: 140 },
  { category: "CAL", count: 8, avgMttr: 2.1, avgMtbf: 200 },
  { category: "UTY", count: 12, avgMttr: 4.2, avgMtbf: 110 },
]

const downtimeData = [
  { week: "W1", planned: 8, unplanned: 12, total: 20 },
  { week: "W2", planned: 6, unplanned: 8, total: 14 },
  { week: "W3", planned: 10, unplanned: 15, total: 25 },
  { week: "W4", planned: 4, unplanned: 6, total: 10 },
]

export default function AnalyticsPage() {
  const currentMTTR = 3.1
  const currentMTBF = 150
  const previousMTTR = 3.9
  const previousMTBF = 125

  const mttrTrend = ((currentMTTR - previousMTTR) / previousMTTR) * 100
  const mtbfTrend = ((currentMTBF - previousMTBF) / previousMTBF) * 100

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
            <Select defaultValue="6months">
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
              <div className="text-2xl font-bold">{currentMTTR} jam</div>
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
              <div className="text-2xl font-bold">{currentMTBF} jam</div>
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

        {/* MTTR & MTBF Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Trend MTTR & MTBF (6 Bulan Terakhir)</CardTitle>
            <CardDescription>Mean Time To Repair dan Mean Time Between Failures</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={mttrMtbfData}>
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
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Equipment Performance & Category Analysis */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Equipment Performance */}
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
                        <span className={item.mttr > 4 ? "text-red-600" : "text-green-600"}>{item.mttr}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">MTBF:</span>
                        <span className={item.mtbf < 120 ? "text-red-600" : "text-green-600"}>{item.mtbf}h</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Analysis */}
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
                      <p className="font-medium">{item.category}</p>
                      <p className="text-sm text-muted-foreground">{item.count} Work Orders</p>
                    </div>
                    <div className="text-right text-sm">
                      <p>
                        MTTR: <span className="font-medium">{item.avgMttr}h</span>
                      </p>
                      <p>
                        MTBF: <span className="font-medium">{item.avgMtbf}h</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Downtime Analysis */}
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
                <p className="text-2xl font-bold text-green-600">28h</p>
                <p className="text-sm text-muted-foreground">Total Planned</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold text-red-600">41h</p>
                <p className="text-sm text-muted-foreground">Total Unplanned</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold">69h</p>
                <p className="text-sm text-muted-foreground">Total Downtime</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold">59%</p>
                <p className="text-sm text-muted-foreground">Unplanned Ratio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
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
      </main>
    </div>
  )
}
