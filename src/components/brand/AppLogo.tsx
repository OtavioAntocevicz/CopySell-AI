import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type AppLogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
};

export function AppLogo({
  href = "/",
  compact = false,
  className,
}: AppLogoProps) {
  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-semibold tracking-tight",
        className,
      )}
    >
      <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
        <Sparkles className="size-4" aria-hidden />
      </span>
      {!compact ? <span>CopySell AI</span> : null}
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="hover:opacity-90">
      {content}
    </Link>
  );
}
