"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Zap,
  Droplets,
  Fuel,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Camera,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  Line,
} from "recharts";

// Dummy data
const energyData: any[] | undefined = [/* ... */];
const monthlyData: any[] | undefined = [/* ... */];
const todayConsumption = { /* ... */ };

// === REFRESH ACCESS TOKEN FUNCTION ===
export async function refreshAccessToken(): Promise<string> {
  const refresh = localStorage.getItem("refreshToken");

  if (!refresh || refresh === "undefined") {
    alert("Sesi login habis. Silakan login ulang.");
    localStorage.clear();
    window.location.href = "/login";
    throw new Error("No valid refresh token found");
  }

  const res = await fetch("http://localhost:8000/api/token/refresh/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    localStorage.clear();
    window.location.href = "/login";
    throw new Error("Refresh token expired or invalid");
  }

  const data = await res.json();
  localStorage.setItem("accessToken", data.access);
  return data.access;
}

// === MAIN PAGE ===
export default function EnergyPage() {
  const [preview, setPreview] = useState<string | null>(null);

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleEnergySubmit = async (type: string) => {
    const date = (document.getElementById(`${type}-date`) as HTMLInputElement)?.value;
    const value = (document.getElementById(`${type}-value`) as HTMLInputElement)?.value;
    const meter = (document.getElementById(`${type}-meter`) as HTMLInputElement)?.value;
    const photo = (document.getElementById(`${type}-photo`) as HTMLInputElement)?.files?.[0];

    const formData = new FormData();
    formData.append("type", type);
    formData.append("date", date);
    formData.append("value", value);
    formData.append("meter_number", meter);
    if (photo) formData.append("photo", photo);

    let token = localStorage.getItem("accessToken");

    const fetchWithToken = async (jwtToken: string) => {
      return await fetch("http://localhost:8000/api/energy-input/create/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
        body: formData,
      });
    };

    let res = await fetchWithToken(token!);

    if (res.status === 401) {
      try {
        token = await refreshAccessToken();
        res = await fetchWithToken(token);
      } catch (error) {
        console.error("Gagal refresh token:", error);
        return;
      }
    }

    if (!res.ok) {
  const contentType = res.headers.get("content-type");
  let errorMessage = "Gagal mengirim data.";

  if (contentType && contentType.includes("application/json")) {
    const error = await res.json();
    errorMessage += " " + JSON.stringify(error);
  } else {
    const text = await res.text();
    errorMessage += " Server Error: " + text.slice(0, 200);
  }

  alert(errorMessage);
  return;
}


  }; 

  const getUsagePercentage = (current: number, budget: number) =>
    Math.round((current / budget) * 100);

  const getUsageStatus = (percentage: number) => {
    if (percentage > 100) return { color: "text-red-600", bg: "bg-red-100", status: "Over Budget" };
    if (percentage > 80) return { color: "text-yellow-600", bg: "bg-yellow-100", status: "Warning" };
    return { color: "text-green-600", bg: "bg-green-100", status: "Normal" };
  };

  const [todayConsumption, setTodayConsumption] = useState({
  listrik: { current: 0, budget: 0, unit: "kWh" },
  air: { current: 0, budget: 0, unit: "m³" },
  cng: { current: 0, budget: 0, unit: "m³" },
});



