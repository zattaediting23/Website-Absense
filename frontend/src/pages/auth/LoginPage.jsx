import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Alert } from '../../components/common'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal login. Periksa email dan password.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-500 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold">A</span>
            </div>
            <span className="text-3xl font-bold tracking-wide">Absense</span>
          </div>
          <h2 className="text-3xl font-bold mb-4">Sistem Manajemen Absensi Multi-Sektor</h2>
          <p className="text-primary-100 text-lg mb-8">Solusi terpadu untuk pengelolaan kehadiran di berbagai sektor: Pendidikan, Perusahaan, UMKM, dan Kesehatan.</p>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary-100">
              <i className="fa-solid fa-check-circle w-5"></i>
              <span>Manajemen pengguna lengkap</span>
            </div>
            <div className="flex items-center gap-3 text-primary-100">
              <i className="fa-solid fa-check-circle w-5"></i>
              <span>Rekap kehadiran otomatis</span>
            </div>
            <div className="flex items-center gap-3 text-primary-100">
              <i className="fa-solid fa-check-circle w-5"></i>
              <span>Pengaturan shift dan jadwal</span>
            </div>
            <div className="flex items-center gap-3 text-primary-100">
              <i className="fa-solid fa-check-circle w-5"></i>
              <span>Dashboard dan laporan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-2xl font-bold text-primary-800">Absense</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-1">Masuk ke akun Anda</h1>
          <p className="text-gray-500 mb-8">Masukkan email dan password untuk melanjutkan</p>

          {error && <div className="mb-4"><Alert type="danger" onClose={() => setError('')}>{error}</Alert></div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-field">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><i className="fa-solid fa-envelope"></i></span>
                <input type="email" className="input-field pl-10" placeholder="nama@email.com" value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})} required />
              </div>
            </div>
            <div>
              <label className="label-field">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><i className="fa-solid fa-lock"></i></span>
                <input type="password" className="input-field pl-10" placeholder="Masukkan password" value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})} required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Memproses...</> : <><i className="fa-solid fa-right-to-bracket mr-2"></i>Masuk</>}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">Belum punya akun? <Link to="/register" className="text-primary-500 font-medium hover:underline">Daftar sekarang</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}
