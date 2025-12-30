import { Menu } from 'lucide-react'

const AdminHeader = ({ onMenuClick }) => {
  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
      <div className="flex items-center justify-between h-16 px-4 md:px-6 w-full">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={24} />
        </button>

        {/* Desktop Title */}
        <div className="hidden md:block">
          <h1 className="text-lg font-semibold text-neutral-900">Admin Dashboard</h1>
        </div>

        {/* Mobile Title */}
        <div className="md:hidden flex-1 text-center">
          <h1 className="text-lg font-semibold text-neutral-900">Admin</h1>
        </div>

        {/* Right side - can add user menu, notifications, etc. */}
        <div className="w-10 md:w-auto"></div>
      </div>
    </header>
  )
}

export default AdminHeader
