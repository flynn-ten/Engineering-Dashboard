'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Step 1: Login → dapatkan token
      const res = await fetch("http://localhost:8000/api/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
  if (data.detail === "No active account found with the given credentials") {
    setError("Username atau password salah.");
  } else {
    setError(data.detail || "Login gagal");
  }
  setIsLoading(false);
  return;
}


      localStorage.setItem("accessToken", data.access);
      localStorage.setItem("refresh", data.refresh);

      // Step 2: Ambil user info
      const userInfo = await fetch("http://localhost:8000/api/me/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.access}`,
        },
      });

      if (!userInfo.ok) {
        const text = await userInfo.text();
        console.error("Gagal ambil user info:", text);
        setError("Gagal mendapatkan data user");
        setIsLoading(false);
        return;
      }

      const user = await userInfo.json();
      localStorage.setItem("user", JSON.stringify(user));

      // ✅ Validasi status user
      if (user.userprofile?.status?.toLowerCase() !== "active") {
        setError("Akun Anda tidak aktif. Silakan hubungi admin.");
        setIsLoading(false);
        return;
      }

      // ✅ Redirect sesuai role
      const role = user.userprofile?.role?.toLowerCase();
      const routeByRole: Record<string, string> = {
        admin: "/admin",
        engineer: "/wo",
        utility: "/energy",
        qac: "/compliance",
        requester: "/request",
      };

      if (!role || !routeByRole[role]) {
        setError("Role user tidak valid atau tidak dikenali.");
        setIsLoading(false);
        return;
      }

      router.push(routeByRole[role]);
      setIsLoading(false);

    } catch (err) {
      console.error("Unhandled error:", err);
      setError("Terjadi kesalahan saat login");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="flex aspect-square size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="size-6" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Engineering Dashboard</h2>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username Anda"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password Anda"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
