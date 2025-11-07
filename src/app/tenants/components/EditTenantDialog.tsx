import { useState, useEffect } from 'react'
import { tenantApi, type Tenant, type UpdateTenantDto } from '../api/tenant-client'

interface EditTenantDialogProps {
  isOpen: boolean
  tenant: Tenant
  onClose: () => void
  onSuccess: () => void
}

export function EditTenantDialog({ isOpen, tenant, onClose, onSuccess }: EditTenantDialogProps) {
  const [formData, setFormData] = useState<UpdateTenantDto>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // Initialize form data when tenant changes
  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain || '',
        status: tenant.status,
        settings: tenant.settings || '',
      })
    }
  }, [tenant])

  if (!isOpen) return null

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (formData.name !== undefined) {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required'
      } else if (formData.name.length < 2) {
        newErrors.name = 'Name must be at least 2 characters'
      }
    }

    if (formData.slug !== undefined) {
      if (!formData.slug.trim()) {
        newErrors.slug = 'Slug is required'
      } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
        newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens'
      } else if (formData.slug.length < 2) {
        newErrors.slug = 'Slug must be at least 2 characters'
      }
    }

    if (formData.domain && !/^[a-z0-9.-]+$/.test(formData.domain)) {
      newErrors.domain = 'Invalid domain format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Clean up form data
      const submitData: UpdateTenantDto = {}

      if (formData.name !== undefined && formData.name.trim() !== tenant.name) {
        submitData.name = formData.name.trim()
      }

      if (formData.slug !== undefined && formData.slug.trim() !== tenant.slug) {
        submitData.slug = formData.slug.trim()
      }

      if (formData.domain !== undefined && formData.domain.trim() !== (tenant.domain || '')) {
        submitData.domain = formData.domain.trim() || undefined
      }

      if (formData.status !== undefined && formData.status !== tenant.status) {
        submitData.status = formData.status
      }

      if (formData.settings !== undefined && formData.settings.trim() !== (tenant.settings || '')) {
        const settingsValue = formData.settings.trim()
        if (settingsValue) {
          // Validate JSON
          try {
            JSON.parse(settingsValue)
            submitData.settings = settingsValue
          } catch {
            setErrors({ settings: 'Invalid JSON format' })
            setLoading(false)
            return
          }
        } else {
          submitData.settings = undefined
        }
      }

      // Only make API call if something changed
      if (Object.keys(submitData).length > 0) {
        await tenantApi.updateTenant(tenant.id, submitData)
        onSuccess()
      } else {
        onClose()
      }

      setErrors({})
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to update tenant' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '2rem',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.5rem' }}>
          Edit Tenant: {tenant.name}
        </h2>

        <div
          style={{
            padding: '0.75rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            <strong>Tenant ID:</strong> {tenant.id}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
            <strong>Created:</strong> {new Date(tenant.createdAt).toLocaleDateString()}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>
              Name <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={inputStyle}
              placeholder="Acme Corporation"
            />
            {errors.name && <div style={errorStyle}>{errors.name}</div>}
          </div>

          {/* Slug */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>
              Slug <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.slug || ''}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
              style={inputStyle}
              placeholder="acme-corporation"
            />
            <small style={{ color: '#666', fontSize: '0.875rem' }}>
              Lowercase letters, numbers, and hyphens only
            </small>
            {errors.slug && <div style={errorStyle}>{errors.slug}</div>}
          </div>

          {/* Domain */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Domain (optional)</label>
            <input
              type="text"
              value={formData.domain || ''}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value.toLowerCase() })}
              style={inputStyle}
              placeholder="acme.example.com"
            />
            <small style={{ color: '#666', fontSize: '0.875rem' }}>
              Custom domain for this tenant
            </small>
            {errors.domain && <div style={errorStyle}>{errors.domain}</div>}
          </div>

          {/* Status */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Status</label>
            <select
              value={formData.status || 'ACTIVE'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
                })
              }
              style={inputStyle}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          {/* Settings */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Settings (optional JSON)</label>
            <textarea
              value={formData.settings || ''}
              onChange={(e) => setFormData({ ...formData, settings: e.target.value })}
              style={{ ...inputStyle, minHeight: '100px', fontFamily: 'monospace' }}
              placeholder={'{"theme": "blue", "features": ["analytics"]}'}
            />
            <small style={{ color: '#666', fontSize: '0.875rem' }}>
              Custom JSON settings for the tenant
            </small>
            {errors.settings && <div style={errorStyle}>{errors.settings}</div>}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: '#fee',
                color: '#c00',
                borderRadius: '4px',
                marginBottom: '1rem',
              }}
            >
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                ...buttonStyle,
                backgroundColor: 'white',
                color: '#333',
                border: '1px solid #ddd',
              }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...buttonStyle,
                backgroundColor: '#0070f3',
                color: 'white',
              }}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.5rem',
  fontWeight: '500',
  fontSize: '0.875rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '1rem',
  boxSizing: 'border-box',
}

const buttonStyle: React.CSSProperties = {
  padding: '0.5rem 1.5rem',
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: '500',
  fontSize: '1rem',
}

const errorStyle: React.CSSProperties = {
  color: '#dc3545',
  fontSize: '0.875rem',
  marginTop: '0.25rem',
}
