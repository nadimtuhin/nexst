import {
  delay,
  formatDate,
  parseIntOr,
  omit,
  pick,
  randomString,
  isValidEmail,
  slugify,
  capitalize,
  truncate,
} from '../utils'

describe('Utils', () => {
  describe('delay', () => {
    it('should delay execution', async () => {
      const start = Date.now()
      await delay(100)
      const end = Date.now()
      const elapsed = end - start

      expect(elapsed).toBeGreaterThanOrEqual(95)
      expect(elapsed).toBeLessThan(200)
    })

    it('should delay for 0 milliseconds', async () => {
      const start = Date.now()
      await delay(0)
      const end = Date.now()
      const elapsed = end - start

      expect(elapsed).toBeLessThan(50)
    })

    it('should return a promise', () => {
      const result = delay(10)
      expect(result).toBeInstanceOf(Promise)
    })

    it('should resolve without value', async () => {
      const result = await delay(10)
      expect(result).toBeUndefined()
    })
  })

  describe('formatDate', () => {
    it('should format date to ISO string', () => {
      const date = new Date('2023-01-15T10:30:00.000Z')
      const result = formatDate(date)

      expect(result).toBe('2023-01-15T10:30:00.000Z')
    })

    it('should format current date', () => {
      const date = new Date()
      const result = formatDate(date)

      expect(result).toBe(date.toISOString())
    })

    it('should handle different dates', () => {
      const date1 = new Date('2020-06-01T00:00:00.000Z')
      const date2 = new Date('2025-12-31T23:59:59.999Z')

      expect(formatDate(date1)).toBe('2020-06-01T00:00:00.000Z')
      expect(formatDate(date2)).toBe('2025-12-31T23:59:59.999Z')
    })

    it('should include milliseconds', () => {
      const date = new Date('2023-01-01T12:00:00.123Z')
      const result = formatDate(date)

      expect(result).toContain('.123Z')
    })
  })

  describe('parseIntOr', () => {
    it('should parse valid integer string', () => {
      expect(parseIntOr('123', 0)).toBe(123)
      expect(parseIntOr('456', 10)).toBe(456)
    })

    it('should return default value for undefined', () => {
      expect(parseIntOr(undefined, 10)).toBe(10)
      expect(parseIntOr(undefined, 0)).toBe(0)
    })

    it('should return default value for empty string', () => {
      expect(parseIntOr('', 10)).toBe(10)
    })

    it('should return default value for invalid string', () => {
      expect(parseIntOr('abc', 10)).toBe(10)
      expect(parseIntOr('not a number', 20)).toBe(20)
    })

    it('should parse negative numbers', () => {
      expect(parseIntOr('-123', 0)).toBe(-123)
      expect(parseIntOr('-456', 10)).toBe(-456)
    })

    it('should parse zero', () => {
      expect(parseIntOr('0', 10)).toBe(0)
    })

    it('should ignore decimal parts', () => {
      expect(parseIntOr('123.456', 0)).toBe(123)
      expect(parseIntOr('99.99', 0)).toBe(99)
    })

    it('should handle whitespace', () => {
      expect(parseIntOr('  123  ', 0)).toBe(123)
    })

    it('should return default for partial numbers', () => {
      expect(parseIntOr('123abc', 0)).toBe(123)
    })

    it('should use different default values', () => {
      expect(parseIntOr('invalid', 100)).toBe(100)
      expect(parseIntOr('invalid', -50)).toBe(-50)
      expect(parseIntOr('invalid', 0)).toBe(0)
    })
  })

  describe('omit', () => {
    it('should omit single key from object', () => {
      const obj = { a: 1, b: 2, c: 3 }
      const result = omit(obj, ['b'])

      expect(result).toEqual({ a: 1, c: 3 })
      expect(result).not.toHaveProperty('b')
    })

    it('should omit multiple keys from object', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 }
      const result = omit(obj, ['b', 'd'])

      expect(result).toEqual({ a: 1, c: 3 })
    })

    it('should return all keys when omitting empty array', () => {
      const obj = { a: 1, b: 2 }
      const result = omit(obj, [])

      expect(result).toEqual(obj)
    })

    it('should not modify original object', () => {
      const obj = { a: 1, b: 2, c: 3 }
      const result = omit(obj, ['b'])

      expect(obj).toEqual({ a: 1, b: 2, c: 3 })
      expect(result).toEqual({ a: 1, c: 3 })
    })

    it('should handle omitting non-existent keys', () => {
      const obj = { a: 1, b: 2 }
      const result = omit(obj, ['c' as any])

      expect(result).toEqual({ a: 1, b: 2 })
    })

    it('should handle objects with different value types', () => {
      const obj = { name: 'John', age: 30, active: true, data: null }
      const result = omit(obj, ['age', 'data'])

      expect(result).toEqual({ name: 'John', active: true })
    })
  })

  describe('pick', () => {
    it('should pick single key from object', () => {
      const obj = { a: 1, b: 2, c: 3 }
      const result = pick(obj, ['a'])

      expect(result).toEqual({ a: 1 })
    })

    it('should pick multiple keys from object', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 }
      const result = pick(obj, ['a', 'c'])

      expect(result).toEqual({ a: 1, c: 3 })
    })

    it('should return empty object when picking empty array', () => {
      const obj = { a: 1, b: 2 }
      const result = pick(obj, [])

      expect(result).toEqual({})
    })

    it('should not modify original object', () => {
      const obj = { a: 1, b: 2, c: 3 }
      const result = pick(obj, ['a'])

      expect(obj).toEqual({ a: 1, b: 2, c: 3 })
      expect(result).toEqual({ a: 1 })
    })

    it('should handle objects with different value types', () => {
      const obj = { name: 'John', age: 30, active: true, data: null }
      const result = pick(obj, ['name', 'active'])

      expect(result).toEqual({ name: 'John', active: true })
    })

    it('should pick all keys', () => {
      const obj = { a: 1, b: 2 }
      const result = pick(obj, ['a', 'b'])

      expect(result).toEqual(obj)
    })
  })

  describe('randomString', () => {
    it('should generate string with default length of 16', () => {
      const result = randomString()

      expect(result).toHaveLength(16)
    })

    it('should generate string with specified length', () => {
      expect(randomString(10)).toHaveLength(10)
      expect(randomString(32)).toHaveLength(32)
      expect(randomString(5)).toHaveLength(5)
    })

    it('should generate string with length 0', () => {
      const result = randomString(0)

      expect(result).toBe('')
    })

    it('should generate different strings each time', () => {
      const str1 = randomString(20)
      const str2 = randomString(20)
      const str3 = randomString(20)

      expect(str1).not.toBe(str2)
      expect(str2).not.toBe(str3)
      expect(str1).not.toBe(str3)
    })

    it('should only contain alphanumeric characters', () => {
      const result = randomString(100)

      expect(result).toMatch(/^[A-Za-z0-9]+$/)
    })

    it('should generate long strings', () => {
      const result = randomString(1000)

      expect(result).toHaveLength(1000)
      expect(result).toMatch(/^[A-Za-z0-9]+$/)
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@example.com')).toBe(true)
      expect(isValidEmail('user+tag@example.co.uk')).toBe(true)
      expect(isValidEmail('user_name@example.com')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('invalid@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('invalid@example')).toBe(false)
      expect(isValidEmail('invalid.com')).toBe(false)
    })

    it('should reject emails with spaces', () => {
      expect(isValidEmail('test @example.com')).toBe(false)
      expect(isValidEmail('test@ example.com')).toBe(false)
      expect(isValidEmail('test @example .com')).toBe(false)
    })

    it('should reject empty string', () => {
      expect(isValidEmail('')).toBe(false)
    })

    it('should reject emails without domain extension', () => {
      expect(isValidEmail('test@example')).toBe(false)
    })

    it('should validate emails with numbers', () => {
      expect(isValidEmail('user123@example.com')).toBe(true)
      expect(isValidEmail('123@example.com')).toBe(true)
    })

    it('should validate emails with hyphens', () => {
      expect(isValidEmail('user-name@example.com')).toBe(true)
      expect(isValidEmail('user@my-domain.com')).toBe(true)
    })
  })

  describe('slugify', () => {
    it('should convert text to lowercase slug', () => {
      expect(slugify('Hello World')).toBe('hello-world')
    })

    it('should replace spaces with hyphens', () => {
      expect(slugify('Multiple   Spaces   Here')).toBe('multiple-spaces-here')
    })

    it('should remove special characters', () => {
      expect(slugify('Hello! World?')).toBe('hello-world')
      expect(slugify('Test@#$%^&*()')).toBe('test')
    })

    it('should handle underscores', () => {
      expect(slugify('hello_world')).toBe('hello-world')
    })

    it('should remove leading and trailing hyphens', () => {
      expect(slugify('-hello-world-')).toBe('hello-world')
      expect(slugify('---test---')).toBe('test')
    })

    it('should handle already slugified text', () => {
      expect(slugify('already-a-slug')).toBe('already-a-slug')
    })

    it('should handle empty string', () => {
      expect(slugify('')).toBe('')
    })

    it('should handle text with numbers', () => {
      expect(slugify('Chapter 123')).toBe('chapter-123')
    })

    it('should collapse multiple hyphens', () => {
      expect(slugify('hello---world')).toBe('hello-world')
    })

    it('should handle mixed case', () => {
      expect(slugify('HeLLo WoRLd')).toBe('hello-world')
    })

    it('should handle complex strings', () => {
      expect(slugify('The Quick Brown Fox & The Lazy Dog!')).toBe('the-quick-brown-fox-the-lazy-dog')
    })
  })

  describe('capitalize', () => {
    it('should capitalize first letter of lowercase text', () => {
      expect(capitalize('hello')).toBe('Hello')
    })

    it('should keep rest of text unchanged', () => {
      expect(capitalize('hello world')).toBe('Hello world')
      expect(capitalize('hELLO')).toBe('HELLO')
    })

    it('should handle already capitalized text', () => {
      expect(capitalize('Hello')).toBe('Hello')
    })

    it('should handle single character', () => {
      expect(capitalize('a')).toBe('A')
      expect(capitalize('Z')).toBe('Z')
    })

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('')
    })

    it('should handle text starting with number', () => {
      expect(capitalize('123hello')).toBe('123hello')
    })

    it('should handle text starting with special character', () => {
      expect(capitalize('!hello')).toBe('!hello')
    })

    it('should handle uppercase text', () => {
      expect(capitalize('HELLO')).toBe('HELLO')
    })
  })

  describe('truncate', () => {
    it('should truncate text longer than maxLength', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...')
    })

    it('should not truncate text shorter than maxLength', () => {
      expect(truncate('Hello', 10)).toBe('Hello')
    })

    it('should not truncate text equal to maxLength', () => {
      expect(truncate('Hello', 5)).toBe('Hello')
    })

    it('should use custom suffix', () => {
      expect(truncate('Hello World', 8, '…')).toBe('Hello W…')
    })

    it('should use custom suffix with multiple characters', () => {
      expect(truncate('Hello World', 10, ' [...]')).toBe('Hell [...]')
    })

    it('should handle empty string', () => {
      expect(truncate('', 10)).toBe('')
    })

    it('should handle maxLength of 0', () => {
      expect(truncate('Hello', 0)).toBe('...')
    })

    it('should account for suffix length', () => {
      const text = 'Hello World'
      const result = truncate(text, 8)

      expect(result).toHaveLength(8)
      expect(result).toBe('Hello...')
    })

    it('should handle very long text', () => {
      const longText = 'a'.repeat(1000)
      const result = truncate(longText, 50)

      expect(result).toHaveLength(50)
      expect(result.endsWith('...')).toBe(true)
    })

    it('should handle maxLength smaller than suffix', () => {
      expect(truncate('Hello World', 2)).toBe('...')
    })

    it('should use default suffix when not provided', () => {
      const result = truncate('Hello World', 8)

      expect(result.endsWith('...')).toBe(true)
    })

    it('should handle single character text', () => {
      expect(truncate('a', 5)).toBe('a')
      expect(truncate('a', 0)).toBe('...')
    })
  })
})
