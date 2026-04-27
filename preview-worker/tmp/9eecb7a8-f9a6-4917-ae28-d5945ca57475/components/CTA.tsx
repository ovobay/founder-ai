export default function CTA() {
  return (
    <section className="bg-indigo-600 py-16 mt-20 rounded-lg text-center max-w-4xl mx-auto">
      <h3 className="text-3xl font-bold text-white mb-4">Ready to boost your productivity?</h3>
      <p className="text-indigo-200 mb-8">
        Sign up now and get a 14-day free trial with full access to all features.
      </p>
      <a
        href="/signup"
        className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-md font-semibold hover:bg-gray-100 transition"
      >
        Start Your Free Trial
      </a>
    </section>
  )
}