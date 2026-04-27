const cartItems = [
  ["MacBook student starter kit", "€1,199"],
  ["USB-C productivity dock", "€89"],
  ["Wireless mouse and bag", "€59"],
];

export default function CartPreview() {
  return (
    <section id="cart" className="mt-12 rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Cart and checkout preview
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-950">
            Show customers the value of the full bundle
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600">
            This section models a cart experience that encourages accessory attachment,
            trust reassurance, and a clean route to checkout.
          </p>
        </div>

        <div className="rounded-3xl bg-gray-50 p-5">
          <div className="grid gap-3">
            {cartItems.map(([name, price]) => (
              <div key={name} className="flex items-center justify-between rounded-2xl bg-white p-4 text-sm shadow-sm">
                <span className="font-semibold text-gray-800">{name}</span>
                <span className="font-black text-gray-950">{price}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
            <span className="text-sm font-semibold text-gray-600">Estimated total</span>
            <span className="text-xl font-black text-gray-950">€1,347</span>
          </div>

          <div className="mt-4 rounded-xl bg-black px-5 py-3 text-center text-sm font-semibold text-white">
            Checkout button placeholder
          </div>
        </div>
      </div>
    </section>
  );
}