const benefits = [
  {
    title: "Clear buying guidance",
    description: "Help customers choose based on student use, business needs, budget, and performance.",
  },
  {
    title: "Bundle-led selling",
    description: "Increase average order value by pairing laptops with docks, mice, keyboards, bags, and support.",
  },
  {
    title: "Trust before checkout",
    description: "Show warranty, delivery, support, returns, and payment reassurance before customers hesitate.",
  },
];

export default function StoreBenefits() {
  return (
    <section className="mt-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        Conversion strategy
      </p>

      <h2 className="mt-2 text-3xl font-bold text-gray-950">
        Why this store structure can sell better
      </h2>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {benefits.map((benefit) => (
          <article key={benefit.title} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-950">{benefit.title}</h3>
            <p className="mt-3 text-sm leading-6 text-gray-600">{benefit.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}