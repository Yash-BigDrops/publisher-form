import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Track Your Creative Submission',
  description: 'Track the status of your creative submission through our review process.',
}

export default function TrackingLayout({
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

