"use client"
import { Trash2 } from 'lucide-react';
import { JSX, useEffect, useState, useCallback } from "react";
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
  RefreshCw,
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
} from "recharts"


// Types
interface EnergyEntry {
  id: number;
  date: string;
  type: string;
  value: number;
  meter_number: string;
  photo?: string;
}


interface EnergyData {
  date: string;
  listrik: number;
  air: number;
  cng: number;
  budget_listrik: number;
  budget_air: number;
  budget_cng: number;
}


interface MonthlyData extends EnergyData {
  month_name: string;
}


export default function EnergyPage() {
  const [energyData, setEnergyData] = useState<EnergyData[]>([]);
  const [latestDate, setLatestDate] = useState<Date | null>(null);
  const [filtered, setFiltered] = useState<EnergyData[]>([]);
  const [filtered6Months, setFiltered6Months] = useState<MonthlyData[]>([]);
  const [latestEntries, setLatestEntries] = useState<EnergyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({
    listrik: null,
    air: null,
    cng: null
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [predictedCNG, setPredictedCNG] = useState<number>(500);
  const [predictedElectricity, setPredictedElectricity] = useState<number>(0);
  const [predictedWater, setPredictedWater] = useState<number>(0);

  const [electricity, setElectricity] = useState(0);
  const [air, setAir] = useState(0);
  const [cng, setCng] = useState(0);

  const fetchPredictedWater = async () => {
  try {
    let token = getStoredToken();
    if (!token) {
      const newToken = await refreshAccessToken();
      if (!newToken) throw new Error("No token");
      token = newToken;
    }

    const res = await fetch("http://localhost:8000/api/predict-water/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (res.ok) {
      setPredictedWater(data.predicted_water);
    } else {
      console.error("Prediction error:", data.error);
    }
  } catch (err) {
    console.error("Failed to fetch predicted water:", err);
  }
};

  const fetchPredictedCNG = async () => {
  try {
    let token = getStoredToken();
    if (!token) {
      const newToken = await refreshAccessToken();
      if (!newToken) throw new Error("No token");
      token = newToken;
    }

    const res = await fetch("http://localhost:8000/api/predict-cng/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (res.ok) {
      setPredictedCNG(data.predicted_cng);
    } else {
      console.error("Prediction error:", data.error);
    }
  } catch (err) {
    console.error("Failed to fetch predicted CNG:", err);
  }
};

  const fetchPredictedElectricity = async () => {
  try {
    let token = getStoredToken(); // ambil dari localStorage
    if (!token) {
      const newToken = await refreshAccessToken();
      if (!newToken) throw new Error("No token");
      token = newToken;
    }

    const res = await fetch("http://localhost:8000/api/predict-electricity/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (res.ok) {
      setPredictedElectricity(data.predicted_electricity);
    } else {
      console.error("Prediction error:", data.error);
    }
  } catch (err) {
    console.error("Failed to fetch predicted electricity:", err);
  }
};


  // Safe date parsing
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


  // Token management
  const getStoredToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  };


  const getRefreshToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh');
  };


  const setTokens = (accessToken: string, refreshToken?: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh', refreshToken);
    }
  };


  const clearTokens = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refresh');
  };


  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        console.warn('No refresh token available');
        return null;
      }


      const response = await fetch('http://localhost:8000/api/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken })
      });


      if (!response.ok) {
        console.error('Token refresh failed:', response.status, response.statusText);
        if (response.status === 401) {
          clearTokens();
          setAuthError('Session expired. Please login again.');
        }
        return null;
      }


      const data = await response.json();
      setTokens(data.access);
      setAuthError(null);
      return data.access;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  };


  const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    let token = getStoredToken();
   
    if (!token) {
      throw new Error('No authentication token available');
    }


    let response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      }
    });


    if (response.status === 401) {
      console.log('Token expired, attempting refresh...');
      const newToken = await refreshAccessToken();
     
      if (!newToken) {
        throw new Error('Unable to refresh authentication token');
      }


      response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${newToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        }
      });
    }


    return response;
  };


  // Data fetching functions
  const fetchDailyEnergyData = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8000/api/energy/");
      const data = await response.json();
     
      if (!Array.isArray(data)) return;


      const withBudget = data.map((entry: any) => {
        const date = parseDateSafely(entry.date);
        return {
          date: date?.toISOString() || "Invalid",
          listrik: entry.electricity_consumption ?? 0,
          air: entry.water_consumption ?? 0,
          cng: entry.cng_consumption ?? 0,
          budget_listrik: 1500,
          budget_air: 1000,
          budget_cng: 500,
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
    } catch (err) {
      console.error("Failed to fetch daily energy data:", err);
    }
  }, []);


  const fetchMonthlyEnergyData = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8000/api/energy_monthly/");
      const data = await response.json();
     
      if (!Array.isArray(data)) return;


      const parseMonthName = (monthName: string) => {
        const dateStr = `${monthName} 2024`;
        const date = new Date(dateStr);
        return date;
      };


      const energy_monthly = data.map((entry: any) => {
        const date = parseMonthName(entry.month_name);
        const month = date ? date.toLocaleString('default', { month: 'short' }) : "Invalid";
        return {
          date: date?.toISOString() || "Invalid",
          month_name: month,
          listrik: entry.electricity_monthly ?? 0,
          air: entry.water_monthly ?? 0,
          cng: entry.cng_monthly ?? 0,
        };
      });


      const maxDate = new Date(
        Math.max(...energy_monthly.map((e) => new Date(e.date).getTime()))
      );


      const sixMonthsAgo = new Date(maxDate);
      sixMonthsAgo.setMonth(maxDate.getMonth() - 6);


      const filtered6Months = energy_monthly.filter((e) => {
        const d = new Date(e.date);
        return d >= sixMonthsAgo && d <= maxDate;
      });


      setFiltered6Months(filtered6Months);
    } catch (err) {
      console.error("Failed to fetch monthly energy data:", err);
    }
  }, []);


  const fetchLatestEntries = useCallback(async (): Promise<void> => {
    if (!getStoredToken()) {
      setAuthError('Please login to view your data');
      return;
    }


    setIsLoading(true);
    try {
      const response = await authenticatedFetch('http://localhost:8000/api/energy-input/my/');
     
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }


      const data = await response.json();
      setLatestEntries(Array.isArray(data) ? data.slice(0, 5) : []);
      setAuthError(null);
    } catch (error) {
      console.error('Failed to fetch entries:', error);
      const errorMessage = (error as Error).message;
     
      if (errorMessage.includes('No authentication token') || errorMessage.includes('Unable to refresh')) {
        setAuthError('Authentication required. Please login.');
        clearTokens();
      } else {
        setAuthError('Failed to load your data. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);


  const handleDelete = async (id: number): Promise<boolean> => {
    try {
      const response = await authenticatedFetch(
        `http://localhost:8000/api/energy-input/${id}/`,
        { method: 'DELETE' }
      );


      if (!response.ok) {
        throw new Error(`Failed to delete entry: ${response.status}`);
      }


      setLatestEntries(prev => prev.filter(entry => entry.id !== id));
      return true;
    } catch (error) {
      console.error('Delete failed:', error);
      throw error;
    }
  };


  // Improved handleSubmit with better file upload handling
  const handleSubmit = async (type: string) => {
  const dateInput = document.getElementById(`${type}-date`) as HTMLInputElement;
  const valueInput = document.getElementById(`${type}-value`) as HTMLInputElement;
  const meterInput = document.getElementById(`${type}-meter`) as HTMLInputElement;
  const photoInput = document.getElementById(`${type}-photo`) as HTMLInputElement;

  if (!dateInput?.value || !valueInput?.value || !meterInput?.value) {
    alert('Please fill all required fields');
    return;
  }

  setIsLoading(true);
  setUploadProgress(0);

  try {
    const formData = new FormData();
    formData.append('date', dateInput.value);
    formData.append('type', type);
    formData.append('value', valueInput.value);
    formData.append('meter_number', meterInput.value);
    
    if (photoInput?.files?.[0]) {
      formData.append('photo', photoInput.files[0]);
    }

    let token = getStoredToken();
    if (!token) {
      const newToken = await refreshAccessToken();
      if (!newToken) throw new Error('Authentication required');
      token = newToken;
    }

    // Using XMLHttpRequest for progress tracking
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      });

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              alert('Data saved successfully!');
              valueInput.value = '';
              meterInput.value = '';
              if (photoInput) photoInput.value = '';
              setSelectedFiles(prev => ({ ...prev, [type]: null }));
              fetchLatestEntries();
              resolve();
            } catch (error) {
              console.error('Error parsing response:', error);
              console.log('Raw response:', xhr.responseText);
              reject(new Error('Invalid server response'));
            }
          } else {
            try {
              const response = JSON.parse(xhr.responseText);
              alert(response?.error || xhr.statusText || 'Upload failed');  // langsung tampilkan alert
            
            } catch {
              alert('Upload failed');
              reject(new Error('Upload failed'));
            }
          }
        }
      };

      xhr.open('POST', 'http://localhost:8000/api/energy-input/create/', true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      // Let browser set the Content-Type header automatically for FormData
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Submission error:', error);
    alert(error instanceof Error ? error.message : 'An unknown error occurred');
  } finally {
    setIsLoading(false);
    setUploadProgress(0);
  }
};


  // Helper functions
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
              <AlertTriangle className="h-3 w-3" /> Over budget!
            </div>
          )}
        </CardContent>
      </Card>
    );
  };


  useEffect(() => {
    fetchDailyEnergyData();
    fetchMonthlyEnergyData();
    fetchLatestEntries();
    fetchPredictedCNG();
    fetchPredictedElectricity();
    fetchPredictedWater();
  }, [fetchDailyEnergyData, fetchMonthlyEnergyData, fetchLatestEntries]);


  return (
    <div className="p-6 space-y-6">
      {authError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span>{authError}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/login'}
                className="ml-auto"
              >
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      )}


      <div className="grid md:grid-cols-3 gap-4">
        {CardEnergy("Electricity Today", <Zap className="h-4 w-4 text-yellow-500" />, electricity, predictedElectricity, "kWh")}
        {CardEnergy("Water Today", <Droplets className="h-4 w-4 text-blue-500" />, air, predictedWater, "m³")}
        {CardEnergy("CNG Today", <Fuel className="h-4 w-4 text-orange-500" />, cng, predictedCNG, "m³")}
      </div>


      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Trend</TabsTrigger>
          <TabsTrigger value="input">Input Data</TabsTrigger>
        </TabsList>


        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Energy Consumption Trend (7 Days)</CardTitle>
              <CardDescription>Actual consumption vs daily budget comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={filtered}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { day: "numeric", month: "short" })} />
                  <YAxis />
                  <Tooltip labelFormatter={(v) => new Date(v).toLocaleDateString("en-US")} />
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
                  Electricity Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Today's Consumption</span>
                  <span className="font-medium">{electricity} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Daily Budget</span>
                  <span className="font-medium"> {predictedElectricity.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Difference</span>
                  <span className={`font-medium ${electricity -  predictedElectricity > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {electricity - predictedElectricity} kWh
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">7-day Average</span>
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
                  Water Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Today's Consumption</span>
                  <span className="font-medium">{air} m³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Daily Budget</span>
                  <span className="font-medium">{predictedWater}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Difference</span>
                  <span className={`font-medium ${air - predictedWater > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {air - predictedWater} m³
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">7-day Average</span>
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
                  CNG Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Today's Consumption</span>
                  <span className="font-medium">{cng} m³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Daily Budget</span>
                  <span className="font-medium">{predictedCNG}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Difference</span>
                  <span className={`font-medium ${cng - predictedCNG > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {cng - predictedCNG} m³
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">7-day Average</span>
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
              <CardTitle>Monthly Consumption Trend</CardTitle>
              <CardDescription>Energy consumption comparison for the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={filtered6Months}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month_name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="listrik" fill="#f59e0b" name="Electricity (kWh)" />
                  <Bar dataKey="air" fill="#3b82f6" name="Water (m³)" />
                  <Bar dataKey="cng" fill="#f97316" name="CNG (m³)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="input" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Electricity Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Input Electricity Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="listrik-date">Date</Label>
                  <Input id="listrik-date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="listrik-value">Consumption (kWh)</Label>
                  <Input id="listrik-value" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="listrik-meter">Meter Number</Label>
                  <Input id="listrik-meter" placeholder="PLN-001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="listrik-photo">Upload Meter Photo</Label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Button variant="outline" className="flex items-center gap-2" asChild>
                      <div>
                        <Camera className="h-4 w-4" />
                        <span>Select File</span>
                      </div>
                    </Button>
                    <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                      {selectedFiles.listrik ? selectedFiles.listrik.name : "No file chosen"}
                    </span>
                    <Input
                      id="listrik-photo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setSelectedFiles(prev => ({
                        ...prev,
                        listrik: e.target.files?.[0] || null
                      }))}
                    />
                  </label>
                  {selectedFiles.listrik && (
                    <div className="mt-2">
                      <img
                        src={URL.createObjectURL(selectedFiles.listrik)}
                        alt="Preview"
                        className="h-20 w-20 object-cover rounded border"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedFiles.listrik.name} ({Math.round(selectedFiles.listrik.size / 1024)}KB)
                      </p>
                    </div>
                  )}
                </div>
                <Button
                  className="w-full"
                  onClick={() => handleSubmit("listrik")}
                  disabled={isLoading}
                >
                  {isLoading && uploadProgress > 0 ? (
                    `Uploading... ${uploadProgress}%`
                  ) : (
                    "Save Electricity Data"
                  )}
                </Button>
              </CardContent>
            </Card>


            {/* Water Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-blue-500" />
                  Input Water Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="air-date">Date</Label>
                  <Input id="air-date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="air-value">Consumption (m³)</Label>
                  <Input id="air-value" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="air-meter">Meter Number</Label>
                  <Input id="air-meter" placeholder="PDAM-001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="air-photo">Upload Meter Photo</Label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Button variant="outline" className="flex items-center gap-2" asChild>
                      <div>
                        <Camera className="h-4 w-4" />
                        <span>Select File</span>
                      </div>
                    </Button>
                    <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                      {selectedFiles.air ? selectedFiles.air.name : "No file chosen"}
                    </span>
                    <Input
                      id="air-photo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setSelectedFiles(prev => ({
                        ...prev,
                        air: e.target.files?.[0] || null
                      }))}
                    />
                  </label>
                  {selectedFiles.air && (
                    <div className="mt-2">
                      <img
                        src={URL.createObjectURL(selectedFiles.air)}
                        alt="Preview"
                        className="h-20 w-20 object-cover rounded border"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedFiles.air.name} ({Math.round(selectedFiles.air.size / 1024)}KB)
                      </p>
                    </div>
                  )}
                </div>
                <Button
                  className="w-full"
                  onClick={() => handleSubmit("air")}
                  disabled={isLoading}
                >
                  {isLoading && uploadProgress > 0 ? (
                    `Uploading... ${uploadProgress}%`
                  ) : (
                    "Save Water Data"
                  )}
                </Button>
              </CardContent>
            </Card>


            {/* CNG Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fuel className="h-5 w-5 text-orange-500" />
                  Input CNG Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cng-date">Date</Label>
                  <Input id="cng-date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cng-value">Consumption (m³)</Label>
                  <Input id="cng-value" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cng-meter">Meter Number</Label>
                  <Input id="cng-meter" placeholder="CNG-001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cng-photo">Upload Meter Photo</Label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Button variant="outline" className="flex items-center gap-2" asChild>
                      <div>
                        <Camera className="h-4 w-4" />
                        <span>Select File</span>
                      </div>
                    </Button>
                    <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                      {selectedFiles.cng ? selectedFiles.cng.name : "No file chosen"}
                    </span>
                    <Input
                      id="cng-photo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setSelectedFiles(prev => ({
                        ...prev,
                        cng: e.target.files?.[0] || null
                      }))}
                    />
                  </label>
                  {selectedFiles.cng && (
                    <div className="mt-2">
                      <img
                        src={URL.createObjectURL(selectedFiles.cng)}
                        alt="Preview"
                        className="h-20 w-20 object-cover rounded border"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedFiles.cng.name} ({Math.round(selectedFiles.cng.size / 1024)}KB)
                      </p>
                    </div>
                  )}
                </div>
                <Button
                  className="w-full"
                  onClick={() => handleSubmit("cng")}
                  disabled={isLoading}
                >
                  {isLoading && uploadProgress > 0 ? (
                    `Uploading... ${uploadProgress}%`
                  ) : (
                    "Save CNG Data"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>


          {/* Recent Entries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Latest Data
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchLatestEntries}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Refresh
                </Button>
              </CardTitle>
              <CardDescription>Last 5 database entries</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading data...</span>
                </div>
              ) : authError ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  {authError}
                </div>
              ) : latestEntries.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No data entries found. Start by adding some energy data above.
                </div>
              ) : (
                <div className="space-y-3">
                  {latestEntries.map((entry, index) => (
                    <div
                      key={entry.id || index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            entry.type === "listrik"
                              ? "bg-yellow-500"
                              : entry.type === "air"
                              ? "bg-blue-500"
                              : "bg-orange-500"
                          }`}
                        />
                        <div>
                          <p className="font-medium capitalize">
                            {entry.type === "listrik" ? "Electricity" : entry.type === "air" ? "Water" : "CNG"}: {entry.value} {entry.type === "listrik" ? "kWh" : "m³"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString('en-US')} - Meter: {entry.meter_number}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.photo && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(entry.photo, '_blank')}
                            title="View photo"
                          >
                            <Camera className="h-4 w-4" />
                          </Button>
                        )}
                        <Badge variant="outline">Verified</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const typeDisplay = entry.type === "listrik" ? "electricity" : entry.type === "air" ? "water" : "CNG";
                            if (confirm(`Delete ${typeDisplay} data from ${new Date(entry.date).toLocaleDateString('en-US')}?`)) {
                              try {
                                await handleDelete(entry.id);
                                alert('Data deleted successfully!');
                              } catch (error) {
                                console.error('Error deleting entry:', error);
                                alert('Failed to delete data. Please try again.');
                              }
                            }
                          }}
                          title="Delete entry"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}