useEffect(() => {
  const fetchTodayConsumption = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("http://localhost:8000/api/energy-today/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();

        // Optional: cek bentuk datanya
        console.log("Data konsumsi hari ini:", data);

        // Jika data dalam bentuk array, kamu reshape dulu
        if (Array.isArray(data)) {
          const reshaped = {
            listrik: data.find((d) => d.type === "listrik") || { current: 0, budget: 0, unit: "kWh" },
            air: data.find((d) => d.type === "air") || { current: 0, budget: 0, unit: "m³" },
            cng: data.find((d) => d.type === "cng") || { current: 0, budget: 0, unit: "m³" },
          };
          setTodayConsumption(reshaped);
        } else {
          setTodayConsumption(data); // jika data sudah proper {listrik: {...}, air: {...}, cng: {...}}
        }
      } else {
        const errorText = await res.text();
        console.error("Gagal ambil data konsumsi hari ini:", res.status, errorText);
      }
    } catch (err) {
      console.error("Error fetching:", err);
    }
  };

  fetchTodayConsumption();
}, []);



  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Energy Monitoring</h1>
            <p className="text-sm text-muted-foreground">Monitor konsumsi energi harian dan bulanan</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600 border-green-600">
              Real-time Monitoring
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-6 p-6">
        {/* Today's Consumption Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Listrik */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Konsumsi Listrik Hari Ini</CardTitle>
              <Zap className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayConsumption.listrik.current.toLocaleString()} {todayConsumption.listrik.unit}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  Budget: {todayConsumption.listrik.budget.toLocaleString()} {todayConsumption.listrik.unit}
                </p>
                <Badge
                  className={
                    getUsageStatus(
                      getUsagePercentage(todayConsumption.listrik.current, todayConsumption.listrik.budget),
                    ).bg
                  }
                >
                  {getUsagePercentage(todayConsumption.listrik.current, todayConsumption.listrik.budget)}%
                </Badge>
              </div>
              <Progress
                value={getUsagePercentage(todayConsumption.listrik.current, todayConsumption.listrik.budget)}
                className="mt-2"
              />
              {getUsagePercentage(todayConsumption.listrik.current, todayConsumption.listrik.budget) > 100 && (
                <div className="flex items-center gap-1 mt-2 text-red-600 text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Melebihi budget harian!</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Air */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Konsumsi Air Hari Ini</CardTitle>
              <Droplets className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayConsumption.air.current.toLocaleString()} {todayConsumption.air.unit}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  Budget: {todayConsumption.air.budget.toLocaleString()} {todayConsumption.air.unit}
                </p>
                <Badge
                  className={
                    getUsageStatus(getUsagePercentage(todayConsumption.air.current, todayConsumption.air.budget)).bg
                  }
                >
                  {getUsagePercentage(todayConsumption.air.current, todayConsumption.air.budget)}%
                </Badge>
              </div>
              <Progress
                value={getUsagePercentage(todayConsumption.air.current, todayConsumption.air.budget)}
                className="mt-2"
              />
            </CardContent>
          </Card>

          {/* CNG */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Konsumsi CNG Hari Ini</CardTitle>
              <Fuel className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayConsumption.cng.current.toLocaleString()} {todayConsumption.cng.unit}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  Budget: {todayConsumption.cng.budget.toLocaleString()} {todayConsumption.cng.unit}
                </p>
                <Badge
                  className={
                    getUsageStatus(getUsagePercentage(todayConsumption.cng.current, todayConsumption.cng.budget)).bg
                  }
                >
                  {getUsagePercentage(todayConsumption.cng.current, todayConsumption.cng.budget)}%
                </Badge>
              </div>
              <Progress
                value={getUsagePercentage(todayConsumption.cng.current, todayConsumption.cng.budget)}
                className="mt-2"
              />
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList>
            <TabsTrigger value="daily">Monitoring Harian</TabsTrigger>
            <TabsTrigger value="monthly">Trend Bulanan</TabsTrigger>
            <TabsTrigger value="input">Input Data</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4">
            {/* Daily Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Konsumsi Energi 7 Hari Terakhir</CardTitle>
                <CardDescription>Perbandingan konsumsi aktual vs budget harian</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={energyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString("id-ID", { month: "short", day: "numeric" })
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleDateString("id-ID")}
                      formatter={(value, name) => [
                        value,
                        name === "listrik" ? "Listrik (kWh)" : name === "air" ? "Air (m³)" : "CNG (m³)",
                      ]}
                    />
                    <Area type="monotone" dataKey="listrik" stackId="1" stroke="#f59e0b" fill="#fef3c7" />
                    <Area type="monotone" dataKey="air" stackId="1" stroke="#3b82f6" fill="#dbeafe" />
                    <Area type="monotone" dataKey="cng" stackId="1" stroke="#f97316" fill="#fed7aa" />
                    <Line type="monotone" dataKey="budget_listrik" stroke="#ef4444" strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="budget_air" stroke="#ef4444" strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="budget_cng" stroke="#ef4444" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Daily Details */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Detail Listrik
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Konsumsi Hari Ini</span>
                    <span className="font-medium">1,600 kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Budget Harian</span>
                    <span className="font-medium">1,500 kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Selisih</span>
                    <span className="font-medium text-red-600">+100 kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Rata-rata 7 hari</span>
                    <span className="font-medium">1,343 kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Trend</span>
                    <div className="flex items-center gap-1 text-red-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">+12%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    Detail Air
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Konsumsi Hari Ini</span>
                    <span className="font-medium">950 m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Budget Harian</span>
                    <span className="font-medium">1,000 m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Selisih</span>
                    <span className="font-medium text-green-600">-50 m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Rata-rata 7 hari</span>
                    <span className="font-medium">840 m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Trend</span>
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingDown className="h-4 w-4" />
                      <span className="font-medium">-5%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Fuel className="h-5 w-5 text-orange-500" />
                    Detail CNG
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Konsumsi Hari Ini</span>
                    <span className="font-medium">480 m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Budget Harian</span>
                    <span className="font-medium">500 m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Selisih</span>
                    <span className="font-medium text-green-600">-20 m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Rata-rata 7 hari</span>
                    <span className="font-medium">430 m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Trend</span>
                    <div className="flex items-center gap-1 text-yellow-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">+8%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Trend Konsumsi Bulanan</CardTitle>
                <CardDescription>Perbandingan konsumsi energi 6 bulan terakhir</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="listrik" fill="#f59e0b" name="Listrik (kWh)" />
                    <Bar dataKey="air" fill="#3b82f6" name="Air (m³)" />
                    <Bar dataKey="cng" fill="#f97316" name="CNG (m³)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="input" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Input Listrik */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Input Data Listrik
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="listrik-date">Tanggal</Label>
                    <Input id="listrik-date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="listrik-value">Konsumsi (kWh)</Label>
                    <Input id="listrik-value" type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="listrik-meter">Nomor Meter</Label>
                    <Input id="listrik-meter" placeholder="PLN-001" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="listrik-photo">Upload Foto Meter</Label>
                    <div className="flex items-center gap-2">
                      <Input id="listrik-photo" type="file" accept="image/*" />
                      <Button size="icon" variant="outline">
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => handleEnergySubmit("listrik")}>
  Simpan Data Listrik
</Button>

                </CardContent>
              </Card>

              {/* Input Air */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    Input Data Air
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="air-date">Tanggal</Label>
                    <Input id="air-date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="air-value">Konsumsi (m³)</Label>
                    <Input id="air-value" type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="air-meter">Nomor Meter</Label>
                    <Input id="air-meter" placeholder="PDAM-001" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="air-photo">Upload Foto Meter</Label>
                    <div className="flex items-center gap-2">
                      <Input id="air-photo" type="file" accept="image/*" />
                      <Button size="icon" variant="outline">
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => handleEnergySubmit("air")}>
  Simpan Data Air
</Button>
                </CardContent>
              </Card>

              {/* Input CNG */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Fuel className="h-5 w-5 text-orange-500" />
                    Input Data CNG
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cng-date">Tanggal</Label>
                    <Input id="cng-date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cng-value">Konsumsi (m³)</Label>
                    <Input id="cng-value" type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cng-meter">Nomor Meter</Label>
                    <Input id="cng-meter" placeholder="CNG-001" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cng-photo">Upload Foto Meter</Label>
                    <div className="flex items-center gap-2">
                      <Input id="cng-photo" type="file" accept="image/*" />
                      <Button size="icon" variant="outline">
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => handleEnergySubmit("cng")}>
  Simpan Data CNG
</Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Entries */}
            <Card>
              <CardHeader>
                <CardTitle>Data Terbaru</CardTitle>
                <CardDescription>5 entri data terakhir</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { type: "Listrik", value: "1,600 kWh", date: "2024-01-07", time: "08:30", user: "Utility Team" },
                    { type: "Air", value: "950 m³", date: "2024-01-07", time: "08:25", user: "Utility Team" },
                    { type: "CNG", value: "480 m³", date: "2024-01-07", time: "08:20", user: "Utility Team" },
                    { type: "Listrik", value: "1,550 kWh", date: "2024-01-06", time: "17:45", user: "Utility Team" },
                    { type: "Air", value: "920 m³", date: "2024-01-06", time: "17:40", user: "Utility Team" },
                  ].map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            entry.type === "Listrik"
                              ? "bg-yellow-500"
                              : entry.type === "Air"
                                ? "bg-blue-500"
                                : "bg-orange-500"
                          }`}
                        />
                        <div>
                          <p className="font-medium">
                            {entry.type}: {entry.value}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {entry.date} {entry.time} - {entry.user}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">Verified</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
    }