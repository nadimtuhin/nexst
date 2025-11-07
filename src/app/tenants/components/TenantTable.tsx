import type { Tenant } from '../api/tenant-client'

interface TenantTableProps {
  tenants: Tenant[]
  onEdit: (tenant: Tenant) => void
  onDelete: (id: number) => void
  onStatusChange: (id: number, action: 'suspend' | 'activate' | 'deactivate') => void
}

export function TenantTable({ tenants, onEdit, onDelete, onStatusChange }: TenantTableProps) {
  const getStatusBadge = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      ACTIVE: {
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.875rem',
        backgroundColor: '#d4edda',
        color: '#155724',
        fontWeight: '500',
      },
      INACTIVE: {
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.875rem',
        backgroundColor: '#fff3cd',
        color: '#856404',
        fontWeight: '500',
      },
      SUSPENDED: {
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.875rem',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        fontWeight: '500',
      },
    }

    return <span style={styles[status] || styles.INACTIVE}>{status}</span>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th style={headerStyle}>Name</th>
            <th style={headerStyle}>Slug</th>
            <th style={headerStyle}>Domain</th>
            <th style={headerStyle}>Status</th>
            <th style={headerStyle}>Users</th>
            <th style={headerStyle}>Created</th>
            <th style={headerStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => (
            <tr
              key={tenant.id}
              style={{
                borderBottom: '1px solid #ddd',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
              }}
            >
              <td style={cellStyle}>
                <div>
                  <div style={{ fontWeight: '500' }}>{tenant.name}</div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>ID: {tenant.id}</div>
                </div>
              </td>
              <td style={cellStyle}>
                <code
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#f4f4f4',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                  }}
                >
                  {tenant.slug}
                </code>
              </td>
              <td style={cellStyle}>
                {tenant.domain ? (
                  <a
                    href={`http://${tenant.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#0070f3', textDecoration: 'none' }}
                  >
                    {tenant.domain}
                  </a>
                ) : (
                  <span style={{ color: '#999' }}>-</span>
                )}
              </td>
              <td style={cellStyle}>{getStatusBadge(tenant.status)}</td>
              <td style={cellStyle}>
                <span style={{ fontWeight: '500' }}>{tenant._count?.users || 0}</span>
              </td>
              <td style={cellStyle}>
                <span style={{ fontSize: '0.875rem', color: '#666' }}>
                  {formatDate(tenant.createdAt)}
                </span>
              </td>
              <td style={cellStyle}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => onEdit(tenant)}
                    style={{
                      ...actionButtonStyle,
                      backgroundColor: '#0070f3',
                      color: 'white',
                    }}
                    title="Edit tenant"
                  >
                    ✏️ Edit
                  </button>

                  {tenant.status === 'ACTIVE' && (
                    <>
                      <button
                        onClick={() => onStatusChange(tenant.id, 'suspend')}
                        style={{
                          ...actionButtonStyle,
                          backgroundColor: '#ffc107',
                          color: '#000',
                        }}
                        title="Suspend tenant"
                      >
                        ⏸️ Suspend
                      </button>
                      <button
                        onClick={() => onStatusChange(tenant.id, 'deactivate')}
                        style={{
                          ...actionButtonStyle,
                          backgroundColor: '#6c757d',
                          color: 'white',
                        }}
                        title="Deactivate tenant"
                      >
                        ⏯️ Deactivate
                      </button>
                    </>
                  )}

                  {tenant.status === 'SUSPENDED' && (
                    <button
                      onClick={() => onStatusChange(tenant.id, 'activate')}
                      style={{
                        ...actionButtonStyle,
                        backgroundColor: '#28a745',
                        color: 'white',
                      }}
                      title="Activate tenant"
                    >
                      ▶️ Activate
                    </button>
                  )}

                  {tenant.status === 'INACTIVE' && (
                    <button
                      onClick={() => onStatusChange(tenant.id, 'activate')}
                      style={{
                        ...actionButtonStyle,
                        backgroundColor: '#28a745',
                        color: 'white',
                      }}
                      title="Activate tenant"
                    >
                      ▶️ Activate
                    </button>
                  )}

                  <button
                    onClick={() => onDelete(tenant.id)}
                    style={{
                      ...actionButtonStyle,
                      backgroundColor: '#dc3545',
                      color: 'white',
                    }}
                    title="Delete tenant"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {tenants.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          No tenants to display
        </div>
      )}
    </div>
  )
}

const headerStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontWeight: '600',
  fontSize: '0.875rem',
  color: '#333',
  borderBottom: '2px solid #ddd',
}

const cellStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
}

const actionButtonStyle: React.CSSProperties = {
  padding: '0.25rem 0.75rem',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.813rem',
  fontWeight: '500',
  transition: 'opacity 0.2s',
}
