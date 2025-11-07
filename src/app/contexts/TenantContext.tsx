'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Tenant {
  id: number
  name: string
  slug: string
  domain?: string | null
  status: string
}

interface TenantContextType {
  currentTenant: Tenant | null
  setCurrentTenant: (tenant: Tenant | null) => void
  userTenants: Tenant[]
  setUserTenants: (tenants: Tenant[]) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

/**
 * TenantProvider - Manages current tenant state across the application
 *
 * Usage:
 * ```tsx
 * <TenantProvider>
 *   <App />
 * </TenantProvider>
 * ```
 */
export function TenantProvider({ children }: { children: ReactNode }) {
  const [currentTenant, setCurrentTenantState] = useState<Tenant | null>(null)
  const [userTenants, setUserTenants] = useState<Tenant[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load current tenant from localStorage on mount
  useEffect(() => {
    const storedTenantId = localStorage.getItem('currentTenantId')
    if (storedTenantId) {
      // Fetch tenant details
      fetch(`/api/tenants/${storedTenantId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setCurrentTenantState(data.data)
          }
        })
        .catch(() => {
          localStorage.removeItem('currentTenantId')
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  const setCurrentTenant = (tenant: Tenant | null) => {
    setCurrentTenantState(tenant)
    if (tenant) {
      localStorage.setItem('currentTenantId', tenant.id.toString())
      localStorage.setItem('currentTenantSlug', tenant.slug)
    } else {
      localStorage.removeItem('currentTenantId')
      localStorage.removeItem('currentTenantSlug')
    }
  }

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        setCurrentTenant,
        userTenants,
        setUserTenants,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </TenantContext.Provider>
  )
}

/**
 * Hook to access tenant context
 *
 * Usage:
 * ```tsx
 * const { currentTenant, setCurrentTenant } = useTenant()
 * ```
 */
export function useTenant() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}

/**
 * Get current tenant ID for API requests
 */
export function getCurrentTenantId(): number | null {
  if (typeof window === 'undefined') return null
  const id = localStorage.getItem('currentTenantId')
  return id ? parseInt(id) : null
}

/**
 * Get current tenant slug for API requests
 */
export function getCurrentTenantSlug(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('currentTenantSlug')
}
