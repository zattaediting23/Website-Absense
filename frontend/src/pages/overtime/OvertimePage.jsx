import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSector } from '../../contexts/SectorContext'
import { LoadingSpinner, Badge, EmptyState, Modal, Alert } from '../../components/common'
import api from '../../services/api'

export default function OvertimePage() {
  const { user } = useAuth()
  const { t } = useSector()
  const isAdmin = user.role !== 'member'
  const [tab, setTab] = useState('my')
  const [myRecords, setMyRecords] = useState([])
  const [allRecords, setAllRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ date: '', start_time: '', end_time: '', reason: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [tab])

  async function loadData() {
    setLoading(true)
    try {
      if (tab === 'my') {
        const res = await api.get('/overtime/my')
        setMyRecords(res.data.records)
      } else {
        const res = await api.get('/overtime')
        setAllRecords(res.data.records)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.date || !form.start_time || !form.end_time) { setError('Tanggal dan jam wajib diisi'); return }
    setSaving(true); setError('')
    try {
      await api.post('/overtime', form)
      setModalOpen(false)
      setForm({ date: '', start_time: '', end_time: '', reason: '' })
      loadData()
    } catch (err) { setError(err.response?.data?.error || 'Gagal mengajukan') }
    finally { setSaving(false) }
  }

  async function handleUpdateStatus(id, status) {
    try { await api.patch(`/overtime/${id}/status`, { status }); loadData() }
    catch (err) { alert(err.response?.data?.error || 'Gagal memperbarui') }
  }

  const statusMap = { pending: { label: 'Menunggu', type: 'warning' }, approved: { label: 'Disetujui', type: 'success' }, rejected: { label: 'Ditolak', type: 'danger' } }

  function renderTable(records, showActions = false) {
    if (records.length === 0) return <EmptyState icon="fa-solid fa-clock" title={`Belum ada pengajuan ${t('overtime')}`} />
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {showActions && <th className="text-left py-3 px-4 font-semibold text-gray-600">Nama</th>}
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Tanggal</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Mulai</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Selesai</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-600">Jam</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Alasan</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-600">Status</th>
              {showActions && <th className="text-right py-3 px-4 font-semibold text-gray-600">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                {showActions && <td className="py-3 px-4 font-medium text-gray-800">{r.full_name}</td>}
                <td className="py-3 px-4">{new Date(r.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td className="py-3 px-4">{r.start_time?.substring(0, 5)}</td>
                <td className="py-3 px-4">{r.end_time?.substring(0, 5)}</td>
                <td className="py-3 px-4 text-center"><span className="inline-block min-w-[2rem] px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs font-medium">{r.hours}h</span></td>
                <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{r.reason || '-'}</td>
                <td className="py-3 px-4 text-center"><Badge type={statusMap[r.status]?.type}>{statusMap[r.status]?.label}</Badge></td>
                {showActions && (
                  <td className="py-3 px-4 text-right">
                    {r.status === 'pending' && (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleUpdateStatus(r.id, 'approved')} className="px-2 py-1 bg-success-50 text-success-700 rounded text-xs font-medium hover:bg-success-100 transition-colors">
                          <i className="fa-solid fa-check mr-1"></i>Setuju
                        </button>
                        <button onClick={() => handleUpdateStatus(r.id, 'rejected')} className="px-2 py-1 bg-danger-50 text-danger-700 rounded text-xs font-medium hover:bg-danger-100 transition-colors">
                          <i className="fa-solid fa-xmark mr-1"></i>Tolak
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title mb-0">{t('overtime')}</h1>
          <p className="text-sm text-gray-500 mt-1">Ajukan dan kelola jam lembur</p>
        </div>
        <button onClick={() => { setError(''); setModalOpen(true) }} className="btn-primary">
          <i className="fa-solid fa-plus mr-2"></i>Ajukan {t('overtime')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        <button onClick={() => setTab('my')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'my' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <i className="fa-solid fa-user mr-2"></i>Pengajuan Saya
        </button>
        {isAdmin && (
          <button onClick={() => setTab('all')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'all' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <i className="fa-solid fa-list mr-2"></i>Semua Pengajuan
          </button>
        )}
      </div>

      <div className="card">
        {loading ? <LoadingSpinner /> : (
          tab === 'my' ? renderTable(myRecords) : renderTable(allRecords, true)
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Ajukan ${t('overtime')}`} size="sm">
        {error && <div className="mb-3"><Alert type="danger">{error}</Alert></div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">Tanggal</label>
            <input type="date" className="input-field" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Jam Mulai</label>
              <input type="time" className="input-field" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} required />
            </div>
            <div>
              <label className="label-field">Jam Selesai</label>
              <input type="time" className="input-field" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="label-field">Alasan</label>
            <textarea className="input-field" rows="3" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Jelaskan alasan lembur"></textarea>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-paper-plane mr-1"></i>Kirim</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
