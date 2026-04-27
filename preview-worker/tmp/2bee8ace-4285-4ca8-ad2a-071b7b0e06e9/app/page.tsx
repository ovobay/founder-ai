import Hero from '../components/Hero'
import FeatureGrid from '../components/FeatureGrid'
import CTA from '../components/CTA'

export default function Home() {
  return (
    <>
      <Hero />
      <FeatureGrid />
      <CTA />
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-extrabold text-center text-gray-900 mb-12">Simple Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="border rounded-lg p-8 shadow-sm hover:shadow-lg transition">
            <h3 className="text-2xl font-semibold mb-4">Starter</h3>
            <p className="text-gray-600 mb-6">Perfect for individuals and small teams</p>
            <p className="text-4xl font-extrabold mb-6">$9<span className="text-lg font-normal">/mo</span></p>
            <ul className="mb-6 space-y-3 text-gray-700">
              <li>Up to 5 users</li>
              <li>Basic workflow automation</li>
              <li>Email support</li>
            </ul>
            <a
              href="#signup"
              className="block text-center px-5 py-3 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition"
            >
              Get Started
            </a>
          </div>
          <div className="border-2 border-indigo-600 rounded-lg p-8 shadow-lg">
            <h3 className="text-2xl font-semibold mb-4">Pro</h3>
            <p className="text-gray-600 mb-6">For growing teams and businesses</p>
            <p className="text-4xl font-extrabold mb-6">$29<span className="text-lg font-normal">/mo</span></p>
            <ul className="mb-6 space-y-3 text-gray-700">
              <li>Up to 25 users</li>
              <li>Advanced workflow automation</li>
              <li>Priority email & chat support</li>
              <li>Analytics dashboard</li>
            </ul>
            <a
              href="#signup"
              className="block text-center px-5 py-3 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition"
            >
              Get Started
            </a>
          </div>
          <div className="border rounded-lg p-8 shadow-sm hover:shadow-lg transition">
            <h3 className="text-2xl font-semibold mb-4">Enterprise</h3>
            <p className="text-gray-600 mb-6">Custom solutions for large organizations</p>
            <p className="text-4xl font-extrabold mb-6">Contact Us</p>
            <ul className="mb-6 space-y-3 text-gray-700">
              <li>Unlimited users</li>
              <li>Custom integrations</li>
              <li>Dedicated support</li>
              <li>Service level agreements</li>
            </ul>
            <a
              href="#contact"
              className="block text-center px-5 py-3 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>
      <section
        id="signup"
        className="max-w-3xl mx-auto px-6 py-20 bg-indigo-50 rounded-lg shadow-md mt-20 mb-20"
      >
        <h2 className="text-3xl font-extrabold text-center text-indigo-700 mb-6">
          Ready to simplify your workflow?
        </h2>
        <p className="text-center text-indigo-700 mb-8">
          Start your free 14-day trial today. No credit card required.
        </p>
        <form
          action="#"
          className="flex flex-col sm:flex-row gap-4 justify-center"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="email"
            placeholder="Enter your email"
            required
            className="px-4 py-3 rounded-md border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-grow"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition"
          >
            Start Free Trial
          </button>
        </form>
      </section>
    </>
  )
}