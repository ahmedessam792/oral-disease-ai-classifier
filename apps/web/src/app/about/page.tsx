import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Container,
  EyeOff,
  ListChecks,
  ServerCog,
  ShieldCheck,
  Sliders,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { Disclosure } from "@/components/sections/Disclosures";
import { ModelClasses } from "@/components/sections/ModelClasses";

export const metadata: Metadata = {
  title: "About Arcus — how the model and the system work",
  description:
    "How Arcus classifies oral images: the ResNet50V2 model, the analysis pipeline, its limitations, privacy behavior, and the system architecture.",
};

const STEPS = [
  { icon: Upload, title: "Upload", body: "Drop an image or browse. It stays on your device until you analyze." },
  { icon: ShieldCheck, title: "Validate", body: "Type, size, integrity, and dimensions are checked before anything else." },
  { icon: Sliders, title: "Preprocess", body: "Resized to 224×224 RGB in memory. Pixels stay 0–255 — the model rescales internally." },
  { icon: Brain, title: "Classify", body: "Every class gets a probability. The image is discarded immediately after." },
  { icon: ListChecks, title: "Review", body: "Read the class, the confidence, and the full distribution." },
];

const LIMITATIONS = [
  {
    title: "It only knows its training",
    body: "The model can only choose among the classes it was trained on. Conditions outside that set — and images that are not oral photographs at all — will be forced into the nearest known class.",
  },
  {
    title: "Confidence is not correctness",
    body: "A high confidence score means the model found the image similar to its training examples, not that the classification is right.",
  },
  {
    title: "Image quality matters",
    body: "Blur, poor lighting, and unusual angles produce unreliable results.",
  },
  {
    title: "No clinical context",
    body: "The model sees pixels only. It knows nothing about symptoms, history, or examination findings that real assessment requires.",
  },
];

const PRIVACY = [
  "Uploaded images are processed entirely in memory: validated, resized, classified, and immediately discarded. They are never written to disk, stored in a database, or logged.",
  "This site uses no analytics and no trackers. The only network request your image makes is the one you trigger with the Analyze button.",
  "Downloadable reports are generated entirely in your browser. The image is not re-uploaded to produce one, and its EXIF metadata is removed in the process.",
  "Still, avoid uploading images that could identify a person if that concerns you — this is a student research project, not a certified medical system.",
];

const STACK: [string, string][] = [
  ["Frontend", "Next.js · TypeScript · Tailwind CSS"],
  ["Backend", "FastAPI · Python 3.12"],
  ["Model runtime", "TensorFlow · Keras 3"],
  ["Packaging", "Docker · docker compose"],
  ["Testing", "pytest · Vitest · Playwright · axe"],
  ["Deployment", "Vercel (web) · Hugging Face Spaces (API)"],
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
      <header className="max-w-[62ch]">
        <h1
          tabIndex={-1}
          className="text-[1.875rem] font-semibold leading-[1.14] tracking-[-0.02em] text-ink outline-none sm:text-[2.5rem]"
        >
          About Arcus
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-soft">
          Arcus is an educational oral-image classifier. It takes a photograph of
          teeth, gums, or oral tissue, runs it through a trained ResNet50V2, and
          reports what it predicted and how sure it was — including every
          probability it assigned to every class it knows.
        </p>
        <p className="mt-4 rounded-md border border-teal/30 bg-teal-wash px-4 py-3 text-sm leading-relaxed text-teal-deep">
          Educational and research use only. Arcus is not a medical device and its
          output is never a diagnosis.
        </p>
      </header>

      {/* How the analysis works */}
      <section aria-labelledby="how-heading" className="mt-16">
        <h2 id="how-heading" className="text-xl font-semibold tracking-[-0.01em] text-ink">
          How a reading happens
        </h2>
        <ol className="mt-8 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map(({ icon: Icon, title, body }, index) => (
            <li key={title}>
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
      </section>

      {/* The model — live from the API */}
      <section aria-labelledby="model-heading" className="mt-16">
        <h2 id="model-heading" className="text-xl font-semibold tracking-[-0.01em] text-ink">
          The model
        </h2>
        <p className="mt-3 max-w-[62ch] leading-relaxed text-ink-soft">
          A ResNet50V2 fine-tuned for oral image classification. It expects 224×224
          RGB input and carries its own rescaling layer, so the service feeds it raw
          pixels and never normalizes them twice. Its head is a softmax over the six
          classes below — the distribution you see in a result is the model&apos;s own
          output, not a derived score.
        </p>
        <ModelClasses />
      </section>

      {/* Architecture */}
      <section aria-labelledby="arch-heading" className="mt-16">
        <h2 id="arch-heading" className="text-xl font-semibold tracking-[-0.01em] text-ink">
          Architecture
        </h2>
        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          {[
            {
              icon: ServerCog,
              title: "Two services, one contract",
              body: "A Next.js frontend and a FastAPI backend, talking over a frozen JSON contract. The model is loaded once at startup and served through a framework-agnostic adapter, so it can be replaced without touching the API or the UI.",
            },
            {
              icon: ShieldCheck,
              title: "Safe by default",
              body: "Strict upload validation, in-memory processing, no persistence, no analytics. The real model is the default; a development mock exists but is refused in production and is always labeled when it runs.",
            },
            {
              icon: Container,
              title: "Reproducible",
              body: "Both services are containerized. The API image carries the TensorFlow runtime and mounts the model read-only; the web app deploys as a static-friendly Next.js build.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-lg border border-line bg-surface p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-wash text-teal">
                <Icon aria-hidden="true" size={18} strokeWidth={1.75} />
              </span>
              <h3 className="mt-3 font-medium text-ink">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
            </div>
          ))}
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STACK.map(([label, value]) => (
            <div key={label} className="rounded-md border border-line bg-surface px-4 py-3">
              <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-ink-faint">
                {label}
              </dt>
              <dd className="mt-1 font-mono text-sm text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Limits + privacy, behind disclosure */}
      <section aria-labelledby="limits-heading" className="mt-16">
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
      </section>

      <Link
        href="/"
        className="mt-14 inline-flex h-12 items-center gap-2 rounded-md bg-teal px-6 text-sm font-medium text-white transition-colors hover:bg-teal-deep"
      >
        Analyze an image
        <ArrowRight aria-hidden="true" size={16} strokeWidth={2} />
      </Link>
    </div>
  );
}
