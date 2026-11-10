import { api, get, query, send } from './client'
import type {
  ContactInput,
  ContactMessage,
  DashboardData,
  Experience,
  ExperienceInput,
  PageResponse,
  Profile,
  ProjectDetail,
  ProjectFilters,
  ProjectInput,
  ProjectSummary,
  PublicResume,
  ResumeVersion,
  SkillCategory,
} from './types'

export interface ProjectQuery {
  q?: string
  technology?: string
  category?: string
  featured?: boolean
  page?: number
  size?: number
}

export const publicApi = {
  profile: (signal?: AbortSignal) => get<Profile>('/api/public/profile', signal),
  skills: (signal?: AbortSignal) => get<SkillCategory[]>('/api/public/skills', signal),
  experience: (signal?: AbortSignal) => get<Experience[]>('/api/public/experience', signal),
  projects: (params: ProjectQuery, signal?: AbortSignal) =>
    get<PageResponse<ProjectSummary>>(`/api/public/projects${query({ ...params })}`, signal),
  projectFilters: (signal?: AbortSignal) => get<ProjectFilters>('/api/public/projects/filters', signal),
  project: (slug: string, signal?: AbortSignal) =>
    get<ProjectDetail>(`/api/public/projects/${encodeURIComponent(slug)}`, signal),
  /** Resolves to null when no resume is published (HTTP 204). */
  resume: async (signal?: AbortSignal) => (await get<PublicResume | undefined>('/api/public/resume', signal)) ?? null,
  contactStatus: (signal?: AbortSignal) => get<{ enabled: boolean }>('/api/public/contact/status', signal),
  sendContact: (input: ContactInput) => send<{ status: string }>('POST', '/api/public/contact', input),
}

export const adminApi = {
  login: (email: string, password: string) =>
    send<{ email: string }>('POST', '/api/admin/auth/login', { email, password }),
  logout: () => send<void>('POST', '/api/admin/auth/logout'),
  me: (signal?: AbortSignal) => get<{ email: string }>('/api/admin/auth/me', signal),
  changePassword: (currentPassword: string, newPassword: string) =>
    send<void>('POST', '/api/admin/auth/change-password', { currentPassword, newPassword }),
  dashboard: (signal?: AbortSignal) => get<DashboardData>('/api/admin/dashboard', signal),

  projects: (params: { q?: string; published?: boolean }, signal?: AbortSignal) =>
    get<PageResponse<ProjectSummary>>(`/api/admin/projects${query({ ...params, size: 50 })}`, signal),
  project: (id: number, signal?: AbortSignal) => get<ProjectDetail>(`/api/admin/projects/${id}`, signal),
  createProject: (input: ProjectInput) => send<ProjectDetail>('POST', '/api/admin/projects', input),
  updateProject: (id: number, input: ProjectInput) => send<ProjectDetail>('PUT', `/api/admin/projects/${id}`, input),
  deleteProject: (id: number) => send<void>('DELETE', `/api/admin/projects/${id}`),
  setPublished: (id: number, published: boolean) =>
    send<ProjectDetail>('PATCH', `/api/admin/projects/${id}/published`, { published }),
  setFeatured: (id: number, featured: boolean) =>
    send<ProjectDetail>('PATCH', `/api/admin/projects/${id}/featured`, { featured }),
  reorderProjects: (projectIds: number[]) => send<void>('PUT', '/api/admin/projects/order', { projectIds }),
  uploadImage: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api<{ id: string; url: string }>('/api/admin/media', { method: 'POST', form })
  },

  resumes: (signal?: AbortSignal) => get<ResumeVersion[]>('/api/admin/resumes', signal),
  uploadResume: (file: File, label: string) => {
    const form = new FormData()
    form.append('file', file)
    if (label) form.append('label', label)
    return api<ResumeVersion>('/api/admin/resumes', { method: 'POST', form })
  },
  publishResume: (id: number) => send<ResumeVersion>('POST', `/api/admin/resumes/${id}/publish`),
  unpublishResume: (id: number) => send<ResumeVersion>('POST', `/api/admin/resumes/${id}/unpublish`),
  deleteResume: (id: number) => send<void>('DELETE', `/api/admin/resumes/${id}`),
  resumeFileUrl: (id: number) => `/api/admin/resumes/${id}/file`,

  experience: (signal?: AbortSignal) => get<Experience[]>('/api/admin/experience', signal),
  createExperience: (input: ExperienceInput) => send<Experience>('POST', '/api/admin/experience', input),
  updateExperience: (id: number, input: ExperienceInput) =>
    send<Experience>('PUT', `/api/admin/experience/${id}`, input),
  deleteExperience: (id: number) => send<void>('DELETE', `/api/admin/experience/${id}`),

  skills: (signal?: AbortSignal) => get<SkillCategory[]>('/api/admin/skills', signal),
  saveSkills: (categories: SkillCategory[]) => send<SkillCategory[]>('PUT', '/api/admin/skills', categories),

  profile: (signal?: AbortSignal) => get<Profile>('/api/admin/profile', signal),
  saveProfile: (profile: Profile) => send<Profile>('PUT', '/api/admin/profile', profile),

  messages: (signal?: AbortSignal) => get<PageResponse<ContactMessage>>('/api/admin/messages?size=50', signal),
  markMessage: (id: number, read: boolean) =>
    send<ContactMessage>('PATCH', `/api/admin/messages/${id}/read?read=${read}`),
  deleteMessage: (id: number) => send<void>('DELETE', `/api/admin/messages/${id}`),
}
