'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [division, setDivision] = useState('');
  const [divisions, setDivisions] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 🔒 Pastikan hanya admin yang bisa buka
  useEffect(() => {
    const token = localStorage.getItem('access');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('http://localhost:8000/api/me/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => {
        if (data.userprofile?.role !== 'admin') {
          router.push('/dashboard');
        } else {
          setIsLoading(false);
        }
      })
      .catch(() => router.push('/login'));
  }, []);

  // 🔁 Ambil list divisi jika role = requester
  useEffect(() => {
    if (role === 'requester') {
      fetch('http://localhost:8000/api/divisions/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access')}`,
        },
      })
        .then((res) => res.json())
        .then((data) => setDivisions(data))
        .catch((err) => console.error('Gagal ambil data divisi:', err));
    }
  }, [role]);

  // 🚀 Submit register
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('access');
    const payload: any = { username, password, role };
    if (role === 'requester') payload.division = division;

    const res = await fetch('http://localhost:8000/api/regist/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok) {
      setSuccess('✅ User berhasil dibuat!');
      setUsername('');
      setPassword('');
      setRole('');
      setDivision('');
    } else {
      setError(data.error || '❌ Gagal membuat user');
    }
  };

  if (isLoading) return <p className="text-center mt-20">⏳ Memuat halaman...</p>;

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">Register User Baru (Admin Only)</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {success && <p className="text-green-600 mb-4">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border p-2 rounded"
          required
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full border p-2 rounded"
          required
        >
          <option value="">Pilih Role</option>
          <option value="admin">Admin</option>
          <option value="engineer">Engineer Team</option>
          <option value="utility">Utility Team</option>
          <option value="qac">QAC / Compliance</option>
          <option value="requester">Division (Other)</option>
        </select>

        {role === 'requester' && (
          <select
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">Pilih Divisi</option>
            {divisions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        )}

        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
          Register
        </button>
      </form>
    </div>
  );
}
