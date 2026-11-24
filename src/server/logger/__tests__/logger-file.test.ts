import 'reflect-metadata'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { LoggerService } from '../logger.service'
import { ConfigService } from '../../../config'

describe('LoggerService file transport', () => {
  let cwd: string
  let tmpDir: string

  beforeEach(() => {
    cwd = process.cwd()
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexst-logs-'))
    process.chdir(tmpDir)
  })

  afterEach(() => {
    // The temp dir is left in place: the rotating file streams open
    // asynchronously and would error if it were removed here.
    process.chdir(cwd)
  })

  it('can be constructed with LOG_FILE_ENABLED=true', () => {
    const config = {
      log: {
        level: 'info',
        fileEnabled: true,
        fileMaxSize: '1m',
        fileMaxFiles: '1d',
      },
    } as unknown as ConfigService

    expect(() => new LoggerService(config)).not.toThrow()
  })
})
