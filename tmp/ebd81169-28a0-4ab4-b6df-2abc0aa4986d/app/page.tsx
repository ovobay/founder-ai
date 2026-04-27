import Hero from '../components/Hero'
import FeatureGrid from '../components/FeatureGrid'
import CTA from '../components/CTA'
import { pricingPlans } from '../lib/config'

export default function Home() {
  return (
    <>
      <Hero />
      <FeatureGrid />
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-12">Simple, Transparent Pricing</h2>
        <div className="grid gap-8 max-w-4xl mx-auto md:grid-cols-3">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className="border border-gray-200 rounded-xl p-8 flex flex-col shadow-sm hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold text-indigo-600">{plan.name}</h3>
              <p className="mt-4 text-4xl font-extrabold text-gray-900">{plan.price}</p>
              <p className="mt-1 text-gray-600">{plan.description}</p>
              <ul className="mt-6 space-y-3 flex-1 text-gray-700">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <svg
                      className="w-5 h-5 text-indigo-500 mr-2 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href="#signup"
                className="mt-8 inline-block text-center bg-indigo-600 text-white font-semibold rounded-md py-3 hover:bg-indigo-700 transition"
              >
                Choose {plan.name}
              </a>
            </div>
          ))}
        </div>
      </section>
      <CTA />
    </>
  )
}