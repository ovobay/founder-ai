import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'SaaSify - Simplify Your Workflow',
  description: 'SaaSify helps teams automate and streamline their workflows with ease.',
  keywords: 'SaaS, workflow automation, productivity, team collaboration',
  authors: [{ name: 'SaaSify Team' }],
  openGraph: {
    title: 'SaaSify - Simplify Your Workflow',
    description: 'SaaSify helps teams automate and streamline their workflows with ease.',
    url: 'https://saasify.example.com',
    siteName: 'SaaSify',
    images: [
      {
        url: 'https://saasify.example.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SaaSify Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SaaSify - Simplify Your Workflow',
    description: 'SaaSify helps teams automate and streamline their workflows with ease.',
    creator: '@saasify',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-white text-gray-900 antialiased">
        <header className="sticky top-0 z-50 bg-white shadow-sm">
          <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="/" className="text-2xl font-bold text-indigo-600">
              SaaSify
            </a>
            <div className="space-x-8 hidden md:flex">
              <a href="#features" className="text-gray-700 hover:text-indigo-600 transition">
                Features
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-indigo-600 transition">
                Pricing
              </a>
              <a href="#contact" className="text-gray-700 hover:text-indigo-600 transition">
                Contact
              </a>
            </div>
            <a
              href="#signup"
              className="hidden md:inline-block px-5 py-2 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
            >
              Get Started
            </a>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="bg-gray-50 border-t border-gray-200 mt-20">
          <div className="max-w-7xl mx-auto px-6 py-10 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} SaaSify. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  )
}