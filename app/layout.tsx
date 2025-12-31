import type { Metadata } from 'next'
import { Space_Mono, Bricolage_Grotesque } from 'next/font/google'
import './globals.css'

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono',
})

const bricolageGrotesque = Bricolage_Grotesque({
  weight: ['400', '600', '800'],
  subsets: ['latin'],
  variable: '--font-bricolage',
})

export const metadata: Metadata = {
  title: 'Brain Dump - Clear Your Mind, Own Your Time',
  description: 'AI-powered task management that helps you prioritize what matters',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${spaceMono.variable} ${bricolageGrotesque.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
