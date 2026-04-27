import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'SaaS App - Manage Your Projects Effortlessly',
  description: 'A simple SaaS app to manage projects and tasks with user authentication.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">SaaS App</h1>
            <div>
              <a href="/login" className="text-indigo-600 hover:underline mr-4">Login</a>
              <a href="/signup" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">Sign Up</a>
            </div>
          </nav>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-10">{children}</main>
        <footer className="bg-white border-t mt-20 py-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} SaaS App. All rights reserved.
        </footer>
      </body>
    </html>
  )
}