import { useState, useEffect } from 'react'
import { useSector } from '../../contexts/SectorContext'
import { LoadingSpinner, Badge, EmptyState, StatCard } from '../../components/common'
import api from '../../services/api'

export default function ReportsPage() {
  const { t } = useSector()
  const [tab, setTab] = useState('daily')
  const [dailyData, setDailyData] = useState(null)
  const [monthlyData, setMonthlyData] = useState(null)
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [tab])

  async function loadData() {
    setLoading(true)
    try {
      if (tab === 'daily') {
        const res = await api.get('/reports/daily', { params: { date: filters.date } })
        setDailyData(res.data)
      } else {
        const res = await api.get('/reports/monthly', { params: { month: filters.month, year: filters.year } })
        setMonthlyData(res.data)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const statusMap = {
    present: { label: 'Hadir', type: 'success' }, late: { label: 'Terlambat', type: 'warning' },
    absent: { label: 'Absen', type: 'danger' }, leave: { label: 'Cuti', type: 'info' },
    sick: { label: 'Sakit', type: 'warning' }, permission: { label: 'Izin', type: 'info' },
  }

  return (
    <div>
      <h1 className="page-title">Laporan {t('attendance')}</h1>
      <p className="page-subtitle">Rekap dan analisis kehadiran</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        <button onClick={() => setTab('daily')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'daily' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <i className="fa-solid fa-calendar-day mr-2"></i>Harian
        </button>
        <button onClick={() => setTab('monthly')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'monthly' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <i className="fa-solid fa-calendar mr-2"></i>Bulanan
        </button>
      </div>

      {/* Daily Report */}
      {tab === 'daily' && (
        <div>
          <div className="card mb-4">
            <div className="flex items-center gap-3">
              <input type="date" className="input-field w-auto" value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})} />
              <button onClick={loadData} className="btn-primary btn-sm"><i className="fa-solid fa-magnifying-glass mr-1"></i>Tampilkan</button>
            </div>
          </div>

          {loading ? <LoadingSpinner /> : dailyData && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <StatCard icon="fa-solid fa-circle-check" label="Hadir" value={dailyData.summary.present} color="success" />
                <StatCard icon="fa-solid fa-clock" label="Terlambat" value={dailyData.summary.late} color="warning" />
                <StatCard icon="fa-solid fa-circle-xmark" label="Absen" value={dailyData.summary.absent} color="danger" />
                <StatCard icon="fa-solid fa-file-lines" label="Izin/Cuti" value={(dailyData.summary.leave || 0) + (dailyData.summary.sick || 0)} color="info" />
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Detail - {new Date(dailyData.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
                {dailyData.records.length === 0 ? <EmptyState title="Tidak ada data" /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">Nama</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">ID</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">{t('department')}</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">Masuk</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">Keluar</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyData.records.map(r => (
                          <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-800">{r.full_name}</td>
                            <td className="py-3 px-4 text-gray-500">{r.employee_id || '-'}</td>
                            <td className="py-3 px-4 text-gray-600">{r.department_name || '-'}</td>
                            <td className="py-3 px-4">{r.clock_in ? new Date(r.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                            <td className="py-3 px-4">{r.clock_out ? new Date(r.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                            <td className="py-3 px-4"><Badge type={statusMap[r.status || 'absent']?.type}>{statusMap[r.status || 'absent']?.label}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Monthly Report */}
      {tab === 'monthly' && (
        <div>
          <div className="card mb-4">
            <div className="flex items-center gap-3">
              <select className="select-field w-auto" value={filters.month} onChange={e => setFilters({...filters, month: parseInt(e.target.value)})}>
                {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleDateString('id-ID', { month: 'long' })}</option>)}
              </select>
              <input type="number" className="input-field w-24" value={filters.year} onChange={e => setFilters({...filters, year: parseInt(e.target.value)})} />
              <button onClick={loadData} className="btn-primary btn-sm"><i className="fa-solid fa-magnifying-glass mr-1"></i>Tampilkan</button>
            </div>
          </div>

          {loading ? <LoadingSpinner /> : monthlyData && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Rekap {new Date(monthlyData.year, monthlyData.month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </h3>
              {monthlyData.records.length === 0 ? <EmptyState title="Tidak ada data" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Nama</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">{t('department')}</th>
                        <th className="text-center py-3 px-4 font-semibold text-success-600">Hadir</th>
                        <th className="text-center py-3 px-4 font-semibold text-warning-600">Terlambat</th>
                        <th className="text-center py-3 px-4 font-semibold text-info-600">Izin/Cuti</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-600">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.records.map(r => (
                        <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-800">{r.full_name}</p>
                            {r.employee_id && <p className="text-xs text-gray-400">{r.employee_id}</p>}
                          </td>
                          <td className="py-3 px-4 text-gray-600">{r.department_name || '-'}</td>
                          <td className="py-3 px-4 text-center"><span className="inline-block min-w-[2rem] px-2 py-0.5 bg-success-50 text-success-700 rounded text-sm font-medium">{r.present_count}</span></td>
                          <td className="py-3 px-4 text-center"><span className="inline-block min-w-[2rem] px-2 py-0.5 bg-warning-50 text-warning-700 rounded text-sm font-medium">{r.late_count}</span></td>
                          <td className="py-3 px-4 text-center"><span className="inline-block min-w-[2rem] px-2 py-0.5 bg-info-50 text-info-700 rounded text-sm font-medium">{r.leave_count}</span></td>
                          <td className="py-3 px-4 text-center font-semibold">{r.total_records}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
