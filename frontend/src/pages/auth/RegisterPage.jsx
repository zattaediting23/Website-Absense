import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Alert } from '../../components/common'

const sectors = [
  { value: 'education', label: 'Pendidikan', icon: 'fa-solid fa-graduation-cap', desc: 'Sekolah, Kampus, Lembaga Kursus' },
  { value: 'corporate', label: 'Perusahaan', icon: 'fa-solid fa-briefcase', desc: 'Korporasi, Kantor, Instansi' },
  { value: 'umkm', label: 'UMKM', icon: 'fa-solid fa-store', desc: 'Usaha Kecil dan Menengah' },
  { value: 'healthcare', label: 'Kesehatan', icon: 'fa-solid fa-heart-pulse', desc: 'Rumah Sakit, Klinik, Puskesmas' },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ organizationName: '', sector: '', fullName: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleNext() {
    if (!form.sector) { setError('Pilih sektor terlebih dahulu'); return }
    if (!form.organizationName.trim()) { setError('Nama organisasi wajib diisi'); return }
    setError('')
    setStep(2)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) { setError('Password tidak cocok'); return }
    if (form.password.length < 6) { setError('Password minimal 6 karakter'); return }
    setLoading(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mendaftar')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="text-2xl font-bold text-primary-800">Absense</span>
        </div>

        <div className="card">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
            <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-primary-500' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
          </div>

          {error && <div className="mb-4"><Alert type="danger" onClose={() => setError('')}>{error}</Alert></div>}

          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-gray-800 mb-1 text-center">Pilih Sektor</h2>
              <p className="text-sm text-gray-500 mb-6 text-center">Tentukan jenis organisasi Anda</p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {sectors.map(s => (
                  <button key={s.value} type="button" onClick={() => setForm({...form, sector: s.value})}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${form.sector === s.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <i className={`${s.icon} text-xl ${form.sector === s.value ? 'text-primary-500' : 'text-gray-400'} mb-2`}></i>
                    <p className="font-medium text-sm text-gray-800">{s.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <label className="label-field">Nama Organisasi</label>
                <input type="text" className="input-field" placeholder="Contoh: SMA Negeri 1, PT Maju Jaya" value={form.organizationName}
                  onChange={e => setForm({...form, organizationName: e.target.value})} />
              </div>

              <button type="button" onClick={handleNext} className="btn-primary w-full">
                Lanjutkan <i className="fa-solid fa-arrow-right ml-2"></i>
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="animate-fade-in">
              <h2 className="text-xl font-bold text-gray-800 mb-1 text-center">Data Admin</h2>
              <p className="text-sm text-gray-500 mb-6 text-center">Buat akun admin untuk <strong>{form.organizationName}</strong></p>

              <div className="space-y-4">
                <div>
                  <label className="label-field">Nama Lengkap</label>
                  <input type="text" className="input-field" placeholder="Masukkan nama lengkap" value={form.fullName}
                    onChange={e => setForm({...form, fullName: e.target.value})} required />
                </div>
                <div>
                  <label className="label-field">Email</label>
                  <input type="email" className="input-field" placeholder="nama@email.com" value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})} required />
                </div>
                <div>
                  <label className="label-field">Password</label>
                  <input type="password" className="input-field" placeholder="Minimal 6 karakter" value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})} required />
                </div>
                <div>
                  <label className="label-field">Konfirmasi Password</label>
                  <input type="password" className="input-field" placeholder="Ulangi password" value={form.confirmPassword}
                    onChange={e => setForm({...form, confirmPassword: e.target.value})} required />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setStep(1)} className="btn-outline flex-1">
                  <i className="fa-solid fa-arrow-left mr-2"></i>Kembali
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Memproses...</> : <><i className="fa-solid fa-user-plus mr-2"></i>Daftar</>}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">Sudah punya akun? <Link to="/login" className="text-primary-500 font-medium hover:underline">Masuk</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}
