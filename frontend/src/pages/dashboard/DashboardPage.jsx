import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { useAuth } from '../../contexts/AuthContext'
import { useSector } from '../../contexts/SectorContext'
import { StatCard, LoadingSpinner, Badge } from '../../components/common'
import api from '../../services/api'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function DashboardPage() {
  const { user } = useAuth()
  const { t } = useSector()
  const [summary, setSummary] = useState(null)
  const [todayRecord, setTodayRecord] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [upcomingHolidays, setUpcomingHolidays] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const promises = [api.get('/attendance/today'), api.get('/announcements/active')]
      if (user.role !== 'member') promises.push(api.get('/reports/summary'))
      try { promises.push(api.get('/holidays', { params: { year: new Date().getFullYear() } })) } catch {}

      const results = await Promise.allSettled(promises)
      setTodayRecord(results[0].status === 'fulfilled' ? results[0].value.data.record : null)
      setAnnouncements(results[1].status === 'fulfilled' ? results[1].value.data.announcements?.slice(0, 3) || [] : [])
      if (user.role !== 'member' && results[2]?.status === 'fulfilled') setSummary(results[2].value.data)

      // Filter upcoming holidays
      if (results[3]?.status === 'fulfilled') {
        const today = new Date()
        const upcoming = (results[3].value.data.holidays || [])
          .filter(h => new Date(h.date) >= today)
          .slice(0, 5)
        setUpcomingHolidays(upcoming)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleClockIn() {
    try {
      const res = await api.post('/attendance/clock-in')
      setTodayRecord(res.data.record)
    } catch (err) { alert(err.response?.data?.error || 'Gagal clock in') }
  }

  async function handleClockOut() {
    try {
      const res = await api.post('/attendance/clock-out')
      setTodayRecord(res.data.record)
    } catch (err) { alert(err.response?.data?.error || 'Gagal clock out') }
  }

  if (loading) return <LoadingSpinner />

  const weeklyChart = summary?.weeklyChart || []
  const dates = [...new Set(weeklyChart.map(r => r.date))].sort()
  const chartData = {
    labels: dates.map(d => new Date(d).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })),
    datasets: [
      { label: 'Hadir', data: dates.map(d => weeklyChart.filter(r => r.date === d && r.status === 'present').reduce((s, r) => s + r.count, 0)), backgroundColor: '#2d6a4f' },
      { label: 'Terlambat', data: dates.map(d => weeklyChart.filter(r => r.date === d && r.status === 'late').reduce((s, r) => s + r.count, 0)), backgroundColor: '#e9c46a' },
      { label: 'Izin/Cuti', data: dates.map(d => weeklyChart.filter(r => r.date === d && ['leave','sick','permission'].includes(r.status)).reduce((s, r) => s + r.count, 0)), backgroundColor: '#457b9d' },
    ]
  }
  const chartOptions = {
    responsive: true, plugins: { legend: { position: 'bottom' } },
    scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } }
  }

  const statusLabels = { present: 'Hadir', late: 'Terlambat', absent: 'Belum Absen', leave: 'Izin', sick: 'Sakit', permission: 'Izin' }
  const priorityColors = { low: 'border-l-gray-300', normal: 'border-l-primary-400', high: 'border-l-warning-400', urgent: 'border-l-danger-500' }

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Selamat datang, {user.full_name}</p>

      {/* Announcement Ticker */}
      {announcements.length > 0 && (
        <div className="mb-6 space-y-2">
          {announcements.map(a => (
            <div key={a.id} className={`flex items-start gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200 border-l-4 ${priorityColors[a.priority] || 'border-l-primary-400'} animate-slide-in`}>
              <i className={`fa-solid ${a.priority === 'urgent' ? 'fa-circle-exclamation text-danger-500' : a.priority === 'high' ? 'fa-triangle-exclamation text-warning-500' : 'fa-bullhorn text-primary-500'} mt-0.5`}></i>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{a.title}</p>
                <p className="text-xs text-gray-500 truncate">{a.content}</p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{new Date(a.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
            </div>
          ))}
          <Link to="/announcements" className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium ml-1">
            Lihat semua pengumuman <i className="fa-solid fa-arrow-right text-xs"></i>
          </Link>
        </div>
      )}

      {/* Quick Clock In/Out */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              <i className="fa-solid fa-clock mr-2 text-primary-500"></i>
              {t('attendance')} Hari Ini
            </h2>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {todayRecord?.clock_in && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Masuk:</span> {new Date(todayRecord.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                {todayRecord.clock_out && (
                  <span className="ml-3"><span className="font-medium">Keluar:</span> {new Date(todayRecord.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </div>
            )}
            {!todayRecord?.clock_in ? (
              <button onClick={handleClockIn} className="btn-success"><i className="fa-solid fa-right-to-bracket mr-2"></i>Clock In</button>
            ) : !todayRecord?.clock_out ? (
              <button onClick={handleClockOut} className="btn-danger"><i className="fa-solid fa-right-from-bracket mr-2"></i>Clock Out</button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-success-50 text-success-700 rounded text-sm font-medium">
                <i className="fa-solid fa-circle-check"></i> Selesai
              </span>
            )}
          </div>
        </div>
        {todayRecord?.status && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
              todayRecord.status === 'present' ? 'bg-success-50 text-success-700' :
              todayRecord.status === 'late' ? 'bg-warning-50 text-warning-700' :
              'bg-info-50 text-info-700'
            }`}>
              Status: {statusLabels[todayRecord.status]}
            </span>
          </div>
        )}
      </div>

      {/* Admin Stats */}
      {user.role !== 'member' && summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon="fa-solid fa-users" label={`Total ${t('member')}`} value={summary.today.total_members} color="primary" />
            <StatCard icon="fa-solid fa-circle-check" label="Hadir" value={summary.today.present} color="success" />
            <StatCard icon="fa-solid fa-clock" label="Terlambat" value={summary.today.late} color="warning" />
            <StatCard icon="fa-solid fa-circle-xmark" label="Belum Absen" value={summary.today.absent} color="danger" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                <i className="fa-solid fa-chart-bar mr-2 text-secondary-500"></i>
                {t('attendance')} 7 Hari Terakhir
              </h3>
              {dates.length > 0 ? <Bar data={chartData} options={chartOptions} /> : <p className="text-sm text-gray-400 text-center py-8">Belum ada data</p>}
            </div>
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  <i className="fa-solid fa-circle-info mr-2 text-info-500"></i>Ringkasan
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600"><i className="fa-solid fa-file-lines mr-2 text-warning-400"></i>{t('leave')} Pending</span>
                    <span className="text-lg font-bold text-gray-800">{summary.pendingLeaves}</span>
                  </div>
                  {summary.monthlyStats.map((s, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600 capitalize">{statusLabels[s.status] || s.status} (Bulan ini)</span>
                      <span className="text-lg font-bold text-gray-800">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Holidays */}
              {upcomingHolidays.length > 0 && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">
                    <i className="fa-solid fa-calendar-xmark mr-2 text-danger-400"></i>Hari Libur Mendatang
                  </h3>
                  <div className="space-y-2">
                    {upcomingHolidays.map(h => (
                      <div key={h.id} className="flex items-center gap-3 py-1.5">
                        <div className="w-8 h-8 bg-danger-50 text-danger-600 rounded flex items-center justify-center text-xs font-bold">
                          {new Date(h.date).getDate()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">{h.name}</p>
                          <p className="text-xs text-gray-400">{new Date(h.date).toLocaleDateString('id-ID', { month: 'long' })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
