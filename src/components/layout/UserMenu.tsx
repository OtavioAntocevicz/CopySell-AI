"use client";

/**
 * @module src/components/layout/UserMenu
 * Menu do usuario no shell: conta, logout via Supabase client.
 */
import { useRouter } from "next/navigation";
import { ChevronDown, CircleUser, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({
  email,
  isAdmin = false,
  collapsed = false,
}: {
  email: string;
  isAdmin?: boolean;
  collapsed?: boolean;
}) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        title={collapsed ? email : undefined}
        className={cn(
          buttonVariants({ variant: "outline", size: collapsed ? "icon" : "sm" }),
          collapsed ? "size-9 shrink-0" : "w-full min-w-0 max-w-full gap-1.5",
        )}
      >
        {collapsed ? (
          <CircleUser className="size-4" />
        ) : (
          <>
            <span className="min-w-0 flex-1 truncate text-left">{email}</span>
            <ChevronDown className="size-4 shrink-0 opacity-60" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate font-normal text-xs">
            {email}
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => router.push("/dashboard/conta")}>
            Minha conta
          </DropdownMenuItem>
          {isAdmin ? (
            <DropdownMenuItem onClick={() => router.push("/admin")}>
              Painel admin
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => void signOut()} variant="destructive">
            <LogOut />
            Sair da conta
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
