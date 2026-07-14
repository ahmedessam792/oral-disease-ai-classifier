import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Classifier } from "@/components/classifier/Classifier";

export default function AnalyzePage() {
  return (
    <div className="mx-auto grid w-full max-w-[1320px] flex-1 grid-cols-1 content-center items-center gap-7 px-4 pb-16 pt-8 sm:px-6 lg:gap-8 lg:pb-20 xl:grid-cols-[minmax(0,0.66fr)_minmax(0,1.34fr)] xl:gap-14 xl:pt-12">
      {/* The message. Short by design — the instrument is the argument. */}
      <div className="flex min-w-0 flex-col justify-center">
        <h1
          tabIndex={-1}
          className="max-w-[17ch] text-h1 font-semibold text-ink outline-none xl:text-display"
        >
          Upload an oral image. See what the model predicts.
        </h1>

        <p className="mt-4 max-w-[46ch] text-body text-ink-soft">
          Every class gets a probability. The prediction is the model&apos;s own
          output — not a diagnosis.
        </p>

        <p className="mt-5 font-mono text-meta text-ink-faint">ResNet50V2 · 6 classes</p>

        <Link
          href="/about"
          className="mt-6 inline-flex h-11 w-fit items-center gap-1.5 text-ui font-medium text-teal-deep underline-offset-4 transition-colors hover:underline"
        >
          How it works
          <ArrowRight aria-hidden="true" size={15} strokeWidth={2} />
        </Link>
      </div>

      <Classifier />
    </div>
  );
}
