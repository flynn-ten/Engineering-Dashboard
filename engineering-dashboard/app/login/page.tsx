'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://localhost:8000/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Login gagal:', data);
        setError(data.detail || 'Login gagal');
        return;
      }

      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);

      // 👇 Tambahkan logging sebelum dan sesudah fetch user info
      console.log('🔐 Access Token:', data.access);
      console.log("🔑 Bearer Token:", `Bearer ${data.access}`);

const userInfo = await fetch('http://localhost:8000/api/me/', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${data.access}`,
    'Content-Type': 'application/json',
  },
});


console.log('🔐 Token JWT:', data.access);

      if (!userInfo.ok) {
        const text = await userInfo.text();
        console.error('❌ Gagal ambil user info:', text);  // ✅ Debug info
        setError('Gagal mendapatkan data user');
        return;
      }

      const user = await userInfo.json();
      console.log('✅ User Data:', user); // ✅ Debug user info

      const role = user.userprofile?.role;

      if (!role) {
        setError('Login berhasil, tapi role tidak ditemukan');
        return;
      }

      // 🚀 Redirect
      if (role === 'admin') router.push('/admin');
      else if (role === 'engineer') router.push('/wo');
      else if (role === 'utility') router.push('/energy');
      else if (role === 'qac') router.push('/compliance');
      else router.push('/request');

    } catch (err: any) {
      console.error('Unhandled error:', err);
      setError('Terjadi kesalahan saat login');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-6 rounded shadow">
      <h1 className="text-xl font-bold mb-4 text-center">Login</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          className="w-full p-2 border"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          className="w-full p-2 border"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="w-full bg-blue-600 text-white py-2 rounded">Login</button>
      </form>
    </div>
  );
}
