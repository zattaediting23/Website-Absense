import { useAuth } from '../../contexts/AuthContext'
import { useSector } from '../../contexts/SectorContext'

export default function Header({ onMenuToggle }) {
  const { user } = useAuth()
  const { sector } = useSector()

  const sectorLabels = {
    education: 'Pendidikan',
    corporate: 'Perusahaan',
    umkm: 'UMKM',
    healthcare: 'Kesehatan'
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <i className="fa-solid fa-bars text-gray-600"></i>
        </button>
        <div>
          <p className="text-sm text-gray-500">{user?.organization_name || 'Absense'}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {sector && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full border border-primary-200">
            <i className="fa-solid fa-tag"></i>
            {sectorLabels[sector] || sector}
          </span>
        )}
        <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {user?.full_name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-800">{user?.full_name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
