import Link from "next/link";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppLogo } from "@/components/brand/AppLogo";

type Props = {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
};

export function LegalDocumentLayout({ title, updatedAt, children }: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <AppLogo />
          <Link
            href="/"
            className="text-muted-foreground text-sm underline-offset-4 hover:underline"
          >
            Voltar ao início
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Última atualização: {updatedAt}
        </p>
        <div className="prose-legal space-y-6 text-sm leading-relaxed">{children}</div>
      </main>

      <SiteFooter />
    </div>
  );
}
