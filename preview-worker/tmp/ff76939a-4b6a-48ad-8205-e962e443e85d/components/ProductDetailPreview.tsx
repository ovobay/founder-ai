const specs = [
  "Intel or Apple silicon configuration",
  "Student and business warranty options",
  "Accessory bundle recommendations",
  "Delivery and support details",
];

export default function ProductDetailPreview() {
  return (
    <section className="mt-12 grid gap-6 rounded-[2rem] border border-gray-200 bg-gray-50 p-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="flex min-h-80 items-center justify-center rounded-[1.5rem] bg-white text-sm font-semibold text-gray-400 shadow-sm">
        Product detail image gallery
      </div>

      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Product detail preview
        </p>

        <h2 className="mt-2 text-3xl font-black text-gray-950">
          MacBook student starter kit
        </h2>

        <p className="mt-3 text-2xl font-black text-gray-950">From €1,199</p>

        <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600">
          A polished product detail section should explain who the product is for,
          what is included, what problem it solves, and why buying the bundle makes sense.
        </p>

        <div className="mt-6 grid gap-3">
          {specs.map((spec) => (
            <div key={spec} className="rounded-2xl bg-white p-4 text-sm font-medium text-gray-700 shadow-sm">
              {spec}
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#cart" className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white">
            Add to cart preview
          </a>
          <a href="#launch" className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900">
            Store setup notes
          </a>
        </div>
      </div>
    </section>
  );
}