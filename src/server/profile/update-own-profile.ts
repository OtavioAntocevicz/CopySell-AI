"use server";

/** @module src/server/profile/update-own-profile.ts */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  buildDisplayName,
  registrationProfileSchema,
} from "@/lib/profile/seller-segment";
import { createClient } from "@/server/supabase/server";

export type UpdateProfileState =
  | { ok: true }
  | { ok: false; message: string };

export async function updateOwnProfile(
  _prev: UpdateProfileState | undefined,
  formData: FormData,
): Promise<UpdateProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const companyRaw = String(formData.get("company_name") ?? "").trim();
  const parsed = registrationProfileSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    phone: formData.get("phone"),
    company_name: companyRaw.length ? companyRaw : undefined,
    seller_segment: formData.get("seller_segment"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(" · ");
    return { ok: false, message: msg || "Dados inválidos" };
  }

  const displayName = buildDisplayName({
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name,
  });

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      phone: parsed.data.phone,
      company_name: parsed.data.company_name ?? null,
      seller_segment: parsed.data.seller_segment,
      display_name: displayName,
    })
    .eq("id", user.id);

  if (error) {
    return {
      ok: false,
      message: error.message ?? "Não foi possível salvar. Tente de novo.",
    };
  }

  revalidatePath("/dashboard/conta");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  return { ok: true };
}
