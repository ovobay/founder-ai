const products = [
  {
    name: "Lenovo ThinkPad business bundle",
    price: "From €899",
    badge: "Best for work",
    description: "A durable business-ready laptop bundle with dock, keyboard, mouse, and setup guidance.",
  },
  {
    name: "MacBook student starter kit",
    price: "From €1,199",
    badge: "Student pick",
    description: "A premium Apple starter bundle for students who need performance, battery life, and resale value.",
  },
  {
    name: "Everyday Windows laptop",
    price: "From €549",
    badge: "Best value",
    description: "A practical laptop for browsing, coursework, admin work, streaming, and everyday productivity.",
  },
];

export default function ProductGrid() {
  return (
    <section id="products" className="mt-12 rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Featured products
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-950">
            Product cards designed to convert
          </h2>
        </div>

        <a href="#cart" className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900">
          Build checkout flow
        </a>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {products.map((product) => (
          <article key={product.name} className="rounded-3xl border border-gray-200 bg-gray-50 p-6">
            <div className="flex h-44 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-gray-400">
              Product image area
            </div>

            <div className="mt-5 inline-flex rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
              {product.badge}
            </div>

            <h3 className="mt-4 text-xl font-bold text-gray-950">
              {product.name}
            </h3>

            <p className="mt-2 text-lg font-black text-gray-950">
              {product.price}
            </p>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              {product.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}