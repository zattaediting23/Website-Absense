import { useState, useEffect } from 'react'
import { Pie, Line, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { LoadingSpinner, StatCard, EmptyState } from '../../components/common'
import api from '../../services/api'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler)

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [monthlyTrend, setMonthlyTrend] = useState(null)
  const [deptStats, setDeptStats] = useState([])
  const [topPerformers, setTopPerformers] = useState([])
  const [distribution, setDistribution] = useState([])
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  })

  useEffect(() => { loadData() }, [filters.month, filters.year])

  async function loadData() {
    setLoading(true)
    try {
      const [statsRes, trendRes, deptRes, perfRes, distRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/monthly-trend', { params: filters }),
        api.get('/analytics/department-stats'),
        api.get('/analytics/top-performers', { params: filters }),
        api.get('/analytics/status-distribution', { params: filters })
      ])
      setStats(statsRes.data)
      setMonthlyTrend(trendRes.data)
      setDeptStats(deptRes.data.departments)
      setTopPerformers(perfRes.data.performers)
      setDistribution(distRes.data.distribution)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  if (loading) return <LoadingSpinner />

  // Pie Chart - Status Distribution
  const statusLabels = { present: 'Hadir', late: 'Terlambat', leave: 'Cuti', sick: 'Sakit', permission: 'Izin' }
  const statusColors = { present: '#2d6a4f', late: '#e9c46a', leave: '#457b9d', sick: '#e76343', permission: '#4a6fa5' }
  const pieData = {
    labels: distribution.map(d => statusLabels[d.status] || d.status),
    datasets: [{
      data: distribution.map(d => d.count),
      backgroundColor: distribution.map(d => statusColors[d.status] || '#888'),
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }
  const pieOptions = {
    responsive: true,
    plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10 } } }
  }

  // Line Chart - Monthly Trend
  const trendDates = monthlyTrend?.data?.map(d => {
    const dt = new Date(d.date)
    return dt.toLocaleDateString('id-ID', { day: 'numeric' })
  }) || []
  const lineData = {
    labels: trendDates,
    datasets: [
      {
        label: 'Hadir', data: monthlyTrend?.data?.map(d => d.present) || [],
        borderColor: '#2d6a4f', backgroundColor: 'rgba(45,106,79,0.1)', fill: true, tension: 0.35, pointRadius: 3
      },
      {
        label: 'Terlambat', data: monthlyTrend?.data?.map(d => d.late) || [],
        borderColor: '#e9c46a', backgroundColor: 'rgba(233,196,106,0.1)', fill: true, tension: 0.35, pointRadius: 3
      },
      {
        label: 'Izin/Cuti', data: monthlyTrend?.data?.map(d => d.leave_count) || [],
        borderColor: '#457b9d', backgroundColor: 'rgba(69,123,157,0.1)', fill: true, tension: 0.35, pointRadius: 3
      }
    ]
  }
  const lineOptions = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
  }

  // Bar Chart - Department Stats
  const barData = {
    labels: deptStats.map(d => d.department_name || 'Tanpa Dept'),
    datasets: [
      { label: 'Hadir', data: deptStats.map(d => d.present_today), backgroundColor: '#2d6a4f' },
      { label: 'Terlambat', data: deptStats.map(d => d.late_today), backgroundColor: '#e9c46a' },
      { label: 'Belum', data: deptStats.map(d => Math.max(0, d.total_members - d.present_today - d.late_today)), backgroundColor: '#c1121f' }
    ]
  }
  const barOptions = {
    responsive: true,
    plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } } },
    scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title mb-0">Analitik & Statistik</h1>
          <p className="text-sm text-gray-500 mt-1">Visualisasi data kehadiran secara mendalam</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="select-field w-auto text-sm" value={filters.month}
            onChange={e => setFilters({ ...filters, month: parseInt(e.target.value) })}>
            {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleDateString('id-ID', { month: 'long' })}</option>)}
          </select>
          <input type="number" className="input-field w-24 text-sm" value={filters.year}
            onChange={e => setFilters({ ...filters, year: parseInt(e.target.value) })} />
        </div>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard icon="fa-solid fa-users" label="Total Anggota" value={stats.total_members} color="primary" />
          <StatCard icon="fa-solid fa-circle-check" label="Hadir Hari Ini" value={stats.present} color="success" />
          <StatCard icon="fa-solid fa-clock" label="Terlambat" value={stats.late} color="warning" />
          <StatCard icon="fa-solid fa-circle-xmark" label="Belum Absen" value={stats.absent} color="danger" />
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            <i className="fa-solid fa-chart-line mr-2 text-primary-500"></i>Tren Kehadiran Bulanan
          </h3>
          {trendDates.length > 0 ? <Line data={lineData} options={lineOptions} /> :
            <EmptyState title="Belum ada data" description="Data tren akan muncul di sini" />}
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            <i className="fa-solid fa-chart-pie mr-2 text-secondary-500"></i>Distribusi Status
          </h3>
          {distribution.length > 0 ? <Pie data={pieData} options={pieOptions} /> :
            <EmptyState title="Belum ada data" />}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            <i className="fa-solid fa-building mr-2 text-accent-500"></i>Perbandingan per Departemen (Hari Ini)
          </h3>
          {deptStats.length > 0 ? <Bar data={barData} options={barOptions} /> :
            <EmptyState title="Belum ada departemen" />}
        </div>

        {/* Top Performers */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            <i className="fa-solid fa-trophy mr-2 text-warning-400"></i>Top Performers Bulan Ini
          </h3>
          {topPerformers.length === 0 ? <EmptyState title="Belum ada data" /> : (
            <div className="space-y-2">
              {topPerformers.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${i === 0 ? 'bg-warning-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-accent-500' : 'bg-gray-300'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.full_name}</p>
                    <p className="text-xs text-gray-400">{p.department_name || 'Tanpa Departemen'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-success-600">{p.attendance_rate}%</p>
                    <p className="text-xs text-gray-400">{p.present_count} hadir</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
