export default function Hero() {
  return (
    <section className="text-center max-w-3xl mx-auto py-20">
      <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
        Manage Your Projects Effortlessly
      </h2>
      <p className="text-lg text-gray-700 mb-8">
        Our SaaS app helps teams organize, track, and deliver projects on time with ease.
      </p>
      <a
        href="/signup"
        className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-md text-lg font-semibold hover:bg-indigo-700 transition"
      >
        Get Started for Free
      </a>
    </section>
  )
}