const collections = [
  {
    name: "Student laptops",
    description: "Portable, reliable machines for study, projects, and everyday work.",
  },
  {
    name: "Business laptops",
    description: "Professional devices for small teams, remote workers, and growing companies.",
  },
  {
    name: "Apple essentials",
    description: "Premium Apple-focused picks for customers who want polish and performance.",
  },
  {
    name: "Accessories",
    description: "Keyboards, mice, docks, bags, chargers, and productivity add-ons.",
  },
];

export default function CollectionGrid() {
  return (
    <section className="mt-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        Store collections
      </p>

      <h2 className="mt-2 text-3xl font-bold text-gray-950">
        Collections built around how customers actually shop
      </h2>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {collections.map((collection) => (
          <article key={collection.name} className="rounded-3xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
            <div className="flex h-28 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-gray-400">
              Collection image
            </div>

            <h3 className="mt-5 text-lg font-bold text-gray-950">
              {collection.name}
            </h3>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              {collection.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}