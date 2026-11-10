import { ContactForm } from '../components/home/ContactForm'
import { ContactLinks } from '../components/home/ContactSection'
import { useProfile } from '../components/layout/ProfileContext'
import { usePageMeta } from '../hooks/usePageMeta'

export default function ContactPage() {
  usePageMeta('Contact', 'Get in touch with Aditi Jain about roles, collaborations or software engineering.')
  const { profile } = useProfile()
  return (
    <div className="container-page py-16 sm:py-24">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="eyebrow mb-4">Contact</p>
          <h1 className="font-display text-5xl leading-[1.02] sm:text-7xl">Let’s talk.</h1>
          <p className="mt-6 max-w-md text-lg text-muted">
            {profile.contactBlurb ?? 'Interested in working together or just saying hello? Send a message.'}
          </p>
          <div className="mt-8">
            <ContactLinks />
          </div>
        </div>
        <ContactForm />
      </div>
    </div>
  )
}
