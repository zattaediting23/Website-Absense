import { useState, useEffect, useRef, useCallback } from 'react'
import { useSector } from '../../contexts/SectorContext'
import { LoadingSpinner, Badge, Pagination, EmptyState, Alert } from '../../components/common'
import api from '../../services/api'

export default function AttendancePage() {
  const { t } = useSector()
  const [todayRecord, setTodayRecord] = useState(null)
  const [history, setHistory] = useState({ records: [], total: 0, page: 1, limit: 10 })
  const [filters, setFilters] = useState({ startDate: '', endDate: '' })
  const [loading, setLoading] = useState(true)
  const [clockTime, setClockTime] = useState(new Date())
  const [geoStatus, setGeoStatus] = useState({ lat: null, lng: null, error: null, loading: false })
  const [cameraActive, setCameraActive] = useState(false)
  const [photoData, setPhotoData] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [actionMessage, setActionMessage] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => { loadData() }, [])
  useEffect(() => {
    const timer = setInterval(() => setClockTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  async function loadData() {
    try {
      const [todayRes, historyRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get('/attendance/my-history', { params: { page: 1, limit: 10 } })
      ])
      setTodayRecord(todayRes.data.record)
      setHistory(historyRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function loadHistory(page = 1) {
    try {
      const res = await api.get('/attendance/my-history', { params: { ...filters, page, limit: 10 } })
      setHistory(res.data)
    } catch (err) { console.error(err) }
  }

  // Geolocation
  function getLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation tidak didukung browser ini'))
        return
      }
      setGeoStatus(prev => ({ ...prev, loading: true, error: null }))
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          setGeoStatus({ lat: latitude, lng: longitude, error: null, loading: false })
          resolve({ latitude, longitude })
        },
        (err) => {
          const errorMsg = err.code === 1 ? 'Izin lokasi ditolak. Mohon aktifkan GPS.' :
                          err.code === 2 ? 'Lokasi tidak tersedia' : 'Timeout mendapatkan lokasi'
          setGeoStatus(prev => ({ ...prev, error: errorMsg, loading: false }))
          reject(new Error(errorMsg))
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    })
  }

  // Camera
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 360 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraActive(true)
      setPhotoData(null)
    } catch (err) {
      setActionMessage({ type: 'danger', text: 'Gagal mengakses kamera. Mohon izinkan akses kamera.' })
    }
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    const data = canvas.toDataURL('image/jpeg', 0.7)
    setPhotoData(data)
    stopCamera()
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  function retakePhoto() {
    setPhotoData(null)
    startCamera()
  }

  // Clock In/Out with geo + photo
  async function handleClockAction(action) {
    setProcessing(true)
    setActionMessage(null)
    try {
      // Get location
      let location = { latitude: null, longitude: null }
      try {
        location = await getLocation()
      } catch (geoErr) {
        // Location is optional - warn but continue
        setActionMessage({ type: 'warning', text: `GPS: ${geoErr.message}. Absen tetap dicatat tanpa lokasi.` })
      }

      // Build payload
      const payload = {
        latitude: location.latitude,
        longitude: location.longitude,
        photo_url: photoData || null,
        device_info: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          screenRes: `${window.screen.width}x${window.screen.height}`
        }
      }

      const endpoint = action === 'in' ? '/attendance/clock-in' : '/attendance/clock-out'
      const res = await api.post(endpoint, payload)
      setTodayRecord(res.data.record)
      setPhotoData(null)
      loadHistory()
      setActionMessage({ type: 'success', text: res.data.message || `Clock ${action} berhasil!` })
    } catch (err) {
      setActionMessage({ type: 'danger', text: err.response?.data?.error || `Gagal clock ${action}` })
    }
    finally { setProcessing(false) }
  }

  // Cleanup camera on unmount
  useEffect(() => { return () => stopCamera() }, [])

  if (loading) return <LoadingSpinner />

  const statusMap = {
    present: { label: 'Hadir', type: 'success' }, late: { label: 'Terlambat', type: 'warning' },
    absent: { label: 'Absen', type: 'danger' }, leave: { label: 'Cuti', type: 'info' },
    sick: { label: 'Sakit', type: 'warning' }, permission: { label: 'Izin', type: 'info' },
  }

  const needsAction = !todayRecord?.clock_in || (todayRecord?.clock_in && !todayRecord?.clock_out)
  const isComplete = todayRecord?.clock_in && todayRecord?.clock_out

  return (
    <div>
      <h1 className="page-title">{t('attendance')}</h1>
      <p className="page-subtitle">Catat kehadiran dengan verifikasi lokasi & foto</p>

      {actionMessage && (
        <div className="mb-4"><Alert type={actionMessage.type} onClose={() => setActionMessage(null)}>{actionMessage.text}</Alert></div>
      )}

      {/* Clock In/Out Card */}
      <div className="card mb-6">
        <div className="flex flex-col items-center py-4">
          <p className="text-sm text-gray-500 mb-2">
            {clockTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-4xl font-bold text-primary-800 mb-4 tabular-nums">
            {clockTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>

          {todayRecord?.clock_in && (
            <div className="flex items-center gap-6 mb-4 text-sm">
              <div className="text-center">
                <p className="text-gray-500">Masuk</p>
                <p className="font-semibold text-success-600">{new Date(todayRecord.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              {todayRecord.clock_out && (
                <div className="text-center">
                  <p className="text-gray-500">Keluar</p>
                  <p className="font-semibold text-danger-500">{new Date(todayRecord.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              )}
            </div>
          )}

          {/* Camera & Photo Section */}
          {needsAction && !isComplete && (
            <div className="w-full max-w-md mb-4">
              {/* Camera Preview / Photo */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-3" style={{ aspectRatio: '4/3' }}>
                {cameraActive && (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                )}
                {photoData && (
                  <img src={photoData} alt="Foto verifikasi" className="w-full h-full object-cover" />
                )}
                {!cameraActive && !photoData && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
                    <i className="fa-solid fa-camera text-4xl mb-3 text-gray-400"></i>
                    <p className="text-sm">Ambil foto untuk verifikasi</p>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="flex items-center justify-center gap-2 mb-3">
                {!cameraActive && !photoData && (
                  <button onClick={startCamera} className="btn-outline btn-sm">
                    <i className="fa-solid fa-camera mr-1"></i>Buka Kamera
                  </button>
                )}
                {cameraActive && (
                  <>
                    <button onClick={capturePhoto} className="btn-primary btn-sm">
                      <i className="fa-solid fa-circle mr-1"></i>Ambil Foto
                    </button>
                    <button onClick={stopCamera} className="btn-ghost btn-sm">Tutup</button>
                  </>
                )}
                {photoData && (
                  <>
                    <span className="text-xs text-success-600 font-medium"><i className="fa-solid fa-check-circle mr-1"></i>Foto siap</span>
                    <button onClick={retakePhoto} className="btn-ghost btn-sm text-xs">Ulangi</button>
                  </>
                )}
              </div>

              {/* Geo Status */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <i className="fa-solid fa-location-dot"></i>
                {geoStatus.loading ? (
                  <span>Mendapatkan lokasi...</span>
                ) : geoStatus.lat ? (
                  <span className="text-success-600">Lokasi: {geoStatus.lat.toFixed(5)}, {geoStatus.lng.toFixed(5)}</span>
                ) : geoStatus.error ? (
                  <span className="text-danger-500">{geoStatus.error}</span>
                ) : (
                  <span>Lokasi akan diambil saat absen</span>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {!todayRecord?.clock_in ? (
              <button onClick={() => handleClockAction('in')} disabled={processing} className="btn-success btn-lg">
                {processing ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-right-to-bracket mr-2"></i>}Clock In
              </button>
            ) : !todayRecord?.clock_out ? (
              <button onClick={() => handleClockAction('out')} disabled={processing} className="btn-danger btn-lg">
                {processing ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-right-from-bracket mr-2"></i>}Clock Out
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 px-6 py-3 bg-success-50 text-success-700 rounded-lg text-lg font-medium">
                <i className="fa-solid fa-circle-check"></i> Absensi Selesai
              </span>
            )}
          </div>
        </div>

        {todayRecord?.status && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-3">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
              todayRecord.status === 'present' ? 'bg-success-50 text-success-700' :
              todayRecord.status === 'late' ? 'bg-warning-50 text-warning-700' :
              'bg-info-50 text-info-700'
            }`}>
              Status: {statusMap[todayRecord.status]?.label}
            </span>
            {todayRecord.latitude && (
              <span className="text-xs text-gray-400">
                <i className="fa-solid fa-map-pin mr-1"></i>
                {parseFloat(todayRecord.latitude).toFixed(4)}, {parseFloat(todayRecord.longitude).toFixed(4)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* History */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            <i className="fa-solid fa-clock-rotate-left mr-2 text-secondary-500"></i>Riwayat {t('attendance')}
          </h2>
          <div className="flex items-center gap-2">
            <input type="date" className="input-field text-sm py-1.5" value={filters.startDate}
              onChange={e => setFilters({...filters, startDate: e.target.value})} />
            <span className="text-gray-400">-</span>
            <input type="date" className="input-field text-sm py-1.5" value={filters.endDate}
              onChange={e => setFilters({...filters, endDate: e.target.value})} />
            <button onClick={() => loadHistory(1)} className="btn-primary btn-sm">
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>
          </div>
        </div>

        {history.records.length === 0 ? (
          <EmptyState icon="fa-solid fa-clipboard" title="Belum ada riwayat" description="Data kehadiran akan muncul di sini" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Tanggal</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Masuk</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Keluar</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Lokasi</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {history.records.map(r => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{new Date(r.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="py-3 px-4">{r.clock_in ? new Date(r.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td className="py-3 px-4">{r.clock_out ? new Date(r.clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td className="py-3 px-4"><Badge type={statusMap[r.status]?.type || 'default'}>{statusMap[r.status]?.label || r.status}</Badge></td>
                    <td className="py-3 px-4">
                      {r.latitude ? (
                        <span className="text-xs text-gray-400"><i className="fa-solid fa-location-dot mr-1 text-success-400"></i>✓</span>
                      ) : (
                        <span className="text-xs text-gray-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-500">{r.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={history.page} total={history.total} limit={history.limit} onChange={loadHistory} />
      </div>
    </div>
  )
}
