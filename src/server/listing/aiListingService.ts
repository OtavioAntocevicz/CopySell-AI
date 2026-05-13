/** @module src/server/listing/aiListingService.ts */

import { createHash } from "crypto";
import { ZodError } from "zod";
import type { MarketplaceId } from "@/domains/marketplace/types";
import { getListingConstraints } from "@/domains/marketplace/registry";
import {
  listingAiOutputSchema,
  type ListingAiOutput,
  type GenerateListingFormInput,
} from "@/domains/listing/schemas";
import { categoryLabel } from "@/lib/categoryLabels";
import {
  DEFAULT_GEMINI_MODEL,
  MAX_IMAGE_BYTES,
  PROMPT_VERSION_ML_V3,
} from "@/lib/constants";
import { logServerInfo, logServerWarn } from "@/lib/logger";
import { generateListingJson } from "@/server/ai/gemini";
import {
  SYSTEM_ML_LISTING_V3,
  buildUserPayload,
} from "@/server/ai/prompts/mercado-livre-v3";
import { createClient } from "@/server/supabase/server";
import {
  uploadProductImage,
  type UploadedImageMeta,
} from "@/server/storage/uploadProductImage";
import { semanticPostProcess } from "@/server/listing/semantic/semantic-post-process";
import {
  canUserGenerate,
  incrementUsageAfterSuccessfulGeneration,
} from "@/server/usage/usage-service";

function normalizeListingOutput(
  raw: ListingAiOutput,
  constraints: ReturnType<typeof getListingConstraints>,
): ListingAiOutput {
  const title = raw.title.trim().slice(0, constraints.maxTitleLength);
  const bullets = raw.bullets
    .map((b) => b.trim())
    .filter(Boolean)
    .slice(0, constraints.bulletCountMax);

  return {
    ...raw,
    title,
    short_description: raw.short_description.trim(),
    long_description: raw.long_description.trim(),
    bullets,
    keywords: raw.keywords.map((k) => k.trim()).filter(Boolean),
    seo_suggestions: raw.seo_suggestions.map((s) => s.trim()).filter(Boolean),
    export_meta: raw.export_meta,
  };
}

function parseListingJson(rawText: string): unknown {
  return JSON.parse(rawText) as unknown;
}

export type GenerateListingParams = {
  userId: string;
  marketplace: MarketplaceId;
  productName: string;
  category: GenerateListingFormInput["category"];
  /** Texto livre do vendedor com detalhes extras do produto (opcional). */
  sellerNotes?: string;
  imageFile: File;
};

