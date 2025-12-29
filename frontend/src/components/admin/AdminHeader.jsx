import { useAuth } from '../../context/AuthContext'

const AdminHeader = () => {
  const { user } = useAuth()

  return (
    <header className="bg-white border-b border-neutral-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Admin Panel</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-neutral-600">
            Welcome, <span className="font-medium text-neutral-900">{user?.username || 'Admin'}</span>
          </span>
        </div>
      </div>
    </header>
  )
}

export default AdminHeader

