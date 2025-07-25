// Next.js + Tailwind + Shadcn EnergyPage component (corrected)
// Struktur sudah dirapikan, fetch disatukan, date parsing aman

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Zap, Droplets, Fuel, TrendingUp, TrendingDown, AlertTriangle, Camera } from "lucide-react"
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart,
} from "recharts"
import { act, JSX, use, useEffect, useState } from "react";
import supabase from "@/lib/supabase";

const monthlyData = [
  { month: "Jan", listrik: 35000, air: 22000, cng: 12000 },
  { month: "Feb", listrik: 32000, air: 21000, cng: 11500 },
  { month: "Mar", listrik: 38000, air: 24000, cng: 13000 },
  { month: "Apr", listrik: 36000, air: 23000, cng: 12500 },
  { month: "May", listrik: 40000, air: 25000, cng: 14000 },
  { month: "Jun", listrik: 42000, air: 26000, cng: 14500 },
]

export default function EnergyPage() {
  const [energyData, setEnergyData] = useState<any[]>([]);
  const [latestDate, setLatestDate] = useState<Date | null>(null);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [filtered6Months, setFiltered6Months] = useState<any[]>([]);

  const [electricity, setElectricity] = useState(0);
  const [air, setAir] = useState(0);
  const [cng, setCng] = useState(0);

  const parseDateSafely = (str: string): Date | null => {
    const isoTry = new Date(str);
    if (!isNaN(isoTry.getTime())) return isoTry;
    const parts = str.split("/");
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts;
      const tryAlt = new Date(`${yyyy}-${mm}-${dd}`);
      return isNaN(tryAlt.getTime()) ? null : tryAlt;
    }
    return null;
  };

  useEffect(() => {
    fetch("http://localhost:8000/api/energy/")
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;

        const withBudget = data.map((entry: any) => {
          const date = parseDateSafely(entry.date);
          return {
            date: date?.toISOString() || "Invalid",
            listrik: entry.electricity_consumption ?? 0,
            air: entry.water_consumption ?? 0,
            cng: entry.cng_consumption ?? 0,
            budget_listrik: 15000,
            budget_air: 10000,
            budget_cng: 1000,
          };
        });

        setEnergyData(withBudget);
        setElectricity(withBudget.at(-1)?.listrik ?? 0);
        setAir(withBudget.at(-1)?.air ?? 0);
        setCng(withBudget.at(-1)?.cng ?? 0);

        const maxDate = new Date(
          Math.max(...withBudget.map((e) => new Date(e.date).getTime()))
        );
        setLatestDate(maxDate);

        const sevenDaysAgo = new Date(maxDate);
        sevenDaysAgo.setDate(maxDate.getDate() - 7);

        const filtered7 = withBudget.filter((e) => {
          const d = new Date(e.date);
          return d >= sevenDaysAgo && d <= maxDate;
        });
        setFiltered(filtered7);
      })
      .catch((err) => console.error("🔥 Fetch energy error:", err));
  }, []);

