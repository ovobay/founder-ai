const features = [
  {
    title: 'Easy Automation',
    description:
      'Create and customize workflows with a simple drag-and-drop interface, no coding required.',
    icon: (
      <svg
        className="w-10 h-10 text-indigo-600"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v8m4-4H8m8 4a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
  {
    title: 'Team Collaboration',
    description:
      'Invite your team, assign tasks, and track progress all in one place.',
    icon: (
      <svg
        className="w-10 h-10 text-indigo-600"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M12 12a4 4 0 100-8 4 4 0 000 8z"
        />
      </svg>
    ),
  },
  {
    title: 'Analytics & Reporting',
    description:
      'Gain insights with real-time analytics and customizable reports.',
    icon: (
      <svg
        className="w-10 h-10 text-indigo-600"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11 17l-5-5m0 0l5-5m-5 5h12"
        />
      </svg>
    ),
  },
]

export default function FeatureGrid() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-6 py-20">
      <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-12">
        Features that Drive Results
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
        {features.map(({ title, description, icon }) => (
          <div key={title} className="flex flex-col items-center text-center">
            <div className="mb-6">{icon}</div>
            <h3 className="text-2xl font-semibold mb-3">{title}</h3>
            <p className="text-gray-700 max-w-xs">{description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}