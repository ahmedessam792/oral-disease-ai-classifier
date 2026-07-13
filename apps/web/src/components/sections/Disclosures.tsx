import { ChevronDown, EyeOff, TriangleAlert } from "lucide-react";

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

const PRIVACY = [
  "Uploaded images are processed entirely in memory: validated, resized, classified, and immediately discarded. They are never written to disk, stored in a database, or logged.",
  "This site uses no analytics and no trackers. The only network request your image makes is the one you trigger with the Analyze button.",
  "Still, avoid uploading images that could identify a person if that concerns you — this is a student research project, not a certified medical system.",
];

interface DisclosureProps {
  icon: typeof TriangleAlert;
  summary: string;
  hint: string;
  children: React.ReactNode;
}

/** Native <details> — keyboard and screen-reader support for free. */
function Disclosure({ icon: Icon, summary, hint, children }: DisclosureProps) {
  return (
    <details className="group rounded-lg border border-line bg-surface open:shadow-2">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 transition-colors hover:bg-teal-wash/50 [&::-webkit-details-marker]:hidden">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-teal-wash text-teal">
          <Icon aria-hidden="true" size={18} strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-ink">{summary}</span>
          <span className="block text-sm text-ink-soft">{hint}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          size={18}
          strokeWidth={2}
          className="shrink-0 text-ink-faint transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <div className="border-t border-line px-5 py-5">{children}</div>
    </details>
  );
}

export function Disclosures() {
  return (
    <section
      id="limits"
      aria-labelledby="limits-heading"
      className="border-t border-line bg-surface"
    >
      <div className="mx-auto max-w-[1200px] scroll-mt-20 px-4 py-14 sm:px-6 sm:py-16">
        <h2 id="limits-heading" className="text-xl font-semibold tracking-[-0.01em] text-ink">
          Before you rely on a reading
        </h2>

        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          <Disclosure
            icon={TriangleAlert}
            summary="What this system cannot do"
            hint="Four limitations worth knowing"
          >
            <ul className="flex flex-col gap-4">
              {LIMITATIONS.map((item) => (
                <li key={item.title}>
                  <h3 className="text-sm font-medium text-ink">{item.title}</h3>
                  <p className="mt-1 max-w-[58ch] text-sm leading-relaxed text-ink-soft">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </Disclosure>

          <Disclosure
            icon={EyeOff}
            summary="Your image is examined, not kept"
            hint="How privacy works here"
          >
            <div className="flex max-w-[58ch] flex-col gap-3 text-sm leading-relaxed text-ink-soft">
              {PRIVACY.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
          </Disclosure>
        </div>
      </div>
    </section>
  );
}
