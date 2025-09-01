import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Thank You - Creative Submission',
  description: 'Thank you for submitting your creative. Your tracking information has been sent to your email.',
}

export default function ThankYouLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {children}
    </div>
  )
}
