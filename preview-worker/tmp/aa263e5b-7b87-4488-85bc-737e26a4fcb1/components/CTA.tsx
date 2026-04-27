export default function CTA() {
  return (
    <section id="cta" className="mt-10 rounded-3xl bg-black p-8 text-white">
      <h2 className="text-3xl font-bold">Ready to build?</h2>

      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-300">
        This generated starter gives you a visible working foundation. Extend it
        with auth, payments, database tables, marketing workflows, and deployment.
      </p>

      <a
        href="#features"
        className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-medium text-black"
      >
        Start building
      </a>
    </section>
  );
}