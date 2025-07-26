"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface RegisterModalProps {
  open: boolean
  onClose: () => void
}

export function RegisterModal({ open, onClose }: RegisterModalProps) {
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [division, setDivision] = useState("")
  const [divisions, setDivisions] = useState<string[]>([])

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetch("http://localhost:8000/api/divisions/")
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Division response:", data)
        if (Array.isArray(data)) {
          setDivisions(data)
        } else {
          setDivisions([])
        }
      })
      .catch((err) => {
        console.error("❌ Gagal ambil data divisi:", err)
        setDivisions([])
      })
  }, [])

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    const token = localStorage.getItem("accessToken")
    if (!token) {
      setError("Token tidak ditemukan. Silakan login ulang.")
      return
    }

    try {
      const res = await fetch("http://localhost:8000/api/regist/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          password,
          full_name: fullName,
          email,
          role,
          division,
        }),
      })

      const data = await res.json()
      console.log("🧾 Register Response:", data)

      if (res.ok) {
        setSuccess("User berhasil didaftarkan!")
        setUsername("")
        setFullName("")
        setEmail("")
        setPassword("")
        setRole("")
        setDivision("")

        setTimeout(() => {
          onClose()
          setSuccess("")
        }, 1500)
      } else {
        setError(data.error || data.detail || "Gagal mendaftarkan user")
      }
    } catch (err) {
      console.error("Error saat submit:", err)
      setError("Terjadi kesalahan saat mengirim data")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Registrasi User Baru</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <Input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input
            placeholder="Nama Lengkap"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Select value={role} onValueChange={setRole} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="engineer">Engineer Team</SelectItem>
              <SelectItem value="utility">Utility Team</SelectItem>
              <SelectItem value="qac">QAC / Compliance</SelectItem>
              <SelectItem value="requester">Division (Other)</SelectItem>
            </SelectContent>
          </Select>

          {role === "requester" && (
            <Select value={division} onValueChange={setDivision} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Divisi" />
              </SelectTrigger>
              <SelectContent>
                {divisions.map((div) => (
                  <SelectItem key={div} value={div}>
                    {div}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            type="submit"
            className="w-full bg-black text-white hover:bg-gray-800">

            Daftarkan User
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
