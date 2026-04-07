import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSector } from '../../contexts/SectorContext'
import { LoadingSpinner, EmptyState, ConfirmDialog } from '../../components/common'
import api from '../../services/api'

export default function SchedulesPage() {
  const { t } = useSector()
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try { const res = await api.get('/schedules'); setSchedules(res.data) }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    try { await api.delete(`/schedules/${deleteId}`); loadData() }
    catch (err) { alert(err.response?.data?.error || 'Gagal menghapus') }
  }

  const dayNames = ['', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title mb-0">Manajemen {t('schedule')}</h1>
          <p className="text-sm text-gray-500 mt-1">Atur jadwal dan shift kerja</p>
        </div>
        <Link to="/schedules/new" className="btn-primary"><i className="fa-solid fa-plus mr-2"></i>Tambah {t('schedule')}</Link>
      </div>

      {schedules.length === 0 ? (
        <div className="card"><EmptyState icon="fa-solid fa-calendar-days" title={`Belum ada ${t('schedule')}`} description="Buat jadwal baru untuk memulai" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map(s => (
            <div key={s.id} className="card hover:border-primary-200 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{s.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{s.is_active ? 'Aktif' : 'Nonaktif'}</p>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${s.is_active ? 'bg-success-500' : 'bg-gray-300'}`}></div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <i className="fa-solid fa-clock w-4 text-center text-gray-400"></i>
                  <span>{s.start_time?.slice(0,5)} - {s.end_time?.slice(0,5)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <i className="fa-solid fa-calendar-week w-4 text-center text-gray-400"></i>
                  <span>{s.days_of_week?.map(d => dayNames[d]).join(', ')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <i className="fa-solid fa-stopwatch w-4 text-center text-gray-400"></i>
                  <span>Toleransi: {s.tolerance_minutes} menit</span>
                </div>
              </div>
              <div className="flex justify-end gap-1 pt-3 border-t border-gray-100">
                <Link to={`/schedules/${s.id}/edit`} className="btn-ghost btn-sm text-sm"><i className="fa-solid fa-pen-to-square mr-1"></i>Edit</Link>
                <button onClick={() => setDeleteId(s.id)} className="btn-ghost btn-sm text-sm text-danger-500 hover:text-danger-600"><i className="fa-solid fa-trash-can mr-1"></i>Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title={`Hapus ${t('schedule')}`} message="Yakin ingin menghapus jadwal ini?" />
    </div>
  )
}
