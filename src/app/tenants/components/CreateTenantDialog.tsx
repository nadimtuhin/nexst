import { useState } from 'react'
import { tenantApi, type CreateTenantDto } from '../api/tenant-client'

interface CreateTenantDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateTenantDialog({ isOpen, onClose, onSuccess }: CreateTenantDialogProps) {
  const [formData, setFormData] = useState<CreateTenantDto>({
    name: '',
    slug: '',
    domain: '',
    status: 'ACTIVE',
    settings: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens'
    } else if (formData.slug.length < 2) {
      newErrors.slug = 'Slug must be at least 2 characters'
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
      const submitData: CreateTenantDto = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        status: formData.status,
      }

      if (formData.domain?.trim()) {
        submitData.domain = formData.domain.trim()
      }

      if (formData.settings?.trim()) {
        // Validate JSON
        try {
          JSON.parse(formData.settings)
          submitData.settings = formData.settings.trim()
        } catch {
          setErrors({ settings: 'Invalid JSON format' })
          setLoading(false)
          return
        }
      }

      await tenantApi.createTenant(submitData)
      onSuccess()

      // Reset form
      setFormData({
        name: '',
        slug: '',
        domain: '',
        status: 'ACTIVE',
        settings: '',
      })
      setErrors({})
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to create tenant' })
    } finally {
      setLoading(false)
    }
  }

  const handleSlugGeneration = () => {
    if (formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData({ ...formData, slug })
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
          Create New Tenant
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>
              Name <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onBlur={handleSlugGeneration}
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
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
              style={inputStyle}
              placeholder="acme-corporation"
            />
            <small style={{ color: '#666', fontSize: '0.875rem' }}>
              Lowercase letters, numbers, and hyphens only. Auto-generated from name.
            </small>
            {errors.slug && <div style={errorStyle}>{errors.slug}</div>}
          </div>

          {/* Domain */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>Domain (optional)</label>
            <input
              type="text"
              value={formData.domain}
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
              value={formData.status}
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
              value={formData.settings}
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
              {loading ? 'Creating...' : 'Create Tenant'}
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
