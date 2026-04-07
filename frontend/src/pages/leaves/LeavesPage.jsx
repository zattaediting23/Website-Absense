import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSector } from '../../contexts/SectorContext'
import { LoadingSpinner, Badge, EmptyState, Modal, Alert } from '../../components/common'
import api from '../../services/api'

export default function LeavesPage() {
  const { user } = useAuth()
  const { t } = useSector()
  const isAdmin = user.role !== 'member'
  const [tab, setTab] = useState('my')
  const [myLeaves, setMyLeaves] = useState([])
  const [allLeaves, setAllLeaves] = useState({ leaves: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ type: 'leave', start_date: '', end_date: '', reason: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [tab])

  async function loadData() {
    setLoading(true)
    try {
      if (tab === 'my') {
        const res = await api.get('/leaves/my')
        setMyLeaves(res.data)
      } else {
        const res = await api.get('/leaves', { params: { page: 1, limit: 50 } })
        setAllLeaves(res.data)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.start_date || !form.end_date) { setError('Tanggal wajib diisi'); return }
    setSaving(true); setError('')
    try {
      await api.post('/leaves', form)
      setModalOpen(false); setForm({ type: 'leave', start_date: '', end_date: '', reason: '' }); loadData()
    } catch (err) { setError(err.response?.data?.error || 'Gagal mengajukan') }
    finally { setSaving(false) }
  }

  async function handleUpdateStatus(id, status) {
    try { await api.patch(`/leaves/${id}/status`, { status }); loadData() }
    catch (err) { alert(err.response?.data?.error || 'Gagal memperbarui') }
  }

  const statusMap = { pending: { label: 'Menunggu', type: 'warning' }, approved: { label: 'Disetujui', type: 'success' }, rejected: { label: 'Ditolak', type: 'danger' } }
  const typeMap = { sick: 'Sakit', leave: 'Cuti', permission: 'Izin' }

  function renderLeaveTable(leaves, showActions = false) {
    if (leaves.length === 0) return <EmptyState icon="fa-solid fa-file-lines" title={`Belum ada pengajuan ${t('leave')}`} />
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {showActions && <th className="text-left py-3 px-4 font-semibold text-gray-600">Nama</th>}
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Tipe</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Tanggal</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Alasan</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
              {showActions && <th className="text-right py-3 px-4 font-semibold text-gray-600">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {leaves.map(l => (
              <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50">
                {showActions && <td className="py-3 px-4 font-medium text-gray-800">{l.full_name}</td>}
                <td className="py-3 px-4">{typeMap[l.type] || l.type}</td>
                <td className="py-3 px-4 text-gray-600">
                  {new Date(l.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(l.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{l.reason || '-'}</td>
                <td className="py-3 px-4"><Badge type={statusMap[l.status]?.type}>{statusMap[l.status]?.label}</Badge></td>
                {showActions && (
                  <td className="py-3 px-4 text-right">
                    {l.status === 'pending' && (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleUpdateStatus(l.id, 'approved')} className="px-2 py-1 bg-success-50 text-success-700 rounded text-xs font-medium hover:bg-success-100 transition-colors">
                          <i className="fa-solid fa-check mr-1"></i>Setuju
                        </button>
                        <button onClick={() => handleUpdateStatus(l.id, 'rejected')} className="px-2 py-1 bg-danger-50 text-danger-700 rounded text-xs font-medium hover:bg-danger-100 transition-colors">
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
          <h1 className="page-title mb-0">Pengajuan {t('leave')}</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola izin dan cuti</p>
        </div>
        <button onClick={() => { setError(''); setModalOpen(true) }} className="btn-primary"><i className="fa-solid fa-plus mr-2"></i>Ajukan {t('leave')}</button>
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
          tab === 'my' ? renderLeaveTable(myLeaves) : renderLeaveTable(allLeaves.leaves, true)
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Ajukan ${t('leave')}`} size="sm">
        {error && <div className="mb-3"><Alert type="danger">{error}</Alert></div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">Tipe</label>
            <select className="select-field" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option value="leave">Cuti</option>
              <option value="sick">Sakit</option>
              <option value="permission">Izin</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label-field">Dari</label><input type="date" className="input-field" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} required /></div>
            <div><label className="label-field">Sampai</label><input type="date" className="input-field" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} required /></div>
          </div>
          <div><label className="label-field">Alasan</label><textarea className="input-field" rows="3" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="Jelaskan alasan pengajuan"></textarea></div>
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
