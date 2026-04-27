const checklist = [
  "Add Shopify products, variants, inventory, and collections",
  "Create product pages with specs, benefits, warranty, and delivery details",
  "Configure checkout, taxes, shipping zones, and payment providers",
  "Add abandoned-cart email or WhatsApp recovery workflow",
  "Install analytics, reviews, SEO metadata, and conversion tracking",
  "Prepare launch campaign for students, parents, and small businesses",
];

export default function LaunchChecklist() {
  return (
    <section id="launch" className="mt-12 rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        Launch checklist
      </p>

      <h2 className="mt-2 text-3xl font-bold text-gray-950">
        What needs to happen before this becomes a real Shopify store
      </h2>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {checklist.map((item) => (
          <div key={item} className="rounded-2xl bg-gray-50 p-4 text-sm leading-6 text-gray-700">
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}