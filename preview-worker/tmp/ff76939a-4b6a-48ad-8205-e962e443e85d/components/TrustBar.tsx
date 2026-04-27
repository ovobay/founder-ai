const items = [
  "Secure checkout",
  "Fast Irish delivery",
  "Warranty support",
  "Student and business bundles",
];

export default function TrustBar() {
  return (
    <section className="mt-8 grid gap-3 md:grid-cols-4">
      {items.map((item) => (
        <div key={item} className="rounded-2xl border border-gray-200 bg-white p-4 text-sm font-semibold text-gray-700 shadow-sm">
          {item}
        </div>
      ))}
    </section>
  );
}