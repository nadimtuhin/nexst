// Per-test-file database isolation: copy the migrated template DB (built in
// jest.global-setup.js) to a unique file and point DATABASE_URL at it BEFORE
// any PrismaClient is constructed. Without this, all suites share one SQLite
// file and interfere nondeterministically. Must run before other imports.
const fs = require('fs')
const path = require('path')

const prismaDir = path.join(process.cwd(), 'prisma')
const template = path.join(prismaDir, 'test-template.db')
const testFile = (expect.getState().testPath || 'unknown').replace(/[^a-z0-9]/gi, '_')
const workerDb = path.join(prismaDir, `test-${testFile}.db`)

fs.copyFileSync(template, workerDb)
process.env.DATABASE_URL = `file:${workerDb}`

afterAll(() => {
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    try {
      fs.unlinkSync(workerDb + suffix)
    } catch {}
  }
})

// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import 'reflect-metadata'
