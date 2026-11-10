import { describe, expect, it } from 'vitest'
import { validateContact } from '../components/home/ContactForm'
import { formatBytes, safeUrl, slugify } from '../lib/format'

describe('safeUrl', () => {
  it('allows http and https only', () => {
    expect(safeUrl('https://github.com/aditi')).toBe('https://github.com/aditi')
    expect(safeUrl('http://example.com')).toContain('http://example.com')
    expect(safeUrl('javascript:alert(1)')).toBeNull()
    expect(safeUrl('data:text/html,<script>')).toBeNull()
    expect(safeUrl('not a url')).toBeNull()
    expect(safeUrl(null)).toBeNull()
  })
})

describe('helpers', () => {
  it('slugifies titles', () => expect(slugify('MeetAssist — Real-Time AI!')).toBe('meetassist-real-time-ai'))
  it('formats bytes', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB')
  })
})

describe('validateContact', () => {
  const ok = { name: 'Ann', email: 'ann@example.com', subject: 'Hi', message: 'A long enough message.' }
  it('accepts valid input', () => expect(validateContact(ok)).toEqual({}))
  it('flags every invalid field', () => {
    const errors = validateContact({ name: '', email: 'nope', subject: '', message: 'short' })
    expect(Object.keys(errors).sort()).toEqual(['email', 'message', 'name', 'subject'])
  })
})
