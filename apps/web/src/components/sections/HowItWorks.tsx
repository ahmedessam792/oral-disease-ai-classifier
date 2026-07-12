const STEPS = [
  {
    title: "Upload",
    body: "Drop an image onto the viewing surface or browse for one. It stays on your device until you choose to analyze it.",
  },
  {
    title: "Validate",
    body: "The service checks the file type, size, integrity, and dimensions before anything else happens.",
  },
  {
    title: "Preprocess",
    body: "The image is resized and normalized in memory to exactly what the model was trained on.",
  },
  {
    title: "Classify",
    body: "The model assigns a probability to every class it knows. Nothing is stored — the image is discarded immediately.",
  },
  {
    title: "Review",
    body: "You see the predicted class, its confidence, and the full distribution — enough to question the result, not just accept it.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="mx-auto max-w-[1120px] scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24"
    >
      <p className="eyebrow">Method</p>
      <h2 id="how-heading" className="mt-3 font-display text-3xl text-ink">
        How a reading happens
      </h2>
      <ol className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <p className="font-mono text-sm text-teal">{index + 1}</p>
            <h3 className="mt-2 font-medium text-ink">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
