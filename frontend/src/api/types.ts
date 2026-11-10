export type ProjectStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED'

export interface PageResponse<T> {
  items: T[]
  page: number
  size: number
  totalItems: number
  totalPages: number
}

export interface ProjectSummary {
  id: number
  title: string
  slug: string
  summary: string | null
  coverImageUrl: string | null
  category: string | null
  startYear: number | null
  status: ProjectStatus
  featured: boolean
  published: boolean
  displayOrder: number
  technologies: string[]
}

export interface ProjectDetail extends Omit<ProjectSummary, 'coverImageUrl'> {
  description: string | null
  problemStatement: string | null
  architecture: string | null
  contributions: string | null
  challenges: string | null
  lessonsLearned: string | null
  githubUrl: string | null
  demoUrl: string | null
  coverImageId: string | null
  coverImageUrl: string | null
  galleryImageIds: string[]
  galleryImageUrls: string[]
  keyFeatures: string[]
  createdAt: string
  updatedAt: string
}

export type ProjectInput = Omit<
  ProjectDetail,
  'id' | 'createdAt' | 'updatedAt' | 'coverImageUrl' | 'galleryImageUrls'
>

export interface ProjectFilters {
  technologies: string[]
  categories: string[]
}

export interface Profile {
  fullName: string
  headline: string | null
  intro: string | null
  about: string | null
  interests: string[]
  highlights: string[]
  location: string | null
  contactEmail: string | null
  githubUrl: string | null
  linkedinUrl: string | null
  siteUrl: string | null
  contactBlurb: string | null
}

export interface Experience {
  id: number
  role: string
  employer: string
  location: string | null
  startDate: string | null
  endDate: string | null
  description: string | null
  displayOrder: number
  visible: boolean
  achievements: string[]
  technologies: string[]
}

export type ExperienceInput = Omit<Experience, 'id' | 'displayOrder'> & { displayOrder?: number }

export interface SkillCategory {
  name: string
  skills: string[]
}

export interface PublicResume {
  versionNumber: number
  publishedAt: string
  sizeBytes: number
  downloadUrl: string
  viewUrl: string
}

export interface ResumeVersion {
  id: number
  versionNumber: number
  label: string | null
  originalFilename: string | null
  sizeBytes: number
  uploadedAt: string
  publishedAt: string | null
  published: boolean
}

export interface DashboardData {
  totalProjects: number
  publishedProjects: number
  draftProjects: number
  featuredProjects: number
  unreadMessages: number
  currentResume: ResumeVersion | null
}

export interface ContactMessage {
  id: number
  name: string
  email: string
  subject: string
  message: string
  createdAt: string
  read: boolean
}

export interface ContactInput {
  name: string
  email: string
  subject: string
  message: string
  website?: string
}
