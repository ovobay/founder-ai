const links = ["Delivery", "Returns", "Warranty", "Student offers", "Business quotes"];

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-black text-gray-950">TechStore</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
            Prototype storefront footer for policies, reassurance, support links, and conversion trust.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {links.map((link) => (
            <a key={link} href="#" className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700">
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}