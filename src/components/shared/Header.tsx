import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold text-slate-900 tracking-tight hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <span>🏠</span>
          <span>KosPasti</span>
        </Link>
      </div>
    </header>
  );
}

export default Header;
