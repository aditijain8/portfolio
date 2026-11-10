import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import { ContactForm } from '../components/home/ContactForm'
import { Navbar } from '../components/layout/Navbar'
import { ProfileProvider } from '../components/layout/ProfileContext'
import { ProjectFilters } from '../components/projects/ProjectFilters'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import ResumePage from '../pages/ResumePage'

const api = vi.hoisted(() => ({
  profile: vi.fn(),
  contactStatus: vi.fn(),
  sendContact: vi.fn(),
  resume: vi.fn(),
}))
vi.mock('../api/endpoints', () => ({ publicApi: api, adminApi: {} }))

beforeEach(() => {
  vi.clearAllMocks()
  api.profile.mockResolvedValue({ fullName: 'Aditi Jain', headline: 'Engineer', interests: [], highlights: [] })
  api.contactStatus.mockResolvedValue({ enabled: true })
})

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^name/i), 'Ann')
  await user.type(screen.getByLabelText(/^email/i), 'ann@example.com')
  await user.type(screen.getByLabelText(/^subject/i), 'Hello')
  await user.type(screen.getByLabelText(/^message/i), 'This is a long enough message.')
}

describe('ContactForm', () => {
  it('shows accessible validation errors and does not call the API', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)
    await user.click(await screen.findByRole('button', { name: /send message/i }))
    expect(await screen.findByText('Please enter your name.')).toBeInTheDocument()
    expect(screen.getByLabelText(/^email/i)).toHaveAttribute('aria-invalid', 'true')
    expect(api.sendContact).not.toHaveBeenCalled()
  })

  it('reports success only after the backend accepts the message', async () => {
    const user = userEvent.setup()
    api.sendContact.mockResolvedValue({ status: 'received' })
    render(<ContactForm />)
    await screen.findByRole('button', { name: /send message/i })
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: /send message/i }))
    expect(await screen.findByText(/message received/i)).toBeInTheDocument()
    expect(api.sendContact).toHaveBeenCalledOnce()
  })

  it('never claims success when the backend rejects the message', async () => {
    const user = userEvent.setup()
    api.sendContact.mockRejectedValue(new ApiError(429, 'You have sent several messages recently.'))
    render(<ContactForm />)
    await screen.findByRole('button', { name: /send message/i })
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: /send message/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('several messages')
    expect(screen.queryByText(/message received/i)).not.toBeInTheDocument()
  })

  it('explains when the contact form is disabled', async () => {
    api.contactStatus.mockResolvedValue({ enabled: false })
    render(<ContactForm />)
    expect(await screen.findByText(/not available right now/i)).toBeInTheDocument()
  })
})

describe('ProjectFilters', () => {
  const options = { technologies: ['Java', 'React'], categories: ['AI'] }

  it('toggles technology filters', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ProjectFilters options={options} value={{ q: '', technology: '', category: '' }} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Java' }))
    expect(onChange).toHaveBeenCalledWith({ q: '', technology: 'Java', category: '' })
  })

  it('debounces search input', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ProjectFilters options={options} value={{ q: '', technology: '', category: '' }} onChange={onChange} />)
    await user.type(screen.getByRole('searchbox'), 'chat')
    expect(onChange).not.toHaveBeenCalled()
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ q: 'chat', technology: '', category: '' }), { timeout: 1500 })
  })
})

describe('Navbar', () => {
  it('opens and closes the mobile menu with correct aria state', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ProfileProvider>
          <Navbar />
        </ProfileProvider>
      </MemoryRouter>,
    )
    const toggle = screen.getByRole('button', { name: /open menu/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)
    expect(screen.getByRole('button', { name: /close menu/i })).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('ConfirmDialog', () => {
  it('calls confirm and cancel handlers', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <ConfirmDialog open title="Delete?" confirmLabel="Yes, delete" onConfirm={onConfirm} onCancel={onCancel}>
        Sure?
      </ConfirmDialog>,
    )
    await user.click(screen.getByText('Yes, delete', { selector: 'button' }))
    await user.click(screen.getByText('Cancel', { selector: 'button' }))
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onCancel).toHaveBeenCalledOnce()
  })
})

describe('ResumePage', () => {
  it('shows an empty state when nothing is published', async () => {
    api.resume.mockResolvedValue(null)
    render(
      <MemoryRouter>
        <ResumePage />
      </MemoryRouter>,
    )
    expect(await screen.findByText(/no resume published yet/i)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /download pdf/i })).not.toBeInTheDocument()
  })

  it('offers view and download for the published resume', async () => {
    api.resume.mockResolvedValue({
      versionNumber: 2,
      publishedAt: '2026-01-01T00:00:00Z',
      sizeBytes: 2048,
      downloadUrl: '/api/public/resume/file?download=true',
      viewUrl: '/api/public/resume/file',
    })
    render(
      <MemoryRouter>
        <ResumePage />
      </MemoryRouter>,
    )
    const download = await screen.findByRole('link', { name: /download pdf/i })
    expect(download).toHaveAttribute('href', '/api/public/resume/file?download=true')
    expect(screen.getByTitle(/resume pdf viewer/i)).toBeInTheDocument()
  })
})
