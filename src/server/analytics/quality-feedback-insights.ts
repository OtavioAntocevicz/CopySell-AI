/** @module src/server/analytics/quality-feedback-insights.ts */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PROMPT_TUNE_HINTS,
  QUALITY_ISSUE_LABELS,
  QUALITY_ISSUE_TAGS,
  type QualityIssueTag,
} from "@/domains/listing/quality-feedback";
import { logServerInfo } from "@/lib/logger";

export type IssueCount = { tag: QualityIssueTag; label: string; count: number };

export type QualityFeedbackRow = {
  id: string;
  listingId: string;
  productName: string;
  category: string;
  issueTags: QualityIssueTag[];
  notes: string | null;
  createdAt: string;
};

export type PromptTuneRecommendation = {
  tag: QualityIssueTag;
  label: string;
  count: number;
  hint: string;
};

export type QualityFeedbackInsights = {
  windowDays: number;
  sampleCount: number;
  issueCounts: IssueCount[];
  recentFeedback: QualityFeedbackRow[];
  /** Tags com 3+ ocorrências — candidatas a ajuste de prompt. */
  tuneRecommendations: PromptTuneRecommendation[];
};

function isoDaysAgoUtc(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

export async function computeQualityFeedbackInsights(
  supabase: SupabaseClient,
  opts?: { windowDays?: number; sampleLimit?: number },
): Promise<QualityFeedbackInsights> {
  const windowDays = opts?.windowDays ?? 90;
  const sampleLimit = opts?.sampleLimit ?? 100;
  const since = isoDaysAgoUtc(windowDays);

  const { data: rows, error } = await supabase
    .from("listing_quality_feedback")
    .select(
      `
      id,
      listing_id,
      issue_tags,
      notes,
      created_at,
      listings ( product_name, category )
    `,
    )
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(sampleLimit);

  if (error) throw error;

  const tagCounts = new Map<QualityIssueTag, number>();
  for (const tag of QUALITY_ISSUE_TAGS) {
    tagCounts.set(tag, 0);
  }

  const recentFeedback: QualityFeedbackRow[] = [];

  for (const raw of rows ?? []) {
    const listing = raw.listings as {
      product_name?: string;
      category?: string;
    } | null;
    const tags = (raw.issue_tags ?? []) as QualityIssueTag[];
    for (const tag of tags) {
      if (QUALITY_ISSUE_TAGS.includes(tag)) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
    recentFeedback.push({
      id: raw.id as string,
      listingId: raw.listing_id as string,
      productName: listing?.product_name ?? "(sem nome)",
      category: listing?.category ?? "(sem categoria)",
      issueTags: tags.filter((t) => QUALITY_ISSUE_TAGS.includes(t)),
      notes: (raw.notes as string | null) ?? null,
      createdAt: raw.created_at as string,
    });
  }

  const issueCounts: IssueCount[] = QUALITY_ISSUE_TAGS.map((tag) => ({
    tag,
    label: QUALITY_ISSUE_LABELS[tag],
    count: tagCounts.get(tag) ?? 0,
  })).sort((a, b) => b.count - a.count);

  const tuneRecommendations: PromptTuneRecommendation[] = issueCounts
    .filter((i) => i.count >= 3)
    .map((i) => ({
      tag: i.tag,
      label: i.label,
      count: i.count,
      hint: PROMPT_TUNE_HINTS[i.tag],
    }));

  logServerInfo("quality_feedback_insight_generated", {
    sampleCount: recentFeedback.length,
    tuneCount: tuneRecommendations.length,
  });

  return {
    windowDays,
    sampleCount: recentFeedback.length,
    issueCounts,
    recentFeedback,
    tuneRecommendations,
  };
}
