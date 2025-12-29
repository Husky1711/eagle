import { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import Card from '../../components/common/Card'
import Container from '../../components/common/Container'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminAPI.getDashboardStats()
        setStats(response.data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <Container>
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="py-8">
        <h1 className="text-h1 mb-8">Dashboard</h1>
        
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <h3 className="text-sm font-medium text-neutral-600 mb-2">Total Pages</h3>
              <p className="text-3xl font-bold text-neutral-900">{stats.total_pages}</p>
            </Card>
            
            <Card>
              <h3 className="text-sm font-medium text-neutral-600 mb-2">Active Couriers</h3>
              <p className="text-3xl font-bold text-neutral-900">{stats.active_couriers}</p>
            </Card>
            
            <Card>
              <h3 className="text-sm font-medium text-neutral-600 mb-2">Media Files</h3>
              <p className="text-3xl font-bold text-neutral-900">{stats.media_count}</p>
            </Card>
            
            <Card>
              <h3 className="text-sm font-medium text-neutral-600 mb-2">Pricing Rules</h3>
              <p className="text-3xl font-bold text-neutral-900">{stats.pricing_rules_count}</p>
            </Card>
          </div>
        )}
      </div>
    </Container>
  )
}

export default AdminDashboard

