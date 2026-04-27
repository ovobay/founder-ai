import { ReactNode } from 'react'

export const features: {
  title: string
  description: string
  icon: ReactNode
}[] = [
  {
    title: 'Automation Builder',
    description:
      'Create custom workflows with drag-and-drop automation to eliminate repetitive tasks and save time.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6a2 2 0 012-2h6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l7 7-7 7" />
      </svg>
    ),
  },
  {
    title: 'Team Collaboration',
    description:
      'Share workflows, assign tasks, and communicate with your team in real-time within the platform.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20H4v-2a4 4 0 013-3.87" />
        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth={2} />
      </svg>
    ),
  },
  {
    title: 'Analytics & Reporting',
    description:
      'Gain insights into your team’s productivity and workflow efficiency with detailed reports.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 17h2v-6h-2v6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 17h2v-4H7v4zM15 17h2v-8h-2v8z" />
      </svg>
    ),
  },
]

export const pricingPlans = [
  {
    name: 'Starter',
    price: '$19/mo',
    description: 'Perfect for small teams getting started.',
    features: [
      'Up to 5 users',
      'Basic automation workflows',
      'Email support',
      'Access to templates',
    ],
  },
  {
    name: 'Pro',
    price: '$49/mo',
    description: 'For growing teams needing advanced features.',
    features: [
      'Up to 25 users',
      'Advanced automation builder',
      'Priority email support',
      'Custom integrations',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Contact us',
    description: 'Tailored solutions for large organizations.',
    features: [
      'Unlimited users',
      'Dedicated account manager',
      'Custom SLAs',
      'On-premise deployment options',
    ],
  },
]