useEffect(() => {
  fetch("http://localhost:8000/api/energy_monthly/")
    .then((res) => res.json())
    .then((data) => {
      if (!Array.isArray(data)) return;

      // Helper function to parse the month name
      const parseMonthName = (monthName: string) => {
        // Append the year to form a valid date string
        const dateStr = `${monthName} 2024`; // Append a default year
        const date = new Date(dateStr); // Convert it to a Date object
        return date;
      };

      // Map the data to ensure it's parsed correctly
      const energy_monthly = data.map((entry: any) => {
        const date = parseMonthName(entry.month_name); // Parse month_name to Date
        const month = date ? date.toLocaleString('default', { month: 'short' }) : "Invalid"; // Get short month name
        return {
          date: date?.toISOString() || "Invalid",
          month_name: month, // Store the short month name
          listrik: entry.electricity_monthly ?? 0,
          air: entry.water_monthly ?? 0,
          cng: entry.cng_monthly ?? 0,
        };
      });

      // Set the energy data
      setEnergyData(energy_monthly);
      setElectricity(energy_monthly.at(-1)?.listrik ?? 0);
      setAir(energy_monthly.at(-1)?.air ?? 0);
      setCng(energy_monthly.at(-1)?.cng ?? 0);

      // Find the most recent date
      const maxDate = new Date(
        Math.max(...energy_monthly.map((e) => new Date(e.date).getTime()))
      );
      setLatestDate(maxDate);

      // Calculate the date 6 months ago
      const sixMonthsAgo = new Date(maxDate);
      sixMonthsAgo.setMonth(maxDate.getMonth() - 6);

      // Filter the data for the last 6 months
      const filtered6Months = energy_monthly.filter((e) => {
        const d = new Date(e.date);
        return d >= sixMonthsAgo && d <= maxDate;
      });

      setFiltered6Months(filtered6Months); // Store the filtered data
    })
    .catch((err) => console.error("🔥 Fetch energy error:", err));
}, []);


  const getUsagePct = (val: number, budget: number) => Math.round((val / budget) * 100);
  const getStatus = (pct: number) => {
    if (pct > 100) return { bg: "bg-red-100", text: "text-red-600", label: "Over" };
    if (pct > 80) return { bg: "bg-yellow-100", text: "text-yellow-600", label: "Warning" };
    return { bg: "bg-green-100", text: "text-green-600", label: "Normal" };
  };

  const CardEnergy = (title: string, icon: JSX.Element, val: number, budget: number, unit: string) => {
    const pct = getUsagePct(val, budget);
    const stat = getStatus(pct);
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{val.toLocaleString()} {unit}</div>
          <div className="flex justify-between mt-2 text-xs">
            <p className="text-muted-foreground">Budget: {budget.toLocaleString()} {unit}</p>
            <Badge className={stat.bg}>{pct}%</Badge>
          </div>
          <Progress value={pct} className="mt-2" />
          {pct > 100 && (
            <div className="flex gap-1 mt-2 text-xs text-red-600">
              <AlertTriangle className="h-3 w-3" /> Melebihi budget!
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        {CardEnergy("Listrik Hari Ini", <Zap className="h-4 w-4 text-yellow-500" />, electricity, 1500, "kWh")}
        {CardEnergy("Air Hari Ini", <Droplets className="h-4 w-4 text-blue-500" />, air, 1000, "m³")}
        {CardEnergy("CNG Hari Ini", <Fuel className="h-4 w-4 text-orange-500" />, cng, 500, "m³")}
      </div>

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Harian</TabsTrigger>
          <TabsTrigger value="monthly">Trend Bulanan</TabsTrigger>
          <TabsTrigger value="input">Input Data</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Trend Konsumsi Energi (7 Hari)</CardTitle>
              <CardDescription>Perbandingan konsumsi aktual vs budget harian</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={filtered}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} />
                  <YAxis />
                  <Tooltip labelFormatter={(v) => new Date(v).toLocaleDateString("id-ID")} />
                  <Area type="monotone" dataKey="listrik" stroke="#f59e0b" fill="#fef3c7" />
                  <Area type="monotone" dataKey="air" stroke="#3b82f6" fill="#dbeafe" />
                  <Area type="monotone" dataKey="cng" stroke="#f97316" fill="#fed7aa" />
                  <Line type="monotone" dataKey="budget_listrik" stroke="#ef4444" strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="budget_air" stroke="#ef4444" strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="budget_cng" stroke="#ef4444" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
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
        <BarChart data={filtered6Months}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month_name" /> {/* Ensure month_name exists in filtered6Months */}
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
                  <Button className="w-full">Simpan Data Listrik</Button>
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
                  <Button className="w-full">Simpan Data Air</Button>
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
                  <Button className="w-full">Simpan Data CNG</Button>
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
    </div>
  );
}
