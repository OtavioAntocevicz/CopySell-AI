import { AppLogo } from "@/components/brand/AppLogo";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/30 flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="mb-8 text-center">
          <div className="mb-2 flex justify-center">
            <AppLogo />
          </div>
          <p className="text-muted-foreground text-sm">
            Anúncios otimizados para marketplaces
          </p>
        </div>
        <div className="bg-card w-full max-w-md rounded-xl border p-6 shadow-sm">
          {children}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
