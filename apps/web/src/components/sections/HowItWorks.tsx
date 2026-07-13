import { Brain, ListChecks, ShieldCheck, Sliders, Upload } from "lucide-react";

const STEPS = [
  { icon: Upload, title: "Upload", body: "Drop an image or browse. It stays on your device until you analyze." },
  { icon: ShieldCheck, title: "Validate", body: "Type, size, integrity, and dimensions are checked first." },
  { icon: Sliders, title: "Preprocess", body: "Resized and normalized in memory to match the model's training." },
  { icon: Brain, title: "Classify", body: "Every class gets a probability. The image is then discarded." },
  { icon: ListChecks, title: "Review", body: "Read the class, the confidence, and the full distribution." },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="border-t border-line bg-surface"
    >
      <div className="mx-auto max-w-[1200px] scroll-mt-20 px-4 py-14 sm:px-6 sm:py-16">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="how-heading" className="text-xl font-semibold tracking-[-0.01em] text-ink">
            How a reading happens
          </h2>
          <p className="font-mono text-xs text-ink-faint">5 steps · nothing stored</p>
        </div>

        <ol className="mt-8 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map(({ icon: Icon, title, body }, index) => (
            <li key={title} className="relative">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-wash text-teal">
                  <Icon aria-hidden="true" size={18} strokeWidth={1.75} />
                </span>
                <span className="font-mono text-xs text-ink-faint">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-3 font-medium text-ink">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
