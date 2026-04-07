import { useState, useEffect } from 'react'
import { useSector } from '../../contexts/SectorContext'
import { LoadingSpinner, EmptyState, ConfirmDialog, Modal, Alert } from '../../components/common'
import api from '../../services/api'

export default function DepartmentsPage() {
  const { t } = useSector()
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try { const res = await api.get('/departments'); setDepartments(res.data) }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  function openAdd() { setForm({ name: '', description: '' }); setEditItem(null); setError(''); setModalOpen(true) }
  function openEdit(d) { setForm({ name: d.name, description: d.description || '' }); setEditItem(d); setError(''); setModalOpen(true) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nama wajib diisi'); return }
    setSaving(true); setError('')
    try {
      if (editItem) await api.put(`/departments/${editItem.id}`, form)
      else await api.post('/departments', form)
      setModalOpen(false); loadData()
    } catch (err) { setError(err.response?.data?.error || 'Gagal menyimpan') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    try { await api.delete(`/departments/${deleteId}`); loadData() }
    catch (err) { alert(err.response?.data?.error || 'Gagal menghapus') }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title mb-0">Manajemen {t('department')}</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola struktur {t('department')}</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><i className="fa-solid fa-plus mr-2"></i>Tambah {t('department')}</button>
      </div>

      {departments.length === 0 ? (
        <div className="card"><EmptyState icon="fa-solid fa-building" title={`Belum ada ${t('department')}`} description={`Tambahkan ${t('department')} untuk mengelompokkan ${t('member')}`} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map(d => (
            <div key={d.id} className="card hover:border-primary-200 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary-100 text-secondary-600 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-building"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{d.name}</h3>
                    <p className="text-xs text-gray-400">{d.member_count || 0} {t('member')}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(d)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-primary-500 transition-colors"><i className="fa-solid fa-pen-to-square"></i></button>
                  <button onClick={() => setDeleteId(d.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-danger-500 transition-colors"><i className="fa-solid fa-trash-can"></i></button>
                </div>
              </div>
              {d.description && <p className="text-sm text-gray-500 mt-3">{d.description}</p>}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`${editItem ? 'Edit' : 'Tambah'} ${t('department')}`} size="sm">
        {error && <div className="mb-3"><Alert type="danger">{error}</Alert></div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">Nama *</label>
            <input type="text" className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required autoFocus />
          </div>
          <div>
            <label className="label-field">Deskripsi</label>
            <textarea className="input-field" rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})}></textarea>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-floppy-disk mr-1"></i>Simpan</>}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title={`Hapus ${t('department')}`} message={`Yakin ingin menghapus ${t('department')} ini?`} />
    </div>
  )
}
