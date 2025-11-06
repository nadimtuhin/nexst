export default function Home() {
  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🚀 Nexst - Next.js with NestJS Architecture</h1>
      <p style={{ marginTop: '1rem' }}>
        A Next.js boilerplate featuring NestJS-style architecture with:
      </p>
      <ul style={{ marginTop: '1rem', marginLeft: '2rem' }}>
        <li>✅ Dependency Injection with TSyringe</li>
        <li>✅ Decorator-based Controllers (@Controller, @Get, @Post, etc.)</li>
        <li>✅ DTO Validation with class-validator</li>
        <li>✅ Centralized Error Handling</li>
        <li>✅ Middleware & Guards</li>
        <li>✅ Full Unit Test Coverage</li>
      </ul>

      <h2 style={{ marginTop: '2rem' }}>Example API Routes:</h2>
      <ul style={{ marginTop: '1rem', marginLeft: '2rem' }}>
        <li>
          <a href="/api/users" style={{ color: '#0070f3' }}>GET /api/users</a> - Get all users
        </li>
        <li>
          <a href="/api/users/1" style={{ color: '#0070f3' }}>GET /api/users/:id</a> - Get user by ID
        </li>
        <li>
          POST /api/users - Create a new user
        </li>
        <li>
          <a href="/api/health" style={{ color: '#0070f3' }}>GET /api/health</a> - Health check
        </li>
      </ul>
    </main>
  )
}
