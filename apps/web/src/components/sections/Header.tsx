import { Wordmark } from "@/components/brand/Wordmark";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#model", label: "Model" },
  { href: "#limits", label: "Limits" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-porcelain/85 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#top" className="rounded-sm" aria-label="Arcus — home">
          <Wordmark />
        </a>

        <nav aria-label="Page sections" className="flex items-center gap-1 sm:gap-2">
          <ul className="hidden items-center gap-1 sm:flex">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-teal-wash hover:text-teal-deep"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#classifier"
            className="ml-1 flex h-11 items-center rounded-md bg-teal px-4 text-sm font-medium text-white transition-colors hover:bg-teal-deep"
          >
            Analyze an image
          </a>
        </nav>
      </div>
    </header>
  );
}
