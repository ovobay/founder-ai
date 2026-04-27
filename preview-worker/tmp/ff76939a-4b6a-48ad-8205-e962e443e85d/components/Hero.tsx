import { appConfig } from "@/lib/config";

export default function Hero() {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-gray-950 px-8 py-16 text-white shadow-sm">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            Shopify storefront prototype
          </p>

          <h1 className="mt-4 max-w-5xl text-5xl font-black tracking-tight md:text-6xl">
            {appConfig.name}
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-300">
            A conversion-focused Shopify store foundation for selling laptops,
            computers, accessories, student bundles, and business-ready technology kits.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#products" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black">
              Shop featured products
            </a>

            <a href="#launch" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white">
              View launch checklist
            </a>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <div className="rounded-2xl bg-white p-5 text-black">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Featured bundle
            </p>
            <h2 className="mt-3 text-2xl font-black">Laptop + setup kit</h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Laptop, dock, mouse, keyboard, carry bag, warranty guidance, and setup support.
            </p>
            <div className="mt-5 rounded-xl bg-gray-100 p-4 text-sm font-semibold text-gray-700">
              Prototype product image
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}