export async function generateListingForUser(
  params: GenerateListingParams,
): Promise<{ listingId: string; output: ListingAiOutput }> {
  const supabase = await createClient();
  const gate = await canUserGenerate(supabase, params.userId);
  if (!gate.allowed) {
    if (gate.reason === "USER_BLOCKED") throw new Error("USER_BLOCKED");
    if (gate.reason === "MONTHLY_LIMIT") {
      throw new Error("MONTHLY_LIMIT_REACHED");
    }
    throw new Error("SUBSCRIPTION_INACTIVE");
  }

  const maxBytes = Math.min(MAX_IMAGE_BYTES, gate.limits.maxImageBytes);
  if (params.imageFile.size > maxBytes) {
    throw new Error("IMAGE_TOO_LARGE");
  }

  const constraints = getListingConstraints(params.marketplace);
  const categoryPt = categoryLabel(params.category);
  const modelName = process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;

  let meta: UploadedImageMeta | null = null;
  let imageSha256 = "";

  try {
    meta = await uploadProductImage(params.userId, params.imageFile);
    const buf = Buffer.from(await params.imageFile.arrayBuffer());
    imageSha256 = createHash("sha256").update(buf).digest("hex");
    const base64 = buf.toString("base64");
    const imagePart = { mimeType: meta.mime, base64 };

    const runOnce = async (repairHint?: string) => {
      const userText = buildUserPayload({
        marketplace: params.marketplace,
        productName: params.productName,
        categoryLabel: categoryPt,
        constraintsBlock: constraints.promptRulesBlock,
        sellerNotes: params.sellerNotes,
        repairHint,
      });
      const { rawText } = await generateListingJson({
        systemInstruction: SYSTEM_ML_LISTING_V3,
        userText,
        image: imagePart,
      });

      let parsedJson: unknown;
      try {
        parsedJson = parseListingJson(rawText);
      } catch {
        return listingAiOutputSchema.safeParse(null);
      }

      const first = listingAiOutputSchema.safeParse(parsedJson);
      if (!first.success) {
        return first;
      }

      const normalized = normalizeListingOutput(first.data, constraints);
      const { output: semanticallyCleaned } = semanticPostProcess(
        normalized,
        {
          productName: params.productName,
          category: params.category,
          categoryLabel: categoryPt,
          sellerNotes: params.sellerNotes,
          maxTitleLength: constraints.maxTitleLength,
        },
      );
      return listingAiOutputSchema.safeParse(semanticallyCleaned);
    };

    let parsed = await runOnce();
    if (!parsed.success) {
      const hint = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      logServerWarn("listing_ai_retry", { reason: "zod_first_pass", hint });
      parsed = await runOnce(
        `Ajuste a resposta para satisfazer validação: ${hint}`,
      );
    }

    if (!parsed.success) {
      await persistFailedListing({
        userId: params.userId,
        marketplace: params.marketplace,
        productName: params.productName,
        category: params.category,
        sellerNotes: params.sellerNotes,
        imagePath: meta.path,
        imageMime: meta.mime,
        imageSha256,
        model: modelName,
        errorCode: "AI_OUTPUT_INVALID",
      });
      throw new Error("AI_OUTPUT_INVALID");
    }

    const output = parsed.data;
    const listingId = await persistCompletedListing({
      userId: params.userId,
      marketplace: params.marketplace,
      productName: params.productName,
      category: params.category,
      sellerNotes: params.sellerNotes,
      imagePath: meta.path,
      imageMime: meta.mime,
      imageSha256,
      output,
      model: modelName,
    });

    await incrementUsageAfterSuccessfulGeneration(supabase, params.userId);

    logServerInfo("listing_generated", {
      listingId,
      userId: params.userId,
      marketplace: params.marketplace,
      promptVersion: PROMPT_VERSION_ML_V3,
    });

    return { listingId, output };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      meta &&
      imageSha256 &&
      message !== "AI_OUTPUT_INVALID" &&
      message !== "MONTHLY_LIMIT_REACHED" &&
      message !== "USER_BLOCKED" &&
      message !== "SUBSCRIPTION_INACTIVE" &&
      message !== "EXTRA_CREDIT_DECREMENT_FAILED"
    ) {
      await persistFailedListing({
        userId: params.userId,
        marketplace: params.marketplace,
        productName: params.productName,
        category: params.category,
        sellerNotes: params.sellerNotes,
        imagePath: meta.path,
        imageMime: meta.mime,
        imageSha256,
        model: modelName,
        errorCode: "GEMINI_FAILED",
      });
    }
    throw err;
  }
}

async function persistCompletedListing(args: {
  userId: string;
  marketplace: MarketplaceId;
  productName: string;
  category: string;
  sellerNotes?: string;
  imagePath: string;
  imageMime: string;
  imageSha256: string;
  output: ListingAiOutput;
  model: string;
}): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .insert({
      user_id: args.userId,
      marketplace: args.marketplace,
      product_name: args.productName,
      category: args.category,
      seller_notes: args.sellerNotes ?? null,
      image_path: args.imagePath,
      image_mime: args.imageMime,
      image_sha256: args.imageSha256,
      outputs: args.output,
      outputs_ai_snapshot: args.output,
      model: args.model,
      prompt_version: PROMPT_VERSION_ML_V3,
      status: "completed",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

async function persistFailedListing(args: {
  userId: string;
  marketplace: MarketplaceId;
  productName: string;
  category: string;
  sellerNotes?: string;
  imagePath: string;
  imageMime: string;
  imageSha256: string;
  model: string;
  errorCode: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("listings").insert({
    user_id: args.userId,
    marketplace: args.marketplace,
    product_name: args.productName,
    category: args.category,
    seller_notes: args.sellerNotes ?? null,
    image_path: args.imagePath,
    image_mime: args.imageMime,
    image_sha256: args.imageSha256,
    outputs: {},
    model: args.model,
    prompt_version: PROMPT_VERSION_ML_V3,
    status: "failed",
    error_code: args.errorCode,
  });
  if (error) {
    logServerWarn("listing_failed_persist_error", {
      message: error.message,
    });
  }
}

export function formatZodIssues(err: ZodError): string {
  return err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}
