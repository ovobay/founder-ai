export default function Hero() {
  return (
    <section className="bg-indigo-600 text-white py-24 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="max-w-xl">
          <h1 className="text-5xl font-extrabold leading-tight mb-6">
            Automate Your Workflow, Empower Your Team
          </h1>
          <p className="text-lg mb-8">
            SaaSify is the all-in-one platform that helps teams automate repetitive tasks,
            collaborate seamlessly, and boost productivity.
          </p>
          <a
            href="#signup"
            className="inline-block bg-white text-indigo-600 font-semibold px-8 py-4 rounded-md shadow-md hover:bg-gray-100 transition"
          >
            Start Your Free Trial
          </a>
        </div>
        <div className="w-full max-w-lg">
          <img
            src="/workflow-illustration.svg"
            alt="Workflow illustration"
            className="w-full h-auto"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  )
}