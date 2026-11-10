import { createContext, useContext, type ReactNode } from 'react'
import { publicApi } from '../../api/endpoints'
import type { Profile } from '../../api/types'
import { useAsync } from '../../hooks/useAsync'

/** Safe defaults so the site renders even before (or without) the profile API. */
const FALLBACK: Profile = {
  fullName: 'Aditi Jain',
  headline: 'Software Engineer | Full-Stack Development | AI Engineering',
  intro: null,
  about: null,
  interests: [],
  highlights: [],
  location: null,
  contactEmail: null,
  githubUrl: null,
  linkedinUrl: null,
  siteUrl: null,
  contactBlurb: null,
}

interface ProfileState {
  profile: Profile
  loading: boolean
  error: string | null
  reload: () => void
}

const ProfileContext = createContext<ProfileState>({ profile: FALLBACK, loading: true, error: null, reload: () => {} })

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { data, loading, error, reload } = useAsync((signal) => publicApi.profile(signal), [])
  return (
    <ProfileContext.Provider value={{ profile: data ?? FALLBACK, loading, error, reload }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile(): ProfileState {
  return useContext(ProfileContext)
}
