const LIMITATIONS = [
  {
    title: "It only knows its training",
    body: "The model can only choose among the classes it was trained on. Conditions outside that set will be forced into the nearest known class.",
  },
  {
    title: "Confidence is not correctness",
    body: "A high confidence score means the model found the image similar to its training examples — not that the classification is right.",
  },
  {
    title: "Image quality matters",
    body: "Blur, poor lighting, unusual angles, or images that aren't oral photographs at all will produce unreliable results.",
  },
  {
    title: "No clinical context",
    body: "The model sees pixels only. It knows nothing about symptoms, history, or examination findings that real assessment requires.",
  },
];

export function Limitations() {
  return (
    <section
      aria-labelledby="limitations-heading"
      className="mx-auto max-w-[1120px] px-4 py-16 sm:px-6 sm:py-24"
    >
      <p className="eyebrow">Candor</p>
      <h2 id="limitations-heading" className="mt-3 font-display text-3xl text-ink">
        What this system cannot do
      </h2>
      <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2">
        {LIMITATIONS.map((item) => (
          <div key={item.title}>
            <h3 className="font-medium text-ink">{item.title}</h3>
            <p className="mt-2 max-w-[48ch] text-sm leading-relaxed text-ink-soft">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
