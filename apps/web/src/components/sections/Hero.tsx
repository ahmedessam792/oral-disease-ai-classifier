import { CircleSlash, GraduationCap, Lock } from "lucide-react";

const TRUST = [
  { icon: Lock, label: "In-memory only" },
  { icon: CircleSlash, label: "Never stored" },
  { icon: GraduationCap, label: "Educational use" },
];

/** The message beside (or above) the instrument. Deliberately short: the
 * analyzer is the argument, this is only the caption. */
export function Hero() {
  return (
    <div className="flex flex-col justify-center">
      <p className="eyebrow">AI oral image classification</p>

      <h1 className="mt-3 max-w-[17ch] text-[1.875rem] font-semibold leading-[1.12] tracking-[-0.02em] text-ink sm:text-[2.125rem] xl:mt-4 xl:text-[2.75rem]">
        Upload an oral image. See what the model predicts.
      </h1>

      <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-ink-soft xl:max-w-[46ch] xl:text-[1.0625rem]">
        Arcus classifies photographs of teeth, gums, and oral tissue — and shows
        its confidence, along with every probability it assigned.
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
    </div>
  );
}
