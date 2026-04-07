import { useState, useEffect } from 'react'
import { useSector } from '../../contexts/SectorContext'
import { LoadingSpinner, Badge, EmptyState, Modal, Alert, StatCard } from '../../components/common'
import api from '../../services/api'

export default function PayrollPage() {
  const { t } = useSector()
  const [tab, setTab] = useState('list')
  const [payrolls, setPayrolls] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  })
  const [settingsForm, setSettingsForm] = useState({})
  const [message, setMessage] = useState({ type: '', text: '' })
  const [savingSettings, setSavingSettings] = useState(false)
  const [slipModal, setSlipModal] = useState({ open: false, data: null })

  useEffect(() => { loadData() }, [tab, filters.month, filters.year])

  async function loadData() {
    setLoading(true)
    try {
      if (tab === 'list') {
        const res = await api.get('/payroll', { params: filters })
        setPayrolls(res.data.payrolls)
      } else {
        const res = await api.get('/payroll/settings')
        setSettings(res.data)
        setSettingsForm({
          base_salary: res.data.base_salary || 0,
          transport_allowance: res.data.transport_allowance || 0,
          meal_allowance: res.data.meal_allowance || 0,
          late_deduction_per_minute: res.data.late_deduction_per_minute || 0,
          absent_deduction_per_day: res.data.absent_deduction_per_day || 0,
          overtime_rate_per_hour: res.data.overtime_rate_per_hour || 0
        })
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleGenerate() {
    if (!confirm(`Generate payroll untuk ${new Date(2000, filters.month - 1).toLocaleDateString('id-ID', { month: 'long' })} ${filters.year}?`)) return
    setGenerating(true)
    try {
      const res = await api.post('/payroll/generate', { month: filters.month, year: filters.year })
      setPayrolls(res.data.payrolls)
      setMessage({ type: 'success', text: `Payroll berhasil di-generate untuk ${res.data.payrolls.length} ${t('member')}` })
    } catch (err) { setMessage({ type: 'danger', text: err.response?.data?.error || 'Gagal generate payroll' }) }
    finally { setGenerating(false) }
  }

  async function handleSaveSettings(e) {
    e.preventDefault()
    setSavingSettings(true)
    try {
      await api.put('/payroll/settings', settingsForm)
      setMessage({ type: 'success', text: 'Pengaturan gaji berhasil disimpan' })
    } catch (err) { setMessage({ type: 'danger', text: err.response?.data?.error || 'Gagal menyimpan' }) }
    finally { setSavingSettings(false) }
  }

  async function handleViewSlip(id) {
    try {
      const res = await api.get(`/payroll/${id}`)
      setSlipModal({ open: true, data: res.data })
    } catch (err) { alert('Gagal memuat slip gaji') }
  }

  async function handleUpdateStatus(id, status) {
    try {
      await api.patch(`/payroll/${id}/status`, { status })
      loadData()
    } catch (err) { alert(err.response?.data?.error || 'Gagal update status') }
  }

  function formatRupiah(num) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0)
  }

  const statusMap = { draft: { label: 'Draft', type: 'warning' }, confirmed: { label: 'Dikonfirmasi', type: 'primary' }, paid: { label: 'Dibayar', type: 'success' } }

  // Stats
  const totalGross = payrolls.reduce((s, p) => s + parseFloat(p.gross_pay || 0), 0)
  const totalNet = payrolls.reduce((s, p) => s + parseFloat(p.net_pay || 0), 0)
  const totalDeductions = payrolls.reduce((s, p) => s + parseFloat(p.deductions || 0), 0)

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title mb-0">Penggajian (Payroll)</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola gaji dan slip pembayaran</p>
        </div>
        {tab === 'list' && (
          <button onClick={handleGenerate} disabled={generating} className="btn-primary">
            {generating ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Generating...</> : <><i className="fa-solid fa-calculator mr-2"></i>Generate Payroll</>}
          </button>
        )}
      </div>

      {message.text && <div className="mb-4"><Alert type={message.type} onClose={() => setMessage({ type: '', text: '' })}>{message.text}</Alert></div>}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        <button onClick={() => setTab('list')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'list' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <i className="fa-solid fa-list mr-2"></i>Daftar Gaji
        </button>
        <button onClick={() => setTab('settings')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'settings' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <i className="fa-solid fa-gear mr-2"></i>Pengaturan Gaji
        </button>
      </div>

      {/* List Tab */}
      {tab === 'list' && (
        <div>
          {/* Filter */}
          <div className="card mb-4">
            <div className="flex items-center gap-3">
              <select className="select-field w-auto" value={filters.month}
                onChange={e => setFilters({ ...filters, month: parseInt(e.target.value) })}>
                {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleDateString('id-ID', { month: 'long' })}</option>)}
              </select>
              <input type="number" className="input-field w-24" value={filters.year}
                onChange={e => setFilters({ ...filters, year: parseInt(e.target.value) })} />
            </div>
          </div>

          {/* Summary */}
          {payrolls.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <StatCard icon="fa-solid fa-money-bill-wave" label="Total Gross" value={formatRupiah(totalGross)} color="primary" />
              <StatCard icon="fa-solid fa-wallet" label="Total Net" value={formatRupiah(totalNet)} color="success" />
              <StatCard icon="fa-solid fa-minus-circle" label="Total Potongan" value={formatRupiah(totalDeductions)} color="danger" />
            </div>
          )}

          {/* Table */}
          <div className="card">
            {loading ? <LoadingSpinner /> : payrolls.length === 0 ? (
              <EmptyState icon="fa-solid fa-money-check-dollar" title="Belum ada data payroll" description="Generate payroll terlebih dahulu" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Nama</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">{t('department')}</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-600">Hadir</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-600">Telat</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-600">Alfa</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">Gaji Kotor</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">Potongan</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">Gaji Bersih</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-600">Status</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrolls.map(p => (
                      <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-800">{p.full_name}</p>
                          {p.employee_id && <p className="text-xs text-gray-400">{p.employee_id}</p>}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{p.department_name || '-'}</td>
                        <td className="py-3 px-4 text-center"><span className="inline-block min-w-[2rem] px-2 py-0.5 bg-success-50 text-success-700 rounded text-xs font-medium">{p.present_days}</span></td>
                        <td className="py-3 px-4 text-center"><span className="inline-block min-w-[2rem] px-2 py-0.5 bg-warning-50 text-warning-700 rounded text-xs font-medium">{p.late_days}</span></td>
                        <td className="py-3 px-4 text-center"><span className="inline-block min-w-[2rem] px-2 py-0.5 bg-danger-50 text-danger-700 rounded text-xs font-medium">{p.absent_days}</span></td>
                        <td className="py-3 px-4 text-right text-gray-700">{formatRupiah(p.gross_pay)}</td>
                        <td className="py-3 px-4 text-right text-danger-600">{formatRupiah(p.deductions)}</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-800">{formatRupiah(p.net_pay)}</td>
                        <td className="py-3 px-4 text-center"><Badge type={statusMap[p.status]?.type}>{statusMap[p.status]?.label}</Badge></td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleViewSlip(p.id)} className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs font-medium hover:bg-primary-100 transition-colors" title="Lihat Slip">
                              <i className="fa-solid fa-receipt"></i>
                            </button>
                            {p.status === 'draft' && (
                              <button onClick={() => handleUpdateStatus(p.id, 'confirmed')} className="px-2 py-1 bg-success-50 text-success-700 rounded text-xs font-medium hover:bg-success-100 transition-colors" title="Konfirmasi">
                                <i className="fa-solid fa-check"></i>
                              </button>
                            )}
                            {p.status === 'confirmed' && (
                              <button onClick={() => handleUpdateStatus(p.id, 'paid')} className="px-2 py-1 bg-info-50 text-info-700 rounded text-xs font-medium hover:bg-info-100 transition-colors" title="Tandai Dibayar">
                                <i className="fa-solid fa-money-bill"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {tab === 'settings' && (
        <div className="card max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            <i className="fa-solid fa-sliders mr-2 text-primary-500"></i>Parameter Penggajian
          </h2>
          {loading ? <LoadingSpinner /> : (
            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Gaji Pokok (Rp)</label>
                  <input type="number" className="input-field" value={settingsForm.base_salary} onChange={e => setSettingsForm({ ...settingsForm, base_salary: e.target.value })} />
                </div>
                <div>
                  <label className="label-field">Tunjangan Transport (Rp)</label>
                  <input type="number" className="input-field" value={settingsForm.transport_allowance} onChange={e => setSettingsForm({ ...settingsForm, transport_allowance: e.target.value })} />
                </div>
                <div>
                  <label className="label-field">Tunjangan Makan (Rp)</label>
                  <input type="number" className="input-field" value={settingsForm.meal_allowance} onChange={e => setSettingsForm({ ...settingsForm, meal_allowance: e.target.value })} />
                </div>
                <div>
                  <label className="label-field">Potongan Telat / menit (Rp)</label>
                  <input type="number" className="input-field" value={settingsForm.late_deduction_per_minute} onChange={e => setSettingsForm({ ...settingsForm, late_deduction_per_minute: e.target.value })} />
                </div>
                <div>
                  <label className="label-field">Potongan Absen / hari (Rp)</label>
                  <input type="number" className="input-field" value={settingsForm.absent_deduction_per_day} onChange={e => setSettingsForm({ ...settingsForm, absent_deduction_per_day: e.target.value })} />
                </div>
                <div>
                  <label className="label-field">Tarif Lembur / jam (Rp)</label>
                  <input type="number" className="input-field" value={settingsForm.overtime_rate_per_hour} onChange={e => setSettingsForm({ ...settingsForm, overtime_rate_per_hour: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button type="submit" disabled={savingSettings} className="btn-primary">
                  {savingSettings ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Menyimpan...</> : <><i className="fa-solid fa-floppy-disk mr-2"></i>Simpan Pengaturan</>}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Slip Modal */}
      <Modal isOpen={slipModal.open} onClose={() => setSlipModal({ open: false, data: null })} title="Slip Gaji" size="lg">
        {slipModal.data && (
          <div id="payslip-content">
            <div className="border border-gray-200 rounded-lg p-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-300 pb-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-primary-800">{slipModal.data.organization_name}</h2>
                  <p className="text-xs text-gray-500">{slipModal.data.organization_address || ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-700">SLIP GAJI</p>
                  <p className="text-xs text-gray-500">Periode: {new Date(2000, slipModal.data.period_month - 1).toLocaleDateString('id-ID', { month: 'long' })} {slipModal.data.period_year}</p>
                </div>
              </div>

              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <p className="text-gray-500">Nama</p>
                  <p className="font-semibold text-gray-800">{slipModal.data.full_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">ID Karyawan</p>
                  <p className="font-semibold text-gray-800">{slipModal.data.employee_id || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t('department')}</p>
                  <p className="font-semibold text-gray-800">{slipModal.data.department_name || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-semibold text-gray-800">{slipModal.data.email}</p>
                </div>
              </div>

              {/* Attendance Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Ringkasan Kehadiran</h4>
                <div className="grid grid-cols-5 gap-3 text-center text-sm">
                  <div><p className="text-xs text-gray-500">Hari Kerja</p><p className="font-bold">{slipModal.data.working_days}</p></div>
                  <div><p className="text-xs text-gray-500">Hadir</p><p className="font-bold text-success-600">{slipModal.data.present_days}</p></div>
                  <div><p className="text-xs text-gray-500">Telat</p><p className="font-bold text-warning-600">{slipModal.data.late_days}</p></div>
                  <div><p className="text-xs text-gray-500">Alpa</p><p className="font-bold text-danger-600">{slipModal.data.absent_days}</p></div>
                  <div><p className="text-xs text-gray-500">Izin/Cuti</p><p className="font-bold text-info-600">{slipModal.data.leave_days}</p></div>
                </div>
              </div>

              {/* Pay Details */}
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between py-1"><span className="text-gray-600">Gaji Pokok</span><span className="font-medium">{formatRupiah(slipModal.data.details?.base_salary)}</span></div>
                <div className="flex justify-between py-1"><span className="text-gray-600">Tunjangan Transport</span><span className="font-medium">{formatRupiah(slipModal.data.details?.transport_allowance)}</span></div>
                <div className="flex justify-between py-1"><span className="text-gray-600">Tunjangan Makan</span><span className="font-medium">{formatRupiah(slipModal.data.details?.meal_allowance)}</span></div>
                {parseFloat(slipModal.data.overtime_pay) > 0 && (
                  <div className="flex justify-between py-1"><span className="text-gray-600">Lembur ({slipModal.data.overtime_hours} jam)</span><span className="font-medium text-success-600">+{formatRupiah(slipModal.data.overtime_pay)}</span></div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between py-1"><span className="font-semibold">Gaji Kotor</span><span className="font-bold">{formatRupiah(slipModal.data.gross_pay)}</span></div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <p className="text-xs font-semibold text-danger-600 uppercase">Potongan</p>
                {parseFloat(slipModal.data.details?.late_deduction) > 0 && (
                  <div className="flex justify-between py-1"><span className="text-gray-600">Potongan Keterlambatan</span><span className="font-medium text-danger-600">-{formatRupiah(slipModal.data.details?.late_deduction)}</span></div>
                )}
                {parseFloat(slipModal.data.details?.absent_deduction) > 0 && (
                  <div className="flex justify-between py-1"><span className="text-gray-600">Potongan Ketidakhadiran</span><span className="font-medium text-danger-600">-{formatRupiah(slipModal.data.details?.absent_deduction)}</span></div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between py-1"><span className="font-semibold">Total Potongan</span><span className="font-bold text-danger-600">{formatRupiah(slipModal.data.deductions)}</span></div>
              </div>

              {/* Net Pay */}
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex justify-between items-center">
                <span className="text-lg font-bold text-primary-800">GAJI BERSIH (Take Home Pay)</span>
                <span className="text-2xl font-extrabold text-primary-800">{formatRupiah(slipModal.data.net_pay)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
