import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSector } from '../../contexts/SectorContext'
import { Alert, LoadingSpinner } from '../../components/common'
import api from '../../services/api'

const allDays = [
  { value: 1, label: 'Senin' }, { value: 2, label: 'Selasa' }, { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' }, { value: 5, label: 'Jumat' }, { value: 6, label: 'Sabtu' }, { value: 7, label: 'Minggu' },
]

export default function ScheduleFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useSector()
  const isEdit = !!id
  const [form, setForm] = useState({ name: '', start_time: '08:00', end_time: '17:00', days_of_week: [1,2,3,4,5], tolerance_minutes: 15, is_active: true })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(isEdit)

  useEffect(() => { if (isEdit) loadSchedule() }, [id])

  async function loadSchedule() {
    try {
      const res = await api.get(`/schedules/${id}`)
      const s = res.data
      setForm({ name: s.name, start_time: s.start_time?.slice(0,5), end_time: s.end_time?.slice(0,5), days_of_week: s.days_of_week || [1,2,3,4,5], tolerance_minutes: s.tolerance_minutes || 15, is_active: s.is_active })
    } catch { setError('Gagal memuat data jadwal') }
    finally { setPageLoading(false) }
  }

  function toggleDay(day) {
    setForm(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day) ? prev.days_of_week.filter(d => d !== day) : [...prev.days_of_week, day].sort()
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name) { setError('Nama jadwal wajib diisi'); return }
    setLoading(true)
    try {
      if (isEdit) await api.put(`/schedules/${id}`, form)
      else await api.post('/schedules', form)
      navigate('/schedules')
    } catch (err) { setError(err.response?.data?.error || 'Gagal menyimpan') }
    finally { setLoading(false) }
  }

  if (pageLoading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/schedules')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors"><i className="fa-solid fa-arrow-left text-gray-600"></i></button>
        <div>
          <h1 className="page-title mb-0">{isEdit ? 'Edit' : 'Tambah'} {t('schedule')}</h1>
          <p className="text-sm text-gray-500 mt-1">{isEdit ? 'Perbarui pengaturan jadwal' : 'Buat jadwal baru'}</p>
        </div>
      </div>

      <div className="card max-w-2xl">
        {error && <div className="mb-4"><Alert type="danger" onClose={() => setError('')}>{error}</Alert></div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label-field">Nama {t('schedule')} *</label>
            <input type="text" className="input-field" placeholder="Contoh: Shift Pagi, Jadwal Reguler" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Waktu Mulai *</label>
              <input type="time" className="input-field" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} required />
            </div>
            <div>
              <label className="label-field">Waktu Selesai *</label>
              <input type="time" className="input-field" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} required />
            </div>
          </div>

          <div>
            <label className="label-field">Hari Kerja</label>
            <div className="flex flex-wrap gap-2">
              {allDays.map(d => (
                <button key={d.value} type="button" onClick={() => toggleDay(d.value)}
                  className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                    form.days_of_week.includes(d.value)
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-field">Toleransi Keterlambatan (menit)</label>
            <input type="number" className="input-field w-32" min="0" max="120" value={form.tolerance_minutes} onChange={e => setForm({...form, tolerance_minutes: parseInt(e.target.value) || 0})} />
          </div>

          {isEdit && (
            <div className="flex items-center gap-3">
              <label className="label-field mb-0">Status</label>
              <button type="button" onClick={() => setForm({...form, is_active: !form.is_active})}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-success-500' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'left-[22px]' : 'left-0.5'}`}></span>
              </button>
              <span className="text-sm text-gray-600">{form.is_active ? 'Aktif' : 'Nonaktif'}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => navigate('/schedules')} className="btn-ghost">Batal</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Menyimpan...</> : <><i className="fa-solid fa-floppy-disk mr-2"></i>Simpan</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
