// Builds a migrated SQLite template DB once, before any test file runs.
// Each test file copies this template to its own isolated DB (see jest.setup.js),
// so suites can never interfere with each other through a shared database file.
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

module.exports = async () => {
  const template = path.join(__dirname, 'prisma', 'test-template.db')
  if (fs.existsSync(template)) fs.unlinkSync(template)

  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    cwd: __dirname,
    env: { ...process.env, DATABASE_URL: `file:${template}` },
    stdio: 'ignore',
  })

  process.env.__TEST_DB_TEMPLATE = template
}
