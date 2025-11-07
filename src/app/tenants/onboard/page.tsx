'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface OnboardingData {
  // Step 1: Basic Info
  name: string
  slug: string
  domain: string

  // Step 2: Features
  features: {
    analytics: boolean
    notifications: boolean
    apiAccess: boolean
  }

  // Step 3: Admin User
  adminEmail: string
  adminName: string

  // Step 4: Settings
  theme: string
  maxUsers: number
}

export default function TenantOnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [data, setData] = useState<OnboardingData>({
    name: '',
    slug: '',
    domain: '',
    features: {
      analytics: false,
      notifications: false,
      apiAccess: false,
    },
    adminEmail: '',
    adminName: '',
    theme: 'default',
    maxUsers: 10,
  })

  const totalSteps = 4

  const updateData = (field: string, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const updateFeature = (feature: string, value: boolean) => {
    setData((prev) => ({
      ...prev,
      features: { ...prev.features, [feature]: value },
    }))
  }

  const generateSlug = () => {
    if (data.name) {
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      updateData('slug', slug)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      // Step 1: Create tenant
      const tenantResponse = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          slug: data.slug,
          domain: data.domain || undefined,
          status: 'ACTIVE',
          settings: JSON.stringify({
            theme: data.theme,
            features: data.features,
            limits: {
              maxUsers: data.maxUsers,
            },
          }),
        }),
      })

      if (!tenantResponse.ok) {
        const errorData = await tenantResponse.json()
        throw new Error(errorData.message || 'Failed to create tenant')
      }

      const { data: tenant } = await tenantResponse.json()

      // Success!
      alert(`Tenant "${data.name}" created successfully!`)
      router.push('/tenants')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.name && data.slug
      case 2:
        return true
      case 3:
        return data.adminEmail && data.adminName
      case 4:
        return true
      default:
        return false
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Tenant Onboarding</h1>
          <p style={styles.subtitle}>Set up your new tenant in {totalSteps} easy steps</p>
        </div>

        {/* Progress Bar */}
        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${(currentStep / totalSteps) * 100}%`,
              }}
            />
          </div>
          <div style={styles.stepIndicator}>
            Step {currentStep} of {totalSteps}
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* Step Content */}
        <div style={styles.content}>
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div style={styles.step}>
              <h2 style={styles.stepTitle}>Basic Information</h2>
              <p style={styles.stepDescription}>
                Let's start with the basics. What's your organization called?
              </p>

              <div style={styles.field}>
                <label style={styles.label}>Organization Name *</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => updateData('name', e.target.value)}
                  onBlur={generateSlug}
                  placeholder="Acme Corporation"
                  style={styles.input}
                  autoFocus
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>URL Slug *</label>
                <input
                  type="text"
                  value={data.slug}
                  onChange={(e) => updateData('slug', e.target.value)}
                  placeholder="acme-corporation"
                  style={styles.input}
                />
                <small style={styles.hint}>This will be used in URLs: /{data.slug || 'your-slug'}</small>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Custom Domain (Optional)</label>
                <input
                  type="text"
                  value={data.domain}
                  onChange={(e) => updateData('domain', e.target.value)}
                  placeholder="acme.example.com"
                  style={styles.input}
                />
              </div>
            </div>
          )}

          {/* Step 2: Features */}
          {currentStep === 2 && (
            <div style={styles.step}>
              <h2 style={styles.stepTitle}>Feature Selection</h2>
              <p style={styles.stepDescription}>Choose which features to enable for this tenant.</p>

              <div style={styles.featureList}>
                <label style={styles.featureCard}>
                  <input
                    type="checkbox"
                    checked={data.features.analytics}
                    onChange={(e) => updateFeature('analytics', e.target.checked)}
                    style={styles.checkbox}
                  />
                  <div>
                    <div style={styles.featureTitle}>📊 Analytics</div>
                    <div style={styles.featureDescription}>
                      Track user behavior and generate insights
                    </div>
                  </div>
                </label>

                <label style={styles.featureCard}>
                  <input
                    type="checkbox"
                    checked={data.features.notifications}
                    onChange={(e) => updateFeature('notifications', e.target.checked)}
                    style={styles.checkbox}
                  />
                  <div>
                    <div style={styles.featureTitle}>🔔 Notifications</div>
                    <div style={styles.featureDescription}>
                      Send email and in-app notifications
                    </div>
                  </div>
                </label>

                <label style={styles.featureCard}>
                  <input
                    type="checkbox"
                    checked={data.features.apiAccess}
                    onChange={(e) => updateFeature('apiAccess', e.target.checked)}
                    style={styles.checkbox}
                  />
                  <div>
                    <div style={styles.featureTitle}>🔌 API Access</div>
                    <div style={styles.featureDescription}>
                      Enable programmatic access via REST API
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Admin User */}
          {currentStep === 3 && (
            <div style={styles.step}>
              <h2 style={styles.stepTitle}>Admin User</h2>
              <p style={styles.stepDescription}>
                Who will be the primary administrator for this tenant?
              </p>

              <div style={styles.field}>
                <label style={styles.label}>Admin Name *</label>
                <input
                  type="text"
                  value={data.adminName}
                  onChange={(e) => updateData('adminName', e.target.value)}
                  placeholder="John Doe"
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Admin Email *</label>
                <input
                  type="email"
                  value={data.adminEmail}
                  onChange={(e) => updateData('adminEmail', e.target.value)}
                  placeholder="john@acme.com"
                  style={styles.input}
                />
              </div>

              <div style={styles.infoBox}>
                <strong>Note:</strong> An invitation email will be sent to this address.
              </div>
            </div>
          )}

          {/* Step 4: Settings */}
          {currentStep === 4 && (
            <div style={styles.step}>
              <h2 style={styles.stepTitle}>Final Configuration</h2>
              <p style={styles.stepDescription}>Configure initial settings for your tenant.</p>

              <div style={styles.field}>
                <label style={styles.label}>Theme</label>
                <select
                  value={data.theme}
                  onChange={(e) => updateData('theme', e.target.value)}
                  style={styles.select}
                >
                  <option value="default">Default</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Max Users</label>
                <input
                  type="number"
                  value={data.maxUsers}
                  onChange={(e) => updateData('maxUsers', parseInt(e.target.value) || 10)}
                  min="1"
                  style={styles.input}
                />
              </div>

              <div style={styles.summaryBox}>
                <h3 style={styles.summaryTitle}>Summary</h3>
                <div style={styles.summaryItem}>
                  <strong>Organization:</strong> {data.name}
                </div>
                <div style={styles.summaryItem}>
                  <strong>Slug:</strong> {data.slug}
                </div>
                <div style={styles.summaryItem}>
                  <strong>Admin:</strong> {data.adminName} ({data.adminEmail})
                </div>
                <div style={styles.summaryItem}>
                  <strong>Features:</strong>{' '}
                  {Object.entries(data.features)
                    .filter(([, enabled]) => enabled)
                    .map(([key]) => key)
                    .join(', ') || 'None selected'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={styles.navigation}>
          <button onClick={() => router.push('/tenants')} style={styles.cancelButton}>
            Cancel
          </button>
          <div style={styles.navButtons}>
            {currentStep > 1 && (
              <button onClick={prevStep} style={styles.prevButton}>
                ← Previous
              </button>
            )}
            <button
              onClick={nextStep}
              disabled={!canProceed() || loading}
              style={{
                ...styles.nextButton,
                ...(!canProceed() && styles.disabledButton),
              }}
            >
              {loading ? 'Creating...' : currentStep === totalSteps ? 'Create Tenant' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '2rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    maxWidth: '600px',
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    padding: '2rem',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
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
  progressContainer: {
    marginBottom: '2rem',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0070f3',
    transition: 'width 0.3s ease',
  },
  stepIndicator: {
    textAlign: 'center',
    marginTop: '0.5rem',
    fontSize: '14px',
    color: '#666',
  },
  error: {
    padding: '1rem',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  content: {
    minHeight: '300px',
    marginBottom: '2rem',
  },
  step: {},
  stepTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  },
  stepDescription: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '1.5rem',
  },
  field: {
    marginBottom: '1.5rem',
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
  hint: {
    display: 'block',
    marginTop: '0.25rem',
    fontSize: '12px',
    color: '#999',
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  featureCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    padding: '1rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    marginTop: '2px',
    cursor: 'pointer',
  },
  featureTitle: {
    fontWeight: 600,
    marginBottom: '0.25rem',
  },
  featureDescription: {
    fontSize: '14px',
    color: '#666',
  },
  infoBox: {
    padding: '1rem',
    backgroundColor: '#e7f3ff',
    borderLeft: '4px solid #0070f3',
    borderRadius: '4px',
    fontSize: '14px',
  },
  summaryBox: {
    padding: '1.5rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  summaryTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '1rem',
  },
  summaryItem: {
    marginBottom: '0.5rem',
    fontSize: '14px',
  },
  navigation: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButtons: {
    display: 'flex',
    gap: '1rem',
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
  prevButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  nextButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#0070f3',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
}
