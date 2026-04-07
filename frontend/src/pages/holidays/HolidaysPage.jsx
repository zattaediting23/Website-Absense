import { useState, useEffect } from 'react'
import { LoadingSpinner, Badge, EmptyState, Modal, Alert } from '../../components/common'
import api from '../../services/api'

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', date: '', type: 'company', is_recurring: false })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)

  useEffect(() => { loadData() }, [year])

  async function loadData() {
    setLoading(true)
    try {
      const res = await api.get('/holidays', { params: { year } })
      setHolidays(res.data.holidays)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.date) { setError('Nama dan tanggal wajib diisi'); return }
    setSaving(true); setError('')
    try {
      if (editId) {
        await api.put(`/holidays/${editId}`, form)
      } else {
        await api.post('/holidays', form)
      }
      setModalOpen(false)
      resetForm()
      loadData()
    } catch (err) { setError(err.response?.data?.error || 'Gagal menyimpan') }
    finally { setSaving(false) }
  }

  function handleEdit(h) {
    setEditId(h.id)
    setForm({ name: h.name, date: h.date?.split('T')[0], type: h.type, is_recurring: h.is_recurring })
    setError('')
    setModalOpen(true)
  }

  async function handleDelete(id) {
    if (!confirm('Hapus hari libur ini?')) return
    try { await api.delete(`/holidays/${id}`); loadData() }
    catch (err) { alert(err.response?.data?.error || 'Gagal menghapus') }
  }

  async function handleSeedNational() {
    if (!confirm(`Tambahkan hari libur nasional untuk tahun ${year}?`)) return
    setSeeding(true)
    try {
      await api.post('/holidays/seed-national', { year })
      loadData()
    } catch (err) { alert(err.response?.data?.error || 'Gagal menambahkan') }
    finally { setSeeding(false) }
  }

  function resetForm() {
    setEditId(null)
    setForm({ name: '', date: '', type: 'company', is_recurring: false })
  }

  const typeMap = { national: { label: 'Nasional', type: 'danger' }, company: { label: 'Perusahaan', type: 'primary' }, religious: { label: 'Keagamaan', type: 'info' } }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

  // Group by month
  const grouped = {}
  holidays.forEach(h => {
    const m = new Date(h.date).getMonth()
    if (!grouped[m]) grouped[m] = []
    grouped[m].push(h)
  })

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title mb-0">Kalender Hari Libur</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola hari libur nasional & perusahaan</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSeedNational} disabled={seeding} className="btn-outline text-sm">
            {seeding ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-flag mr-1"></i>Isi Libur Nasional</>}
          </button>
          <button onClick={() => { resetForm(); setError(''); setModalOpen(true) }} className="btn-primary">
            <i className="fa-solid fa-plus mr-2"></i>Tambah Libur
          </button>
        </div>
      </div>

      {/* Year Selector */}
      <div className="card mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setYear(y => y - 1)} className="btn-ghost btn-sm"><i className="fa-solid fa-chevron-left"></i></button>
          <span className="text-lg font-bold text-primary-800 min-w-[4rem] text-center">{year}</span>
          <button onClick={() => setYear(y => y + 1)} className="btn-ghost btn-sm"><i className="fa-solid fa-chevron-right"></i></button>
          <span className="text-sm text-gray-400 ml-2">{holidays.length} hari libur</span>
        </div>
      </div>

      {/* Calendar Grid */}
      {holidays.length === 0 ? (
        <EmptyState icon="fa-solid fa-calendar-xmark" title="Belum ada hari libur" description={`Tambahkan hari libur untuk tahun ${year}`} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.keys(grouped).sort((a, b) => a - b).map(m => (
            <div key={m} className="card">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                <i className="fa-solid fa-calendar-days mr-2 text-primary-400"></i>{months[m]} {year}
              </h3>
              <div className="space-y-2">
                {grouped[m].map(h => (
                  <div key={h.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-danger-50 text-danger-600 rounded-lg flex flex-col items-center justify-center text-xs font-bold">
                        <span>{new Date(h.date).getDate()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{h.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge type={typeMap[h.type]?.type}>{typeMap[h.type]?.label}</Badge>
                          {h.is_recurring && <span className="text-xs text-gray-400"><i className="fa-solid fa-repeat mr-0.5"></i>Rutin</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(h)} className="p-1.5 rounded hover:bg-white transition-colors text-gray-400 hover:text-primary-500">
                        <i className="fa-solid fa-pen-to-square text-xs"></i>
                      </button>
                      <button onClick={() => handleDelete(h.id)} className="p-1.5 rounded hover:bg-white transition-colors text-gray-400 hover:text-danger-500">
                        <i className="fa-solid fa-trash text-xs"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Hari Libur' : 'Tambah Hari Libur'} size="sm">
        {error && <div className="mb-3"><Alert type="danger">{error}</Alert></div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">Nama Hari Libur *</label>
            <input type="text" className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="cth: Hari Raya Idul Fitri" required />
          </div>
          <div>
            <label className="label-field">Tanggal *</label>
            <input type="date" className="input-field" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
          </div>
          <div>
            <label className="label-field">Tipe</label>
            <select className="select-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="national">Nasional</option>
              <option value="company">Perusahaan</option>
              <option value="religious">Keagamaan</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_recurring" checked={form.is_recurring} onChange={e => setForm({ ...form, is_recurring: e.target.checked })} className="rounded border-gray-300" />
            <label htmlFor="is_recurring" className="text-sm text-gray-700">Berulang setiap tahun</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-floppy-disk mr-1"></i>Simpan</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
