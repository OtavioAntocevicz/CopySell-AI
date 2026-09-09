/** @module src/server/listing/aiListingService.ts */

import { createHash } from "crypto";
import { ZodError } from "zod";
import type { MarketplaceId } from "@/domains/marketplace/types";
import { getListingConstraints, isMarketplaceAvailable } from "@/domains/marketplace/registry";
import {
  type ListingAiOutput,
  type GenerateListingFormInput,
  outputSchemaForMarketplace,
} from "@/domains/listing/schemas";
import { categoryLabel } from "@/lib/categoryLabels";
import { DEFAULT_GEMINI_MODEL, MAX_IMAGE_BYTES } from "@/lib/constants";
import { logServerInfo, logServerWarn } from "@/lib/logger";
import { generateListingJson } from "@/server/ai/gemini";
import { getPromptConfig } from "@/server/ai/prompts";
import { createClient } from "@/server/supabase/server";
import {
  uploadProductImage,
  type UploadedImageMeta,
} from "@/server/storage/uploadProductImage";
import { semanticPostProcess } from "@/server/listing/semantic/semantic-post-process";
import {
  canUserGenerate,
  consumeGenerationAtomically,
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
  sellerNotes?: string;
  imageFiles: File[];
};

export async function generateListingForUser(
  params: GenerateListingParams,
): Promise<{ listingId: string; output: ListingAiOutput }> {
  if (!isMarketplaceAvailable(params.marketplace)) {
    throw new Error("MARKETPLACE_UNAVAILABLE");
  }

  const supabase = await createClient();
  const gate = await canUserGenerate(supabase, params.userId);
  if (!gate.allowed) {
    if (gate.reason === "USER_BLOCKED") throw new Error("USER_BLOCKED");
    if (gate.reason === "MONTHLY_LIMIT") {
      throw new Error("MONTHLY_LIMIT_REACHED");
    }
    throw new Error("SUBSCRIPTION_INACTIVE");
  }

  const maxImages = Math.min(
    gate.limits.maxImagesPerGeneration,
    params.imageFiles.length,
  );
  if (maxImages < 1) {
    throw new Error("IMAGE_REQUIRED");
  }

  const files = params.imageFiles.slice(0, maxImages);
  const maxBytes = Math.min(MAX_IMAGE_BYTES, gate.limits.maxImageBytes);
  for (const file of files) {
    if (file.size > maxBytes) {
      throw new Error("IMAGE_TOO_LARGE");
    }
  }

  const constraints = getListingConstraints(params.marketplace);
  const categoryPt = categoryLabel(params.category);
  const modelName = process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
  const promptConfig = getPromptConfig(params.marketplace);
  const outputSchema = outputSchemaForMarketplace(params.marketplace);

  const uploaded: UploadedImageMeta[] = [];
  const imageParts: { mimeType: string; base64: string }[] = [];
  let imageSha256 = "";

  try {
    for (const file of files) {
      const meta = await uploadProductImage(params.userId, file);
      uploaded.push(meta);
      const buf = Buffer.from(await file.arrayBuffer());
      if (!imageSha256) {
        imageSha256 = createHash("sha256").update(buf).digest("hex");
      }
      imageParts.push({
        mimeType: meta.mime,
        base64: buf.toString("base64"),
      });
    }

    const primary = uploaded[0]!;
    const extraPaths = uploaded.slice(1).map((m) => m.path);

    const runOnce = async (repairHint?: string) => {
      const userText = promptConfig.buildUserText({
        marketplace: params.marketplace,
        productName: params.productName,
        categoryLabel: categoryPt,
        constraintsBlock: constraints.promptRulesBlock,
        sellerNotes: params.sellerNotes,
        repairHint,
      });
      const { rawText } = await generateListingJson({
        systemInstruction: promptConfig.systemInstruction,
        userText,
        images: imageParts,
      });

      let parsedJson: unknown;
      try {
        parsedJson = parseListingJson(rawText);
      } catch {
        return outputSchema.safeParse(null);
      }

      const first = outputSchema.safeParse(parsedJson);
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
      return outputSchema.safeParse(semanticallyCleaned);
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
        imagePath: primary.path,
        imageMime: primary.mime,
        imagePaths: extraPaths,
        imageSha256,
        model: modelName,
        promptVersion: promptConfig.promptVersion,
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
      imagePath: primary.path,
      imageMime: primary.mime,
      imagePaths: extraPaths,
      imageSha256,
      output,
      model: modelName,
      promptVersion: promptConfig.promptVersion,
    });

    await consumeGenerationAtomically(
      supabase,
      params.userId,
      files.length,
    );

    logServerInfo("listing_generated", {
      listingId,
      userId: params.userId,
      marketplace: params.marketplace,
      promptVersion: promptConfig.promptVersion,
      imageCount: files.length,
    });

    return { listingId, output };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const primary = uploaded[0];
    if (
      primary &&
      imageSha256 &&
      message !== "AI_OUTPUT_INVALID" &&
      message !== "MONTHLY_LIMIT_REACHED" &&
      message !== "USER_BLOCKED" &&
      message !== "SUBSCRIPTION_INACTIVE" &&
      message !== "EXTRA_CREDIT_DECREMENT_FAILED" &&
      message !== "RATE_LIMIT" &&
      message !== "MARKETPLACE_UNAVAILABLE"
    ) {
      await persistFailedListing({
        userId: params.userId,
        marketplace: params.marketplace,
        productName: params.productName,
        category: params.category,
        sellerNotes: params.sellerNotes,
        imagePath: primary.path,
        imageMime: primary.mime,
        imagePaths: uploaded.slice(1).map((m) => m.path),
        imageSha256,
        model: modelName,
        promptVersion: promptConfig.promptVersion,
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
  imagePaths: string[];
  imageSha256: string;
  output: ListingAiOutput;
  model: string;
  promptVersion: string;
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
      image_paths: args.imagePaths,
      image_sha256: args.imageSha256,
      outputs: args.output,
      outputs_ai_snapshot: args.output,
      model: args.model,
      prompt_version: args.promptVersion,
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
  imagePaths: string[];
  imageSha256: string;
  model: string;
  promptVersion: string;
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
    image_paths: args.imagePaths,
    image_sha256: args.imageSha256,
    outputs: {},
    model: args.model,
    prompt_version: args.promptVersion,
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
