const features = [
  {
    title: 'Project Management',
    description: 'Create and organize projects with tasks, deadlines, and priorities.',
  },
  {
    title: 'Team Collaboration',
    description: 'Invite team members, assign tasks, and communicate seamlessly.',
  },
  {
    title: 'Real-time Updates',
    description: 'Stay up to date with live notifications and progress tracking.',
  },
  {
    title: 'Analytics & Reports',
    description: 'Gain insights into your team’s performance and project status.',
  },
]

export default function FeatureGrid() {
  return (
    <section className="max-w-5xl mx-auto py-20">
      <h3 className="text-3xl font-bold text-center mb-12">Features</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {features.map(({ title, description }) => (
          <div key={title} className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
            <h4 className="text-xl font-semibold mb-3 text-indigo-600">{title}</h4>
            <p className="text-gray-700">{description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}