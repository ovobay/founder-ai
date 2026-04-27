const features = [
  {
    title: "Build faster",
    description: "Turn a rough idea into a clear product foundation with structure, pages, and execution direction.",
  },
  {
    title: "Launch with intent",
    description: "Create a practical first version that can be extended with auth, payments, database, and deployment.",
  },
  {
    title: "Grow from day one",
    description: "Shape the product around acquisition, conversion, retention, and real customer needs.",
  },
];

export default function FeatureGrid() {
  return (
    <section id="features" className="mt-10 grid gap-4 md:grid-cols-3">
      {features.map((feature) => (
        <article key={feature.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-950">{feature.title}</h2>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            {feature.description}
          </p>
        </article>
      ))}
    </section>
  );
}