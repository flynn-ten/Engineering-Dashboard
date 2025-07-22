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
  fetch("http://localhost:8000/api/divisions/", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access")}`,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("✅ Division response:", data);
      if (Array.isArray(data?.divisions)) {
        setDivisions(data.divisions); // ← ambil dari key `divisions`
      } else {
        setDivisions([]);
      }
    })
    .catch((err) => {
      console.error("❌ Gagal ambil data divisi:", err);
      setDivisions([]);
    });
}, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    const res = await fetch("http://localhost:8000/api/regist/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access")}`,
      },
      body: JSON.stringify({
        username,
        full_name: fullName,
        email,
        password,
        role,
        division,
      }),
    })

    const data = await res.json()

    if (res.ok) {
      setSuccess("✅ User berhasil didaftarkan!")
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
      setError(data.error || "❌ Gagal mendaftarkan user")
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Select value={role} onValueChange={setRole}>
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
            <Select value={division} onValueChange={setDivision}>
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
            className="w-full bg-green-600 text-white hover:bg-green-700"
          >
            Daftarkan User
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
