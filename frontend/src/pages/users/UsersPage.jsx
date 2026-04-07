import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSector } from '../../contexts/SectorContext'
import { LoadingSpinner, Badge, Pagination, EmptyState, ConfirmDialog } from '../../components/common'
import api from '../../services/api'

export default function UsersPage() {
  const { t } = useSector()
  const [data, setData] = useState({ users: [], total: 0, page: 1, limit: 10 })
  const [departments, setDepartments] = useState([])
  const [filters, setFilters] = useState({ search: '', department_id: '', role: '' })
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => { loadData(); loadDepartments() }, [])

  async function loadDepartments() {
    try { const res = await api.get('/departments'); setDepartments(res.data) } catch {}
  }

  async function loadData(page = 1) {
    setLoading(true)
    try {
      const res = await api.get('/users', { params: { ...filters, page, limit: 10 } })
      setData(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleToggleActive(id) {
    try { await api.patch(`/users/${id}/toggle-active`); loadData(data.page) } catch (err) { alert(err.response?.data?.error || 'Gagal') }
  }

  async function handleDelete() {
    if (!deleteId) return
    try { await api.delete(`/users/${deleteId}`); loadData(data.page) } catch (err) { alert(err.response?.data?.error || 'Gagal menghapus') }
  }

  const roleLabels = { superadmin: 'Super Admin', admin: t('admin'), member: t('member') }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title mb-0">Manajemen Pengguna</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data {t('member')} dan {t('admin')}</p>
        </div>
        <Link to="/users/new" className="btn-primary"><i className="fa-solid fa-plus mr-2"></i>Tambah Pengguna</Link>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><i className="fa-solid fa-magnifying-glass"></i></span>
            <input type="text" className="input-field pl-10" placeholder="Cari nama, email, atau ID..." value={filters.search}
              onChange={e => setFilters({...filters, search: e.target.value})} onKeyDown={e => e.key === 'Enter' && loadData(1)} />
          </div>
          <select className="select-field w-auto" value={filters.department_id} onChange={e => setFilters({...filters, department_id: e.target.value})}>
            <option value="">Semua {t('department')}</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select className="select-field w-auto" value={filters.role} onChange={e => setFilters({...filters, role: e.target.value})}>
            <option value="">Semua Role</option>
            <option value="admin">{t('admin')}</option>
            <option value="member">{t('member')}</option>
          </select>
          <button onClick={() => loadData(1)} className="btn-primary btn-sm"><i className="fa-solid fa-magnifying-glass mr-1"></i>Cari</button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? <LoadingSpinner /> : data.users.length === 0 ? (
          <EmptyState icon="fa-solid fa-users" title="Belum ada pengguna" description="Tambahkan pengguna baru untuk memulai" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Nama</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">{t('department')}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map(u => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold">{u.full_name?.charAt(0)?.toUpperCase()}</div>
                        <div>
                          <p className="font-medium text-gray-800">{u.full_name}</p>
                          {u.employee_id && <p className="text-xs text-gray-400">{u.employee_id}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{u.email}</td>
                    <td className="py-3 px-4 text-gray-600">{u.department_name || '-'}</td>
                    <td className="py-3 px-4"><Badge type="primary">{roleLabels[u.role] || u.role}</Badge></td>
                    <td className="py-3 px-4">
                      <button onClick={() => handleToggleActive(u.id)} className={`text-xs font-medium px-2 py-0.5 rounded cursor-pointer ${u.is_active ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/users/${u.id}/edit`} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-primary-500 transition-colors"><i className="fa-solid fa-pen-to-square"></i></Link>
                        <button onClick={() => setDeleteId(u.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-danger-500 transition-colors"><i className="fa-solid fa-trash-can"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={data.page} total={data.total} limit={data.limit} onChange={loadData} />
      </div>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Hapus Pengguna" message="Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan." />
    </div>
  )
}
