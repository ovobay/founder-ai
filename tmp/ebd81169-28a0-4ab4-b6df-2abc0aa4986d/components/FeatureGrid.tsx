import { features } from '../lib/config'

export default function FeatureGrid() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-6 py-20">
      <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-12">Powerful Features to Accelerate Your Work</h2>
      <div className="grid gap-12 md:grid-cols-3">
        {features.map(({ title, description, icon }) => (
          <div key={title} className="flex flex-col items-center text-center">
            <div className="bg-indigo-100 text-indigo-600 rounded-full p-5 mb-6 inline-flex">
              {icon}
            </div>
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            <p className="mt-3 text-gray-600 max-w-xs">{description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}