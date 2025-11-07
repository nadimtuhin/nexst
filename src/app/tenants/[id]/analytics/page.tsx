'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function TenantAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params.id as string

  const [tenant, setTenant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) return

    setLoading(true)
    fetch(`/api/tenants/${tenantId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load tenant')
        return res.json()
      })
      .then((data) => {
        setTenant(data.data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [tenantId])

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading analytics...</p>
      </div>
    )
  }

  if (error || !tenant) {
    return (
      <div style={styles.error}>
        <h2>Error</h2>
        <p>{error || 'Tenant not found'}</p>
        <button onClick={() => router.push('/tenants')} style={styles.button}>
          Back to Tenants
        </button>
      </div>
    )
  }

  const userCount = tenant._count?.users || 0
  const mockData = {
    activeUsers: Math.floor(userCount * 0.7),
    totalSessions: Math.floor(userCount * 15),
    avgSessionTime: '12m 34s',
    apiCalls: Math.floor(userCount * 150),
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => router.push('/tenants')} style={styles.backButton}>
          ← Back
        </button>
        <h1 style={styles.title}>Analytics for {tenant.name}</h1>
        <p style={styles.subtitle}>@{tenant.slug}</p>
      </div>

      {/* Key Metrics */}
      <div style={styles.metrics}>
        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>👥</div>
          <div style={styles.metricValue}>{userCount}</div>
          <div style={styles.metricLabel}>Total Users</div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>✨</div>
          <div style={styles.metricValue}>{mockData.activeUsers}</div>
          <div style={styles.metricLabel}>Active Users</div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>📊</div>
          <div style={styles.metricValue}>{mockData.totalSessions}</div>
          <div style={styles.metricLabel}>Sessions</div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>⏱️</div>
          <div style={styles.metricValue}>{mockData.avgSessionTime}</div>
          <div style={styles.metricLabel}>Avg Session</div>
        </div>
      </div>

      {/* Chart Area */}
      <div style={styles.chartSection}>
        <h2 style={styles.sectionTitle}>Activity Overview</h2>
        <div style={styles.chartPlaceholder}>
          <p>📈 Chart visualization would go here</p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Integrate with a charting library like Chart.js or Recharts
          </p>
        </div>
      </div>

      {/* API Usage */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>API Usage</h2>
        <div style={styles.usageGrid}>
          <div style={styles.usageItem}>
            <div style={styles.usageLabel}>Total API Calls</div>
            <div style={styles.usageValue}>{mockData.apiCalls.toLocaleString()}</div>
          </div>
          <div style={styles.usageItem}>
            <div style={styles.usageLabel}>Success Rate</div>
            <div style={styles.usageValue}>98.5%</div>
          </div>
          <div style={styles.usageItem}>
            <div style={styles.usageLabel}>Avg Response Time</div>
            <div style={styles.usageValue}>145ms</div>
          </div>
          <div style={styles.usageItem}>
            <div style={styles.usageLabel}>Error Rate</div>
            <div style={styles.usageValue}>1.5%</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Activity</h2>
        <div style={styles.activityList}>
          <div style={styles.activityItem}>
            <div style={styles.activityIcon}>👤</div>
            <div>
              <div style={styles.activityTitle}>New user registered</div>
              <div style={styles.activityTime}>2 hours ago</div>
            </div>
          </div>
          <div style={styles.activityItem}>
            <div style={styles.activityIcon}>⚙️</div>
            <div>
              <div style={styles.activityTitle}>Settings updated</div>
              <div style={styles.activityTime}>5 hours ago</div>
            </div>
          </div>
          <div style={styles.activityItem}>
            <div style={styles.activityIcon}>🔐</div>
            <div>
              <div style={styles.activityTitle}>Security policy changed</div>
              <div style={styles.activityTime}>1 day ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '1rem',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e0e0e0',
    borderTop: '4px solid #0070f3',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  error: {
    padding: '2rem',
    textAlign: 'center',
  },
  header: {
    marginBottom: '2rem',
  },
  backButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
  },
  metrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  metricCard: {
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '1.5rem',
    textAlign: 'center',
  },
  metricIcon: {
    fontSize: '32px',
    marginBottom: '0.5rem',
  },
  metricValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '0.5rem',
  },
  metricLabel: {
    fontSize: '14px',
    color: '#666',
  },
  chartSection: {
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '1rem',
  },
  chartPlaceholder: {
    height: '300px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  section: {
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '2rem',
  },
  usageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
  },
  usageItem: {
    padding: '1rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    textAlign: 'center',
  },
  usageLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '0.5rem',
  },
  usageValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
  },
  activityIcon: {
    fontSize: '24px',
  },
  activityTitle: {
    fontWeight: 600,
    marginBottom: '0.25rem',
  },
  activityTime: {
    fontSize: '12px',
    color: '#666',
  },
  button: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#0070f3',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
}
