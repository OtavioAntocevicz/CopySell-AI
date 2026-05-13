import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/30 flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          CopySell AI
        </Link>
        <p className="text-muted-foreground text-sm">
          Anúncios otimizados para marketplaces
        </p>
      </div>
      <div className="bg-card w-full max-w-md rounded-xl border p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}
