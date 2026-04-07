import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import api from '../services/api'

const SectorContext = createContext(null)

const defaults = {
  organization: 'Organisasi', member: 'Anggota', department: 'Departemen',
  schedule: 'Jadwal', attendance: 'Absensi', admin: 'Admin',
  leave: 'Izin', overtime: 'Lembur'
}

export function SectorProvider({ children }) {
  const { user } = useAuth()
  const [terms, setTerms] = useState(defaults)
  const [sector, setSector] = useState(null)

  useEffect(() => {
    if (user) loadTerminology()
    else { setTerms(defaults); setSector(null) }
  }, [user])

  async function loadTerminology() {
    try {
      const res = await api.get('/settings/terminology')
      const map = {}
      res.data.terminology.forEach(t => { map[t.generic_term] = t.sector_term })
      setTerms({ ...defaults, ...map })
      setSector(res.data.sector)
    } catch { setTerms(defaults) }
  }

  function t(key) { return terms[key] || key }

  return (
    <SectorContext.Provider value={{ terms, sector, t }}>
      {children}
    </SectorContext.Provider>
  )
}

export function useSector() {
  const ctx = useContext(SectorContext)
  if (!ctx) throw new Error('useSector must be used within SectorProvider')
  return ctx
}
