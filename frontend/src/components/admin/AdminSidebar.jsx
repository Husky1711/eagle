import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, Image, Truck, DollarSign, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'

const AdminSidebar = () => {
  const location = useLocation()
  const { logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/content', icon: FileText, label: 'Content' },
    { path: '/admin/media', icon: Image, label: 'Media' },
    { path: '/admin/couriers', icon: Truck, label: 'Couriers' },
    { path: '/admin/pricing', icon: DollarSign, label: 'Pricing Rules' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ]

  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <aside className={`
      bg-white border-r border-neutral-200 transition-all duration-300
      ${collapsed ? 'w-16' : 'w-64'}
      flex flex-col
    `}>
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          {!collapsed && <span className="font-bold text-lg gradient-text">Admin</span>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-neutral-100 rounded"
          >
            {/* Collapse icon would go here */}
          </button>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center space-x-3 px-4 py-3 rounded-lg
                transition-colors duration-200
                ${isActive(item.path)
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-neutral-600 hover:bg-neutral-50'
                }
              `}
            >
              <Icon size={20} />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>
      
      <div className="p-4 border-t border-neutral-200">
        <button
          onClick={logout}
          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-neutral-600 hover:bg-neutral-50 w-full transition-colors"
        >
          <LogOut size={20} />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  )
}

export default AdminSidebar

