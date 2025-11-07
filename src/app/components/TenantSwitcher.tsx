'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useTenant } from '../contexts/TenantContext'

/**
 * TenantSwitcher - Dropdown component for switching between tenants
 *
 * Features:
 * - Shows current tenant
 * - Lists all available tenants for the user
 * - Allows switching tenants with a dropdown
 * - Automatically fetches user's tenants
 * - Stores selection in localStorage
 *
 * Usage:
 * ```tsx
 * <TenantSwitcher userId={123} />
 * ```
 */
export function TenantSwitcher({ userId }: { userId?: number }) {
  const { currentTenant, setCurrentTenant, userTenants, setUserTenants, isLoading } = useTenant()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch user's tenants on mount
  useEffect(() => {
    if (!userId) return

    setLoading(true)
    fetch(`/api/rbac/users/${userId}/tenants`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch tenants')
        return res.json()
      })
      .then((data) => {
        if (data.data) {
          setUserTenants(data.data)
          // If no current tenant is set, set the first one
          if (!currentTenant && data.data.length > 0) {
            setCurrentTenant(data.data[0])
          }
        }
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [userId])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  const handleTenantSwitch = (tenant: any) => {
    setCurrentTenant(tenant)
    setIsOpen(false)
    // Reload the page to apply new tenant context
    window.location.reload()
  }

  if (isLoading || loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <span>Loading tenants...</span>
      </div>
    )
  }

  if (error) {
    return <div style={styles.error}>Error: {error}</div>
  }

  if (!userTenants || userTenants.length === 0) {
    return <div style={styles.noTenants}>No tenants available</div>
  }

  return (
    <div style={styles.container} ref={dropdownRef}>
      <button style={styles.trigger} onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
        <div style={styles.triggerContent}>
          <span style={styles.tenantIcon}>🏢</span>
          <div style={styles.tenantInfo}>
            <div style={styles.tenantName}>{currentTenant?.name || 'Select Tenant'}</div>
            {currentTenant && <div style={styles.tenantSlug}>@{currentTenant.slug}</div>}
          </div>
          <span style={{ ...styles.arrow, ...(isOpen && styles.arrowOpen) }}>▼</span>
        </div>
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>Switch Tenant</div>
          <div style={styles.tenantList}>
            {userTenants.map((tenant) => (
              <button
                key={tenant.id}
                style={{
                  ...styles.tenantItem,
                  ...(currentTenant?.id === tenant.id && styles.tenantItemActive),
                }}
                onClick={() => handleTenantSwitch(tenant)}
              >
                <div style={styles.tenantItemContent}>
                  <span style={styles.tenantIcon}>🏢</span>
                  <div>
                    <div style={styles.tenantItemName}>{tenant.name}</div>
                    <div style={styles.tenantItemSlug}>@{tenant.slug}</div>
                  </div>
                </div>
                {currentTenant?.id === tenant.id && <span style={styles.checkmark}>✓</span>}
              </button>
            ))}
          </div>
          <div style={styles.dropdownFooter}>
            <div style={styles.footerText}>
              {userTenants.length} tenant{userTenants.length !== 1 ? 's' : ''} available
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    display: 'inline-block',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    fontSize: '14px',
    color: '#666',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid #e0e0e0',
    borderTop: '2px solid #0070f3',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  error: {
    padding: '0.5rem 1rem',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '4px',
    fontSize: '14px',
  },
  noTenants: {
    padding: '0.5rem 1rem',
    fontSize: '14px',
    color: '#666',
  },
  trigger: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    minWidth: '220px',
    transition: 'all 0.2s',
  },
  triggerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    width: '100%',
  },
  tenantIcon: {
    fontSize: '20px',
  },
  tenantInfo: {
    flex: 1,
    textAlign: 'left' as const,
  },
  tenantName: {
    fontWeight: 600,
    color: '#333',
    marginBottom: '2px',
  },
  tenantSlug: {
    fontSize: '12px',
    color: '#666',
  },
  arrow: {
    fontSize: '10px',
    color: '#666',
    transition: 'transform 0.2s',
  },
  arrowOpen: {
    transform: 'rotate(180deg)',
  },
  dropdown: {
    position: 'absolute' as const,
    top: 'calc(100% + 8px)',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 1000,
    minWidth: '280px',
    maxHeight: '400px',
    overflow: 'hidden',
  },
  dropdownHeader: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #eee',
    fontWeight: 600,
    fontSize: '13px',
    color: '#666',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  tenantList: {
    maxHeight: '300px',
    overflowY: 'auto' as const,
  },
  tenantItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: '#fff',
    border: 'none',
    borderBottom: '1px solid #f5f5f5',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'background-color 0.2s',
  },
  tenantItemActive: {
    backgroundColor: '#f0f7ff',
  },
  tenantItemContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  tenantItemName: {
    fontWeight: 600,
    color: '#333',
    marginBottom: '2px',
  },
  tenantItemSlug: {
    fontSize: '12px',
    color: '#666',
  },
  checkmark: {
    fontSize: '16px',
    color: '#0070f3',
    fontWeight: 'bold',
  },
  dropdownFooter: {
    padding: '0.5rem 1rem',
    borderTop: '1px solid #eee',
    backgroundColor: '#f9f9f9',
  },
  footerText: {
    fontSize: '12px',
    color: '#666',
    textAlign: 'center' as const,
  },
}
