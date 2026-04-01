import Navigation from '@/components/Navigation'

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50">
        {children}
      </main>
    </>
  )
}