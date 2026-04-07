import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, Badge, EmptyState, Modal, Alert } from '../../components/common'
import api from '../../services/api'

export default function AnnouncementsPage() {
  const { user } = useAuth()
  const isAdmin = user.role !== 'member'
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ title: '', content: '', priority: 'normal', is_pinned: false, expires_at: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const res = isAdmin
        ? await api.get('/announcements', { params: { page: 1, limit: 50 } })
        : await api.get('/announcements/active')
      setAnnouncements(isAdmin ? res.data.announcements : res.data.announcements)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title || !form.content) { setError('Judul dan konten wajib diisi'); return }
    setSaving(true); setError('')
    try {
      if (editId) {
        await api.put(`/announcements/${editId}`, form)
      } else {
        await api.post('/announcements', form)
      }
      setModalOpen(false)
      resetForm()
      loadData()
    } catch (err) { setError(err.response?.data?.error || 'Gagal menyimpan') }
    finally { setSaving(false) }
  }

  function handleEdit(a) {
    setEditId(a.id)
    setForm({
      title: a.title, content: a.content, priority: a.priority,
      is_pinned: a.is_pinned, expires_at: a.expires_at ? a.expires_at.split('T')[0] : ''
    })
    setError('')
    setModalOpen(true)
  }

  async function handleDelete(id) {
    if (!confirm('Hapus pengumuman ini?')) return
    try { await api.delete(`/announcements/${id}`); loadData() }
    catch (err) { alert(err.response?.data?.error || 'Gagal menghapus') }
  }

  function resetForm() {
    setEditId(null)
    setForm({ title: '', content: '', priority: 'normal', is_pinned: false, expires_at: '' })
  }

  const priorityMap = { low: { label: 'Rendah', type: 'default' }, normal: { label: 'Normal', type: 'primary' }, high: { label: 'Penting', type: 'warning' }, urgent: { label: 'Urgent', type: 'danger' } }
  const priorityIcons = { low: 'fa-solid fa-chevron-down', normal: 'fa-solid fa-minus', high: 'fa-solid fa-chevron-up', urgent: 'fa-solid fa-exclamation' }
  const priorityColors = { low: 'border-l-gray-300', normal: 'border-l-primary-400', high: 'border-l-warning-400', urgent: 'border-l-danger-500' }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title mb-0">Pengumuman</h1>
          <p className="text-sm text-gray-500 mt-1">{isAdmin ? 'Kelola pengumuman organisasi' : 'Pengumuman dari organisasi'}</p>
        </div>
        {isAdmin && (
          <button onClick={() => { resetForm(); setError(''); setModalOpen(true) }} className="btn-primary">
            <i className="fa-solid fa-plus mr-2"></i>Buat Pengumuman
          </button>
        )}
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <EmptyState icon="fa-solid fa-bullhorn" title="Belum ada pengumuman" description="Pengumuman akan muncul di sini" />
      ) : (
        <div className="space-y-4">
          {announcements.map(a => (
            <div key={a.id} className={`card border-l-4 ${priorityColors[a.priority]} relative`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {a.is_pinned && (
                      <span className="text-primary-500" title="Disematkan"><i className="fa-solid fa-thumbtack"></i></span>
                    )}
                    <h3 className="text-lg font-semibold text-gray-800">{a.title}</h3>
                    <Badge type={priorityMap[a.priority]?.type}>{priorityMap[a.priority]?.label}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap mb-3">{a.content}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span><i className="fa-solid fa-user mr-1"></i>{a.created_by_name || 'Admin'}</span>
                    <span><i className="fa-solid fa-calendar mr-1"></i>{new Date(a.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    {a.expires_at && (
                      <span><i className="fa-solid fa-hourglass-half mr-1"></i>Kadaluarsa: {new Date(a.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleEdit(a)} className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-500" title="Edit">
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button onClick={() => handleDelete(a.id)} className="p-2 rounded hover:bg-danger-50 transition-colors text-danger-500" title="Hapus">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Pengumuman' : 'Buat Pengumuman'} size="md">
        {error && <div className="mb-3"><Alert type="danger">{error}</Alert></div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">Judul *</label>
            <input type="text" className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Judul pengumuman" required />
          </div>
          <div>
            <label className="label-field">Konten *</label>
            <textarea className="input-field" rows="5" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Tulis isi pengumuman..." required></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Prioritas</label>
              <select className="select-field" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Rendah</option>
                <option value="normal">Normal</option>
                <option value="high">Penting</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="label-field">Kadaluarsa (opsional)</label>
              <input type="date" className="input-field" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_pinned" checked={form.is_pinned} onChange={e => setForm({ ...form, is_pinned: e.target.checked })} className="rounded border-gray-300" />
            <label htmlFor="is_pinned" className="text-sm text-gray-700">Sematkan di atas</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-paper-plane mr-1"></i>{editId ? 'Perbarui' : 'Kirim'}</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
