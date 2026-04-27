const navItems = ["Collections", "Products", "Bundles", "Reviews", "Launch"];

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#" className="text-lg font-black tracking-tight text-gray-950">
          TechStore
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <a key={item} href="#products" className="text-sm font-semibold text-gray-600 hover:text-gray-950">
              {item}
            </a>
          ))}
        </nav>

        <a href="#cart" className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">
          Cart preview
        </a>
      </div>
    </header>
  );
}