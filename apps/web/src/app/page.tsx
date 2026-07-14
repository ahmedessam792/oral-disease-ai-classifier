import Link from "next/link";
import { ArrowRight, CircleSlash, GraduationCap, Lock } from "lucide-react";
import { Classifier } from "@/components/classifier/Classifier";

const TRUST = [
  { icon: Lock, label: "In-memory only" },
  { icon: CircleSlash, label: "Never stored" },
  { icon: GraduationCap, label: "Educational use" },
];

export default function AnalyzePage() {
  return (
    <div className="mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-7 px-4 pb-16 pt-8 sm:px-6 lg:gap-8 lg:pb-20 xl:grid-cols-[minmax(0,0.66fr)_minmax(0,1.34fr)] xl:gap-14 xl:pt-12">
      {/* The message. Short by design — the instrument is the argument. */}
      <div className="flex min-w-0 flex-col justify-center">
        <h1
          tabIndex={-1}
          className="max-w-[17ch] text-[1.75rem] font-semibold leading-[1.14] tracking-[-0.02em] text-ink outline-none sm:text-[2rem] xl:text-[2.5rem]"
        >
          Upload an oral image. See what the model predicts.
        </h1>

        <p className="mt-4 max-w-[50ch] leading-relaxed text-ink-soft xl:max-w-[44ch]">
          Arcus classifies photographs of teeth, gums, and oral tissue with a
          trained ResNet50V2 — and shows its confidence, along with every
          probability it assigned.
        </p>

        <ul className="mt-5 flex flex-wrap gap-2">
          {TRUST.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[0.8125rem] text-ink-soft"
            >
              <Icon aria-hidden="true" size={14} strokeWidth={1.75} className="text-teal" />
              {label}
            </li>
          ))}
        </ul>

        <Link
          href="/about"
          className="mt-6 inline-flex h-11 w-fit items-center gap-1.5 rounded-md text-sm font-medium text-teal-deep underline-offset-4 transition-colors hover:underline"
        >
          How it works, the model, and its limits
          <ArrowRight aria-hidden="true" size={15} strokeWidth={2} />
        </Link>
      </div>

      <Classifier />
    </div>
  );
}
