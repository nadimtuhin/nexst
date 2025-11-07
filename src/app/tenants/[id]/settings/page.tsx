'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface TenantSettings {
  theme?: string
  features?: {
    analytics?: boolean
    notifications?: boolean
    apiAccess?: boolean
  }
  limits?: {
    maxUsers?: number
    maxStorage?: number
  }
  branding?: {
    logo?: string
    primaryColor?: string
    secondaryColor?: string
  }
}

export default function TenantSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params.id as string

  const [tenant, setTenant] = useState<any>(null)
  const [settings, setSettings] = useState<TenantSettings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Load tenant and settings
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
        if (data.data.settings) {
          try {
            const parsedSettings = JSON.parse(data.data.settings)
            setSettings(parsedSettings)
          } catch (e) {
            setSettings({})
          }
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [tenantId])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch(`/api/tenants/${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: JSON.stringify(settings),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save settings')
      }

      setSuccessMessage('Settings saved successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (path: string[], value: any) => {
    setSettings((prev) => {
      const newSettings = { ...prev }
      let current: any = newSettings

      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {}
        current = current[path[i]]
      }

      current[path[path.length - 1]] = value
      return newSettings
    })
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading tenant settings...</p>
      </div>
    )
  }

  if (error && !tenant) {
    return (
      <div style={styles.error}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => router.push('/tenants')} style={styles.button}>
          Back to Tenants
        </button>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => router.push('/tenants')} style={styles.backButton}>
          ← Back
        </button>
        <h1 style={styles.title}>Settings for {tenant?.name}</h1>
        <p style={styles.subtitle}>@{tenant?.slug}</p>
      </div>

      {successMessage && <div style={styles.success}>{successMessage}</div>}
      {error && <div style={styles.errorBanner}>{error}</div>}

      {/* Theme Settings */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Theme</h2>
        <div style={styles.field}>
          <label style={styles.label}>Theme Style</label>
          <select
            value={settings.theme || 'default'}
            onChange={(e) => updateSetting(['theme'], e.target.value)}
            style={styles.select}
          >
            <option value="default">Default</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      {/* Features */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Features</h2>
        <div style={styles.checkboxGroup}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={settings.features?.analytics || false}
              onChange={(e) => updateSetting(['features', 'analytics'], e.target.checked)}
              style={styles.checkbox}
            />
            <span>Enable Analytics</span>
          </label>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={settings.features?.notifications || false}
              onChange={(e) => updateSetting(['features', 'notifications'], e.target.checked)}
              style={styles.checkbox}
            />
            <span>Enable Notifications</span>
          </label>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={settings.features?.apiAccess || false}
              onChange={(e) => updateSetting(['features', 'apiAccess'], e.target.checked)}
              style={styles.checkbox}
            />
            <span>Enable API Access</span>
          </label>
        </div>
      </div>

      {/* Limits */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Limits</h2>
        <div style={styles.field}>
          <label style={styles.label}>Max Users</label>
          <input
            type="number"
            value={settings.limits?.maxUsers || 10}
            onChange={(e) => updateSetting(['limits', 'maxUsers'], parseInt(e.target.value))}
            style={styles.input}
            min="1"
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Max Storage (GB)</label>
          <input
            type="number"
            value={settings.limits?.maxStorage || 5}
            onChange={(e) => updateSetting(['limits', 'maxStorage'], parseInt(e.target.value))}
            style={styles.input}
            min="1"
          />
        </div>
      </div>

      {/* Branding */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Branding</h2>
        <div style={styles.field}>
          <label style={styles.label}>Logo URL</label>
          <input
            type="text"
            value={settings.branding?.logo || ''}
            onChange={(e) => updateSetting(['branding', 'logo'], e.target.value)}
            placeholder="https://example.com/logo.png"
            style={styles.input}
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Primary Color</label>
          <input
            type="color"
            value={settings.branding?.primaryColor || '#0070f3'}
            onChange={(e) => updateSetting(['branding', 'primaryColor'], e.target.value)}
            style={styles.colorInput}
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Secondary Color</label>
          <input
            type="color"
            value={settings.branding?.secondaryColor || '#666666'}
            onChange={(e) => updateSetting(['branding', 'secondaryColor'], e.target.value)}
            style={styles.colorInput}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <button onClick={() => router.push('/tenants')} style={styles.cancelButton}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} style={styles.saveButton}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '800px',
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
  success: {
    padding: '1rem',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  errorBanner: {
    padding: '1rem',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  section: {
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '1rem',
  },
  field: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 600,
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  select: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  colorInput: {
    width: '100px',
    height: '40px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
    marginTop: '2rem',
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
  cancelButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  saveButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#0070f3',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
}
