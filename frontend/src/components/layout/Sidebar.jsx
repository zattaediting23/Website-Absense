import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useSector } from '../../contexts/SectorContext'

const navItems = [
  { path: '/dashboard', icon: 'fa-solid fa-chart-line', label: 'Dashboard', roles: ['superadmin','admin','member'] },
  { path: '/attendance', icon: 'fa-solid fa-clipboard-check', label: 'Absensi', termKey: 'attendance', roles: ['superadmin','admin','member'] },
  { path: '/users', icon: 'fa-solid fa-users', label: 'Pengguna', roles: ['superadmin','admin'] },
  { path: '/schedules', icon: 'fa-solid fa-calendar-days', label: 'Jadwal', termKey: 'schedule', roles: ['superadmin','admin'] },
  { path: '/departments', icon: 'fa-solid fa-building', label: 'Departemen', termKey: 'department', roles: ['superadmin','admin'] },
  { path: '/leaves', icon: 'fa-solid fa-file-lines', label: 'Izin/Cuti', termKey: 'leave', roles: ['superadmin','admin','member'] },
  { path: '/overtime', icon: 'fa-solid fa-business-time', label: 'Lembur', termKey: 'overtime', roles: ['superadmin','admin','member'] },
  { type: 'separator', roles: ['superadmin','admin'] },
  { path: '/analytics', icon: 'fa-solid fa-chart-pie', label: 'Analitik', roles: ['superadmin','admin'] },
  { path: '/payroll', icon: 'fa-solid fa-money-bill-wave', label: 'Penggajian', roles: ['superadmin','admin'] },
  { path: '/announcements', icon: 'fa-solid fa-bullhorn', label: 'Pengumuman', roles: ['superadmin','admin','member'] },
  { path: '/holidays', icon: 'fa-solid fa-calendar-xmark', label: 'Hari Libur', roles: ['superadmin','admin'] },
  { type: 'separator', roles: ['superadmin','admin'] },
  { path: '/reports', icon: 'fa-solid fa-chart-bar', label: 'Laporan', roles: ['superadmin','admin'] },
  { path: '/settings', icon: 'fa-solid fa-gear', label: 'Pengaturan', roles: ['superadmin','admin'] },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const { t } = useSector()
  const location = useLocation()

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose}></div>
      )}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand */}
        <div className="px-6 py-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide">Absense</h1>
              <p className="text-xs text-gray-400">v2.0 • Enterprise</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-0.5">
            {navItems
              .filter(item => item.roles.includes(user?.role))
              .map((item, idx) => {
                if (item.type === 'separator') {
                  return <li key={`sep-${idx}`} className="my-2 mx-2 border-t border-gray-700"></li>
                }
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                          isActive
                            ? 'bg-sidebar-active text-white'
                            : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
                        }`
                      }
                    >
                      <i className={`${item.icon} w-5 text-center`}></i>
                      <span>{item.termKey ? t(item.termKey) : item.label}</span>
                    </NavLink>
                  </li>
                )
              })}
          </ul>
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-secondary-500 rounded-full flex items-center justify-center text-sm font-semibold">
              {user?.full_name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-sidebar-hover hover:text-white transition-colors duration-150">
            <i className="fa-solid fa-right-from-bracket w-5 text-center"></i>
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  )
}
