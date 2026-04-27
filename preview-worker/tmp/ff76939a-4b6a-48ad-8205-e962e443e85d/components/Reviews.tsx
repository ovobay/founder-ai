const reviews = [
  {
    name: "Student buyer",
    quote: "The bundle made it easy to know what laptop and accessories I actually needed.",
  },
  {
    name: "Small business owner",
    quote: "The business setup helped us buy devices without wasting time comparing endless models.",
  },
  {
    name: "Parent buyer",
    quote: "Clear options, useful support details, and no confusing technical nonsense.",
  },
];

export default function Reviews() {
  return (
    <section className="mt-12 rounded-[2rem] bg-gray-50 p-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        Social proof
      </p>

      <h2 className="mt-2 text-3xl font-bold text-gray-950">
        Review section for buyer confidence
      </h2>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {reviews.map((review) => (
          <article key={review.name} className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm leading-6 text-gray-600">“{review.quote}”</p>
            <p className="mt-4 text-sm font-bold text-gray-950">{review.name}</p>
          </article>
        ))}
      </div>
    </section>
  );
}