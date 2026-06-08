import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm sm:flex-row">
        <p className="text-muted-foreground">
          © {new Date().getFullYear()} CopySell AI
        </p>
        <nav className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link href="/termos" className="hover:text-foreground underline-offset-4 hover:underline">
            Termos de Uso
          </Link>
          <Link
            href="/privacidade"
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            Política de Privacidade
          </Link>
          <Link href="/planos" className="hover:text-foreground underline-offset-4 hover:underline">
            Planos
          </Link>
        </nav>
      </div>
    </footer>
  );
}
