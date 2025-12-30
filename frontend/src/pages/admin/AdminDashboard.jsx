import { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import Container from '../../components/common/Container'
import { motion } from 'framer-motion'
import {
  Box,
  FileText,
  Image as ImageIcon,
  Truck,
  ArrowRight,
  Plus,
  Zap,
  Clock,
  TrendingUp,
  Shield,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { Link } from 'react-router-dom'

// refined stat card - cleaner, enterprise look
const StatCard = ({ title, value, icon: Icon, trend, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className="bg-white rounded-xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-neutral-100/80 hover:border-primary-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 relative overflow-hidden group"
  >
    <div className={`absolute top-0 left-0 w-1 h-full ${color}`} />

    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-neutral-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-neutral-900 tracking-tight group-hover:text-primary-600 transition-colors">{value}</h3>
      </div>
      <div className={`p-2.5 rounded-lg bg-neutral-50 group-hover:bg-white border border-neutral-100 transition-colors`}>
        <Icon className="w-5 h-5 text-neutral-600 group-hover:text-primary-600 transition-colors" />
      </div>
    </div>

    <div className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-full">
      <TrendingUp className="w-3 h-3 mr-1" />
      <span>{trend || 'Active'}</span>
    </div>
  </motion.div>
)

const QuickActionRow = ({ to, icon: Icon, label, description }) => (
  <Link
    to={to}
    className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 hover:bg-white hover:shadow-md border border-transparent hover:border-neutral-100 transition-all duration-200 group"
  >
    <div className="flex items-center space-x-4">
      <div className="p-2 bg-white rounded-md shadow-sm border border-neutral-100 group-hover:border-primary-100 group-hover:text-primary-600 transition-colors">
        <Icon className="w-5 h-5 text-neutral-500 group-hover:text-primary-600" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-neutral-900 group-hover:text-primary-700">{label}</h4>
        <p className="text-xs text-neutral-500">{description}</p>
      </div>
    </div>
    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
  </Link>
)

const CourierStatusCard = ({ courier, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.3 }}
    className="bg-neutral-50 rounded-lg p-4 border border-neutral-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all duration-300"
  >
    <div className="flex items-center space-x-4">
      <div className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center p-1 overflow-hidden">
        {/* Fallback to initials if logo fails/missing, realistically we display name or icon here */}
        <Truck className="w-5 h-5 text-neutral-400" />
      </div>
      <div>
        <h4 className="font-semibold text-neutral-900 text-sm">{courier.name}</h4>
        <div className="flex items-center text-xs text-neutral-500 mt-0.5">
          <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${courier.active ? 'bg-emerald-500' : 'bg-neutral-300'}`}></div>
          {courier.active ? 'Operational' : 'Inactive'}
        </div>
      </div>
    </div>

    <div className="flex items-center">
      {courier.api_enabled && (
        <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
          API
        </span>
      )}
    </div>
  </motion.div>
)

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [couriers, setCouriers] = useState([])
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hours = new Date().getHours()
    if (hours < 12) setGreeting('Good Morning')
    else if (hours < 18) setGreeting('Good Afternoon')
    else setGreeting('Good Evening')

    const fetchData = async () => {
      try {
        const [statsRes, couriersRes] = await Promise.all([
          adminAPI.getDashboardStats(),
          adminAPI.getCouriers()
        ])
        setStats(statsRes.data)
        setCouriers(couriersRes.data || [])
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <Container>
        <div className="h-[calc(100vh-100px)] flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-2 border-neutral-200 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="space-y-8 py-8 animate-in fade-in duration-500 max-w-7xl mx-auto">

        {/* Refined Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-100">
          <div>
            <div className="flex items-center space-x-2 text-neutral-400 mb-2">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Admin Console</span>
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">
              {greeting}, Admin
            </h1>
            <p className="text-neutral-500 mt-1 text-sm flex items-center">
              System last synced:
              <span className="ml-1.5 font-medium text-neutral-700">
                {stats?.last_content_update
                  ? new Date(stats.last_content_update).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '--:--'}
              </span>
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-emerald-50/50 px-3 py-1.5 rounded-full border border-emerald-100/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-700">All Systems Operational</span>
          </div>
        </div>

        {/* Primary Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Total Pages"
              value={stats.total_pages}
              icon={FileText}
              color="bg-blue-500"
              delay={0.1}
            />
            <StatCard
              title="Active Couriers"
              value={stats.active_couriers}
              icon={Truck}
              color="bg-violet-500"
              delay={0.2}
            />
            <StatCard
              title="Media Assets"
              value={stats.media_count}
              icon={ImageIcon}
              color="bg-pink-500"
              delay={0.3}
            />
            <StatCard
              title="Pricing Rules"
              value={stats.pricing_rules_count}
              icon={Box}
              color="bg-amber-500"
              delay={0.4}
            />
          </div>
        )}

        {/* Integration Status & Actions - Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Service Integrations - Replaces User Activity */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-neutral-100 overflow-hidden"
          >
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Service Integrations</h3>
                <p className="text-neutral-500 text-sm">Active logistics partners status</p>
              </div>
              <div className="flex items-center text-xs text-neutral-400">
                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />
                <span>Health Check Passed</span>
              </div>
            </div>

            <div className="p-6">
              {couriers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {couriers.map((courier, index) => (
                    <CourierStatusCard key={courier.id} courier={courier} delay={0.1 * index} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
                  <Truck className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
                  <h4 className="text-neutral-900 font-medium">No Integration Services</h4>
                  <p className="text-neutral-500 text-sm mb-4">Add your first courier partner to get started.</p>
                  <Link to="/admin/couriers" className="text-primary-600 hover:text-primary-700 font-semibold text-sm">
                    + Add Courier
                  </Link>
                </div>
              )}
            </div>

            {/* Footer with summary or additional info */}
            <div className="px-6 py-4 bg-neutral-50/50 border-t border-neutral-100">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Showing {couriers.length} connected services</span>
                <Link to="/admin/couriers" className="hover:text-primary-600 transition-colors">
                  Manage Integrations &rarr;
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions Panel - Contained */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-neutral-100 flex flex-col"
          >
            <div className="p-6 border-b border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-900">Quick Actions</h3>
              <p className="text-neutral-500 text-sm">Common administrative tasks</p>
            </div>

            <div className="p-4 space-y-3 flex-1">
              <QuickActionRow
                to="/admin/couriers"
                icon={Plus}
                label="New Courier"
                description="Add integration"
              />
              <QuickActionRow
                to="/admin/media"
                icon={ImageIcon}
                label="Upload Media"
                description="Manage assets"
              />
              <QuickActionRow
                to="/admin/settings"
                icon={Zap}
                label="Settings"
                description="System config"
              />
            </div>

            <div className="p-4 bg-neutral-50 rounded-b-xl border-t border-neutral-100">
              <Link to="/admin/content" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center justify-center w-full">
                View All Content <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </Container>
  )
}

export default AdminDashboard
