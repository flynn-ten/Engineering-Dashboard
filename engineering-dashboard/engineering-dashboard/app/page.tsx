"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { AlertTriangle, Clock, Zap, Wrench } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { UserSwitcher } from "@/components/user-switcher"
import { RoleIndicator } from "@/components/role-indicator"

// Dummy data
const energyData = [
  { name: "Sen", listrik: 1200, air: 800, cng: 400 },
  { name: "Sel", listrik: 1100, air: 750, cng: 380 },
  { name: "Rab", listrik: 1300, air: 820, cng: 420 },
  { name: "Kam", listrik: 1250, air: 790, cng: 410 },
  { name: "Jum", listrik: 1400, air: 850, cng: 450 },
  { name: "Sab", listrik: 900, air: 600, cng: 300 },
  { name: "Min", listrik: 800, air: 550, cng: 280 },
]

const woStatusData = [
  { name: "Open", value: 12, color: "#ef4444" },
  { name: "In Progress", value: 8, color: "#f59e0b" },
  { name: "Completed", value: 25, color: "#10b981" },
]

const mttrData = [
  { month: "Jan", mttr: 4.2, mtbf: 120 },
  { month: "Feb", mttr: 3.8, mtbf: 135 },
  { month: "Mar", mttr: 4.5, mtbf: 110 },
  { month: "Apr", mttr: 3.2, mtbf: 145 },
  { month: "Mei", mttr: 3.9, mtbf: 125 },
  { month: "Jun", mttr: 3.1, mtbf: 150 },
]

export default function Dashboard() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Engineering Dashboard</h1>
            <p className="text-sm text-muted-foreground">Selamat datang di platform monitoring teknis terintegrasi</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-green-600 border-green-600">
              System Online
            </Badge>
            <UserSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-6 p-6">
        {/* Role Indicator */}
        <RoleIndicator currentRole="admin" />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Work Orders</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">20</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-500">+3</span> dari minggu lalu
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">-2</span> dari minggu lalu
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

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Energy Consumption */}
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

          {/* Work Order Status */}
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

        {/* Recent Activities & Notifications */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Work Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Work Orders Terbaru</CardTitle>
              <CardDescription>5 WO terakhir yang dibuat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: "WO-2024-001", title: "Perbaikan Pompa Air", status: "In Progress", priority: "High" },
                { id: "WO-2024-002", title: "Maintenance AC Unit 3", status: "Open", priority: "Medium" },
                { id: "WO-2024-003", title: "Kalibrasi Sensor Suhu", status: "Completed", priority: "Low" },
                { id: "WO-2024-004", title: "Penggantian Filter", status: "Open", priority: "Medium" },
                { id: "WO-2024-005", title: "Inspeksi Kelistrikan", status: "In Progress", priority: "High" },
              ].map((wo) => (
                <div key={wo.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{wo.title}</p>
                    <p className="text-xs text-muted-foreground">{wo.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        wo.priority === "High" ? "destructive" : wo.priority === "Medium" ? "default" : "secondary"
                      }
                    >
                      {wo.priority}
                    </Badge>
                    <Badge
                      variant={wo.status === "Completed" ? "default" : "outline"}
                      className={wo.status === "Completed" ? "bg-green-100 text-green-800" : ""}
                    >
                      {wo.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Notifications & Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Notifikasi & Peringatan</CardTitle>
              <CardDescription>Peringatan sistem terbaru</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  type: "warning",
                  title: "Konsumsi Listrik Tinggi",
                  message: "Konsumsi listrik hari ini melebihi budget 15%",
                  time: "2 jam lalu",
                },
                {
                  type: "error",
                  title: "CAPA Overdue",
                  message: "3 CAPA melewati due date dan perlu tindakan",
                  time: "4 jam lalu",
                },
                {
                  type: "info",
                  title: "WO Completed",
                  message: "WO-2024-003 telah diselesaikan oleh teknisi",
                  time: "6 jam lalu",
                },
                {
                  type: "warning",
                  title: "Maintenance Schedule",
                  message: "Jadwal maintenance preventif besok pagi",
                  time: "1 hari lalu",
                },
              ].map((notif, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div
                    className={`mt-0.5 w-2 h-2 rounded-full ${
                      notif.type === "error" ? "bg-red-500" : notif.type === "warning" ? "bg-yellow-500" : "bg-blue-500"
                    }`}
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{notif.title}</p>
                    <p className="text-xs text-muted-foreground">{notif.message}</p>
                    <p className="text-xs text-muted-foreground">{notif.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
