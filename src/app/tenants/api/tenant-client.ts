/**
 * Tenant API Client
 * Handles all tenant-related API calls
 */

export interface Tenant {
  id: number
  name: string
  slug: string
  domain?: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  settings?: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    users: number
  }
}

export interface CreateTenantDto {
  name: string
  slug: string
  domain?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  settings?: string
}

export interface UpdateTenantDto {
  name?: string
  slug?: string
  domain?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  settings?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

class TenantApiClient {
  private baseUrl = '/api/tenants'

  /**
   * Get all tenants with pagination and filtering
   */
  async getTenants(params?: {
    search?: string
    status?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<Tenant>> {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search)
    if (params?.status) query.append('status', params.status)
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())

    const response = await fetch(`${this.baseUrl}?${query.toString()}`)
    if (!response.ok) {
      throw new Error('Failed to fetch tenants')
    }
    return response.json()
  }

  /**
   * Get all tenants with user counts
   */
  async getTenantsWithCounts(): Promise<Tenant[]> {
    const response = await fetch(`${this.baseUrl}/with-counts`)
    if (!response.ok) {
      throw new Error('Failed to fetch tenants with counts')
    }
    const data = await response.json()
    return data.data || data
  }

  /**
   * Get active tenants only
   */
  async getActiveTenants(): Promise<Tenant[]> {
    const response = await fetch(`${this.baseUrl}/active`)
    if (!response.ok) {
      throw new Error('Failed to fetch active tenants')
    }
    const data = await response.json()
    return data.data || data
  }

  /**
   * Get a single tenant by ID
   */
  async getTenant(id: number): Promise<Tenant> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch tenant')
    }
    const data = await response.json()
    return data.data || data
  }

  /**
   * Get tenant by slug
   */
  async getTenantBySlug(slug: string): Promise<Tenant> {
    const response = await fetch(`${this.baseUrl}/slug/${slug}`)
    if (!response.ok) {
      throw new Error('Failed to fetch tenant')
    }
    const data = await response.json()
    return data.data || data
  }

  /**
   * Create a new tenant
   */
  async createTenant(data: CreateTenantDto): Promise<Tenant> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create tenant')
    }

    const result = await response.json()
    return result.data || result
  }

  /**
   * Update an existing tenant
   */
  async updateTenant(id: number, data: UpdateTenantDto): Promise<Tenant> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update tenant')
    }

    const result = await response.json()
    return result.data || result
  }

  /**
   * Delete a tenant
   */
  async deleteTenant(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete tenant')
    }
  }

  /**
   * Suspend a tenant
   */
  async suspendTenant(id: number): Promise<Tenant> {
    const response = await fetch(`${this.baseUrl}/${id}/suspend`, {
      method: 'PUT',
    })

    if (!response.ok) {
      throw new Error('Failed to suspend tenant')
    }

    const result = await response.json()
    return result.data || result
  }

  /**
   * Activate a tenant
   */
  async activateTenant(id: number): Promise<Tenant> {
    const response = await fetch(`${this.baseUrl}/${id}/activate`, {
      method: 'PUT',
    })

    if (!response.ok) {
      throw new Error('Failed to activate tenant')
    }

    const result = await response.json()
    return result.data || result
  }

  /**
   * Deactivate a tenant
   */
  async deactivateTenant(id: number): Promise<Tenant> {
    const response = await fetch(`${this.baseUrl}/${id}/deactivate`, {
      method: 'PUT',
    })

    if (!response.ok) {
      throw new Error('Failed to deactivate tenant')
    }

    const result = await response.json()
    return result.data || result
  }

  /**
   * Get user count for a tenant
   */
  async getTenantUserCount(id: number): Promise<number> {
    const response = await fetch(`${this.baseUrl}/${id}/user-count`)
    if (!response.ok) {
      throw new Error('Failed to fetch tenant user count')
    }
    const data = await response.json()
    return data.data?.userCount || data.userCount || 0
  }
}

export const tenantApi = new TenantApiClient()
