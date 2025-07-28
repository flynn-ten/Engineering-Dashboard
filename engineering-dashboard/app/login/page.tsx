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
      // Step 1: Login → get token
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

      // Simpan access & refresh token
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      
      console.log('🔐 Access Token:', data.access);

      // Step 2: Fetch user info
      const userInfo = await fetch('http://localhost:8000/api/me/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${data.access}`,
          'Content-Type': 'application/json',
        },
      });

      if (!userInfo.ok) {
        const text = await userInfo.text();
        console.error('Gagal ambil user info:', text);
        setError('Gagal mendapatkan data user');
        return;
      }

      const user = await userInfo.json();
      console.log('User Data:', user);

      // Simpan user ke localStorage
      localStorage.setItem('user', JSON.stringify(user));

      // Ensure role is in lowercase for case-insensitive comparison
      const role = user.userprofile?.role?.toLowerCase();

      if (!role) {
        setError('Login berhasil, tapi role tidak ditemukan');
        return;
      }

      // Step 3: Redirect based on role (case-insensitive)
      if (role === 'admin') {
        router.push('/admin');
        console.log('Redirecting to /admin');
      } else if (role === 'engineer') {
        router.push('/wo');
        console.log('Redirecting to /wo');
      } else if (role === 'utility') {
        router.push('/energy');
        console.log('Redirecting to /energy');
      } else if (role === 'qac') {
        router.push('/compliance');
        console.log('Redirecting to /compliance');
      } else {
        router.push('/request');
        console.log('Redirecting to /request');
      }

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
