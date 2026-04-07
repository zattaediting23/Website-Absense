export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className={`relative bg-white rounded-lg shadow-xl w-full ${sizes[size]} animate-fade-in max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 transition-colors">
            <i className="fa-solid fa-xmark text-gray-500"></i>
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, type = 'danger' }) {
  if (!isOpen) return null
  const colors = { danger: 'btn-danger', warning: 'btn-warning', info: 'btn-primary' }
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || 'Konfirmasi'} size="sm">
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-ghost">Batal</button>
        <button onClick={() => { onConfirm(); onClose(); }} className={colors[type] || 'btn-danger'}>Konfirmasi</button>
      </div>
    </Modal>
  )
}

export function Alert({ type = 'info', children, onClose }) {
  const styles = {
    info: 'bg-info-50 border-info-500 text-info-700',
    success: 'bg-success-50 border-success-500 text-success-700',
    warning: 'bg-warning-50 border-warning-500 text-warning-700',
    danger: 'bg-danger-50 border-danger-500 text-danger-700',
  }
  const icons = {
    info: 'fa-solid fa-circle-info',
    success: 'fa-solid fa-circle-check',
    warning: 'fa-solid fa-triangle-exclamation',
    danger: 'fa-solid fa-circle-xmark',
  }
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded border-l-4 ${styles[type]} animate-slide-in`}>
      <i className={`${icons[type]} mt-0.5`}></i>
      <div className="flex-1 text-sm">{children}</div>
      {onClose && (
        <button onClick={onClose} className="p-0.5 hover:opacity-70">
          <i className="fa-solid fa-xmark"></i>
        </button>
      )}
    </div>
  )
}

export function Badge({ type = 'default', children }) {
  const styles = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-primary-100 text-primary-700',
    success: 'bg-success-50 text-success-700',
    warning: 'bg-warning-50 text-warning-700',
    danger: 'bg-danger-50 text-danger-700',
    info: 'bg-info-50 text-info-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[type]}`}>
      {children}
    </span>
  )
}

export function StatCard({ icon, label, value, color = 'primary', subtitle }) {
  const colors = {
    primary: 'bg-primary-500', secondary: 'bg-secondary-500', success: 'bg-success-500',
    warning: 'bg-warning-300', danger: 'bg-danger-500', info: 'bg-info-500', accent: 'bg-accent-500'
  }
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 ${colors[color]} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <i className={`${icon} text-white text-lg`}></i>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

export function LoadingSpinner({ text = 'Memuat...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <i className="fa-solid fa-spinner fa-spin text-3xl text-primary-500 mb-3"></i>
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  )
}

export function EmptyState({ icon = 'fa-solid fa-inbox', title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <i className={`${icon} text-4xl text-gray-300 mb-4`}></i>
      <h3 className="text-lg font-medium text-gray-500 mb-1">{title || 'Tidak ada data'}</h3>
      {description && <p className="text-sm text-gray-400">{description}</p>}
    </div>
  )
}

export function Pagination({ page, total, limit, onChange }) {
  const totalPages = Math.ceil(total / limit)
  if (totalPages <= 1) return null

  const pages = []
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
      <p className="text-sm text-gray-500">
        Menampilkan {(page - 1) * limit + 1}-{Math.min(page * limit, total)} dari {total}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page <= 1} className="btn-ghost btn-sm disabled:opacity-30">
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        {pages.map(p => (
          <button key={p} onClick={() => onChange(p)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${p === page ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            {p}
          </button>
        ))}
        <button onClick={() => onChange(page + 1)} disabled={page >= totalPages} className="btn-ghost btn-sm disabled:opacity-30">
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    </div>
  )
}
