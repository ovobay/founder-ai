import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'CloudFlow - Streamline Your Workflow SaaS',
  description: 'CloudFlow helps teams automate and optimize their workflows with ease. Try it free today.',
  viewport: 'width=device-width, initial-scale=1',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-white text-gray-900 antialiased font-sans">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="#" className="text-2xl font-bold text-indigo-600">
              CloudFlow
            </a>
            <div className="space-x-6 hidden md:flex">
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
            <div>
              <a
                href="#signup"
                className="inline-block px-5 py-2 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
              >
                Get Started
              </a>
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="bg-gray-50 border-t border-gray-200 mt-20 py-10">
          <div className="max-w-7xl mx-auto px-6 text-center text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} CloudFlow, Inc. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  )
}