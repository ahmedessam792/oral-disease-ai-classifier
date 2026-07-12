export function Header() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-[1120px] items-center justify-between px-4 py-4 sm:px-6">
        <p className="font-mono text-sm tracking-wide text-ink">
          oral-disease-ai-classifier
        </p>
        <nav aria-label="Page sections">
          <ul className="flex items-center gap-5 text-sm text-ink-soft">
            <li className="hidden sm:block">
              <a href="#how-it-works" className="transition-colors hover:text-ink">
                How it works
              </a>
            </li>
            <li className="hidden sm:block">
              <a href="#model" className="transition-colors hover:text-ink">
                Model
              </a>
            </li>
            <li>
              <a
                href="#classifier"
                className="whitespace-nowrap rounded-md bg-teal px-4 py-2 font-medium text-white transition-colors hover:bg-teal-deep"
              >
                Analyze an image
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
