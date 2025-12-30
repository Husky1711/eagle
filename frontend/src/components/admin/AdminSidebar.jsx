import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, Image, Truck, DollarSign, Settings, LogOut, ChevronLeft, ChevronRight, X, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useEffect } from 'react'

const AdminSidebar = ({ isOpen, onClose, onToggleCollapse, collapsed }) => {
  const location = useLocation()
  const { logout } = useAuth()

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 768 && isOpen) {
      onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/content', icon: FileText, label: 'Content' },
    { path: '/admin/media', icon: Image, label: 'Media' },
    { path: '/admin/couriers', icon: Truck, label: 'Couriers' },
    { path: '/admin/pricing', icon: DollarSign, label: 'Pricing Rules' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
    { path: '/admin/profile', icon: User, label: 'Profile' },
  ]

  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50
        bg-white border-r border-neutral-200 transition-all duration-300
        w-64 ${collapsed ? 'md:w-16' : 'md:w-64'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col
        shadow-lg md:shadow-none
        h-screen
        overflow-y-auto
      `}>
        <div className={`p-4 border-b border-neutral-200 ${collapsed ? 'md:p-2 md:relative' : ''}`}>
          <div className={`flex items-center ${collapsed ? 'md:justify-center' : 'justify-between'}`}>
            <span className={`font-bold text-lg gradient-text ${collapsed ? 'md:hidden' : ''}`}>Admin</span>
            <div className={`flex items-center ${collapsed ? 'md:hidden' : 'space-x-2'}`}>
              {/* Desktop collapse button - shown when expanded */}
              {!collapsed && (
                <button
                  onClick={onToggleCollapse}
                  className="hidden md:block p-1 hover:bg-neutral-100 rounded transition-colors"
                  title="Collapse sidebar"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              {/* Mobile close button */}
              <button
                onClick={onClose}
                className="md:hidden p-1 hover:bg-neutral-100 rounded transition-colors"
                title="Close sidebar"
              >
                <X size={20} />
              </button>
            </div>
            {/* Collapse button when collapsed - centered */}
            {collapsed && (
              <button
                onClick={onToggleCollapse}
                className="hidden md:block p-1 hover:bg-neutral-100 rounded transition-colors"
                title="Expand sidebar"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>

        <nav className="flex-1 p-2 md:p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                flex items-center rounded-lg transition-colors duration-200
                ${collapsed
                    ? 'md:justify-center md:px-2 md:py-3'
                    : 'space-x-3 px-4 py-3'
                  }
                ${isActive(item.path)
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-neutral-600 hover:bg-neutral-50'
                  }
              `}
                title={collapsed ? item.label : ''}
              >
                <Icon size={20} />
                <span className={`font-medium ${collapsed ? 'md:hidden' : ''}`}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-2 md:p-4 border-t border-neutral-200">
          <button
            onClick={logout}
            className={`
            flex items-center rounded-lg text-neutral-600 hover:bg-neutral-50 w-full transition-colors
            ${collapsed
                ? 'md:justify-center md:px-2 md:py-3'
                : 'space-x-3 px-4 py-3'
              }
          `}
            title={collapsed ? 'Logout' : ''}
          >
            <LogOut size={20} />
            <span className={`font-medium ${collapsed ? 'md:hidden' : ''}`}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default AdminSidebar

