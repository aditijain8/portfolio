import { About } from '../components/home/About'
import { ContactSection } from '../components/home/ContactSection'
import { Experience } from '../components/home/Experience'
import { FeaturedProjects } from '../components/home/FeaturedProjects'
import { Hero } from '../components/home/Hero'
import { ResumeCta } from '../components/home/ResumeCta'
import { Skills } from '../components/home/Skills'
import { useProfile } from '../components/layout/ProfileContext'
import { usePageMeta } from '../hooks/usePageMeta'

export default function HomePage() {
  const { profile } = useProfile()
  usePageMeta(
    'Aditi Jain',
    profile.intro ?? 'Software engineer focused on full-stack development, backend engineering and AI-powered applications.',
  )
  return (
    <>
      <Hero />
      <About />
      <Skills />
      <Experience />
      <FeaturedProjects />
      <ResumeCta />
      <ContactSection />
    </>
  )
}
