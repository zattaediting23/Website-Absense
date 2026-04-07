import { useState, useEffect } from 'react'
import { useSector } from '../../contexts/SectorContext'
import { LoadingSpinner, Alert } from '../../components/common'
import api from '../../services/api'

export default function SettingsPage() {
  const { t, sector } = useSector()
  const [org, setOrg] = useState(null)
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '' })
  const [terminology, setTerminology] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [orgRes, termRes] = await Promise.all([
        api.get('/settings/organization'),
        api.get('/settings/terminology')
      ])
      setOrg(orgRes.data)
      setForm({ name: orgRes.data.name || '', address: orgRes.data.address || '', phone: orgRes.data.phone || '', email: orgRes.data.email || '' })
      setTerminology(termRes.data.terminology)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true); setMessage({ type: '', text: '' })
    try {
      await api.put('/settings/organization', form)
      setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan' })
    } catch (err) { setMessage({ type: 'danger', text: err.response?.data?.error || 'Gagal menyimpan' }) }
    finally { setSaving(false) }
  }

  const sectorLabels = { education: 'Pendidikan', corporate: 'Perusahaan', umkm: 'UMKM', healthcare: 'Kesehatan' }
  const sectorIcons = { education: 'fa-solid fa-graduation-cap', corporate: 'fa-solid fa-briefcase', umkm: 'fa-solid fa-store', healthcare: 'fa-solid fa-heart-pulse' }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="page-title">Pengaturan</h1>
      <p className="page-subtitle">Kelola profil {t('organization')} dan konfigurasi sistem</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organization Profile */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              <i className="fa-solid fa-building mr-2 text-primary-500"></i>Profil {t('organization')}
            </h2>

            {message.text && <div className="mb-4"><Alert type={message.type} onClose={() => setMessage({ type: '', text: '' })}>{message.text}</Alert></div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label-field">Nama {t('organization')} *</label>
                <input type="text" className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label className="label-field">Alamat</label>
                <textarea className="input-field" rows="3" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Masukkan alamat lengkap"></textarea>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Telepon</label>
                  <input type="text" className="input-field" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div>
                  <label className="label-field">Email</label>
                  <input type="email" className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Menyimpan...</> : <><i className="fa-solid fa-floppy-disk mr-2"></i>Simpan Perubahan</>}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sector Info */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              <i className="fa-solid fa-tag mr-2 text-secondary-500"></i>Sektor
            </h2>
            <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center text-white">
                <i className={sectorIcons[sector] || 'fa-solid fa-building'}></i>
              </div>
              <div>
                <p className="font-semibold text-primary-800">{sectorLabels[sector] || sector}</p>
                <p className="text-xs text-primary-600">Sektor aktif</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              <i className="fa-solid fa-language mr-2 text-accent-500"></i>Terminologi
            </h2>
            <p className="text-xs text-gray-400 mb-3">Istilah yang disesuaikan untuk sektor {sectorLabels[sector]}</p>
            <div className="space-y-2">
              {terminology.map((term, i) => (
                <div key={i} className="flex justify-between items-center py-2 px-3 rounded bg-gray-50 text-sm">
                  <span className="text-gray-500 capitalize">{term.generic_term}</span>
                  <span className="font-medium text-gray-800">{term.sector_term}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
