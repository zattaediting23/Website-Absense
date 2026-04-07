import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSector } from '../../contexts/SectorContext'
import { Alert, LoadingSpinner } from '../../components/common'
import api from '../../services/api'

export default function UserFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useSector()
  const isEdit = !!id
  const [form, setForm] = useState({ full_name: '', email: '', password: '', employee_id: '', phone: '', role: 'member', department_id: '' })
  const [departments, setDepartments] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(isEdit)

  useEffect(() => {
    loadDepartments()
    if (isEdit) loadUser()
  }, [id])

  async function loadDepartments() {
    try { const res = await api.get('/departments'); setDepartments(res.data) } catch {}
  }

  async function loadUser() {
    try {
      const res = await api.get(`/users/${id}`)
      setForm({ full_name: res.data.full_name, email: res.data.email, password: '', employee_id: res.data.employee_id || '', phone: res.data.phone || '', role: res.data.role, department_id: res.data.department_id || '' })
    } catch { setError('Gagal memuat data user') }
    finally { setPageLoading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = { ...form, department_id: form.department_id || null }
      if (!isEdit && !form.password) { setError('Password wajib diisi'); setLoading(false); return }
      if (isEdit && !form.password) delete data.password
      if (isEdit) await api.put(`/users/${id}`, data)
      else await api.post('/users', data)
      navigate('/users')
    } catch (err) { setError(err.response?.data?.error || 'Gagal menyimpan') }
    finally { setLoading(false) }
  }

  if (pageLoading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/users')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors"><i className="fa-solid fa-arrow-left text-gray-600"></i></button>
        <div>
          <h1 className="page-title mb-0">{isEdit ? 'Edit' : 'Tambah'} Pengguna</h1>
          <p className="text-sm text-gray-500 mt-1">{isEdit ? 'Perbarui data pengguna' : `Tambahkan ${t('member')} atau ${t('admin')} baru`}</p>
        </div>
      </div>

      <div className="card max-w-2xl">
        {error && <div className="mb-4"><Alert type="danger" onClose={() => setError('')}>{error}</Alert></div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label-field">Nama Lengkap *</label>
              <input type="text" className="input-field" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required />
            </div>
            <div>
              <label className="label-field">Email *</label>
              <input type="email" className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div>
              <label className="label-field">Password {isEdit ? '(kosongkan jika tidak diubah)' : '*'}</label>
              <input type="password" className="input-field" value={form.password} onChange={e => setForm({...form, password: e.target.value})} {...(!isEdit && { required: true })} />
            </div>
            <div>
              <label className="label-field">ID {t('member')}</label>
              <input type="text" className="input-field" placeholder="Opsional" value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})} />
            </div>
            <div>
              <label className="label-field">Telepon</label>
              <input type="text" className="input-field" placeholder="Opsional" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
            <div>
              <label className="label-field">Role *</label>
              <select className="select-field" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="member">{t('member')}</option>
                <option value="admin">{t('admin')}</option>
              </select>
            </div>
            <div>
              <label className="label-field">{t('department')}</label>
              <select className="select-field" value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})}>
                <option value="">- Pilih {t('department')} -</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => navigate('/users')} className="btn-ghost">Batal</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Menyimpan...</> : <><i className="fa-solid fa-floppy-disk mr-2"></i>Simpan</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
