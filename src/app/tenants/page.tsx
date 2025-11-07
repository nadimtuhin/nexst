'use client'

import { useState, useEffect } from 'react'
import { tenantApi, type Tenant } from './api/tenant-client'
import { TenantTable } from './components/TenantTable'
import { CreateTenantDialog } from './components/CreateTenantDialog'
import { EditTenantDialog } from './components/EditTenantDialog'

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  // Fetch tenants
  const fetchTenants = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await tenantApi.getTenantsWithCounts()
      setTenants(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tenants')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTenants()
  }, [])

  // Filter tenants based on search and status
  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      searchQuery === '' ||
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.domain?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === '' || tenant.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      return
    }

    try {
      await tenantApi.deleteTenant(id)
      await fetchTenants()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete tenant')
    }
  }

  const handleStatusChange = async (id: number, action: 'suspend' | 'activate' | 'deactivate') => {
    try {
      if (action === 'suspend') {
        await tenantApi.suspendTenant(id)
      } else if (action === 'activate') {
        await tenantApi.activateTenant(id)
      } else {
        await tenantApi.deactivateTenant(id)
      }
      await fetchTenants()
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to ${action} tenant`)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Tenant Management
        </h1>
        <p style={{ color: '#666' }}>
          Manage multi-tenant organizations and their settings
        </p>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="Search tenants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            flex: '1',
            minWidth: '200px',
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>

        <button
          onClick={() => setIsCreateDialogOpen(true)}
          style={{
            padding: '0.5rem 1.5rem',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          + Create Tenant
        </button>

        <button
          onClick={fetchTenants}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: 'white',
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fee',
            color: '#c00',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          Loading tenants...
        </div>
      )}

      {/* Tenant Table */}
      {!loading && !error && (
        <TenantTable
          tenants={filteredTenants}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Empty State */}
      {!loading && !error && filteredTenants.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          {searchQuery || statusFilter ? (
            <>
              <p>No tenants found matching your filters.</p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('')
                }}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: 'white',
                }}
              >
                Clear Filters
              </button>
            </>
          ) : (
            <>
              <p>No tenants yet.</p>
              <button
                onClick={() => setIsCreateDialogOpen(true)}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1.5rem',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Create Your First Tenant
              </button>
            </>
          )}
        </div>
      )}

      {/* Create Dialog */}
      <CreateTenantDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => {
          setIsCreateDialogOpen(false)
          fetchTenants()
        }}
      />

      {/* Edit Dialog */}
      {selectedTenant && (
        <EditTenantDialog
          isOpen={isEditDialogOpen}
          tenant={selectedTenant}
          onClose={() => {
            setIsEditDialogOpen(false)
            setSelectedTenant(null)
          }}
          onSuccess={() => {
            setIsEditDialogOpen(false)
            setSelectedTenant(null)
            fetchTenants()
          }}
        />
      )}
    </div>
  )
}
