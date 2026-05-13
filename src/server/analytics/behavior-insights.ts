/** @module src/server/analytics/behavior-insights.ts */

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { logServerInfo } from "@/lib/logger";
import type { ListingBehaviorDiff } from "@/server/listing/behavior/types";

const metricsSchema = z
  .object({
    fieldsEditedCount: z.number().optional(),
    editedFields: z.array(z.string()).optional(),
    titleChanged: z.boolean().optional(),
  })
  .passthrough();

function isoDaysAgoUtc(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

export type TermCount = { term: string; count: number };

export type CategoryEditAgg = {
  category: string;
  eventCount: number;
  avgFieldsEdited: number;
};

export type BehaviorInsights = {
  sampleEvents: number;
  windowDays: number;
  topEditedFields: TermCount[];
  topKeywordsRemoved: TermCount[];
  topKeywordsAdded: TermCount[];
  categoryAggs: CategoryEditAgg[];
  /** Fração de eventos onde o título foi alterado (métrica persistida). */
  titleEditRate: number | null;
  /**
   * Listings concluídos no período que tiveram pelo menos um evento de edição
   * (proxy para “salvou após ajustar” vs só gerar).
   */
  saveAfterGenerationRate: number | null;
};

function bump(map: Map<string, number>, key: string, by = 1) {
  map.set(key, (map.get(key) ?? 0) + by);
}

function topN(map: Map<string, number>, n: number): TermCount[] {
  return [...map.entries()]
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

/**
 * Agrega `listing_behavior_events` + categorias do listing (amostra recente).
 * Pensado para painel interno; não é analytics em tempo real.
 */
export async function computeBehaviorInsights(
  supabase: SupabaseClient,
  opts?: { sampleLimit?: number; windowDays?: number },
): Promise<BehaviorInsights> {
  const sampleLimit = opts?.sampleLimit ?? 3000;
  const windowDays = opts?.windowDays ?? 30;
  const since = isoDaysAgoUtc(windowDays);

  const { data: events, error } = await supabase
    .from("listing_behavior_events")
    .select(
      `
      metrics,
      diff,
      listing_id,
      listings ( category )
    `,
    )
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(sampleLimit);

  if (error) throw error;

  const rows = events ?? [];
  const fieldCounts = new Map<string, number>();
  const removedKw = new Map<string, number>();
  const addedKw = new Map<string, number>();
  const catEvents = new Map<string, { n: number; sumFields: number }>();

  let titleEvents = 0;
  let titleChanged = 0;

  for (const raw of rows) {
    const diff = raw.diff as ListingBehaviorDiff | undefined;
    const m = metricsSchema.safeParse(raw.metrics);
    const listing = raw.listings as { category?: string } | null;
    const category =
      listing && typeof listing.category === "string"
        ? listing.category
        : "(sem categoria)";

    const fieldsChanged = diff?.fieldsChanged?.length
      ? diff.fieldsChanged
      : m.success
        ? (m.data.editedFields ?? [])
        : [];
    for (const f of fieldsChanged) {
      bump(fieldCounts, String(f), 1);
    }

    const fieldsCount =
      m.success && typeof m.data.fieldsEditedCount === "number"
        ? m.data.fieldsEditedCount
        : fieldsChanged.length;
    const prev = catEvents.get(category) ?? { n: 0, sumFields: 0 };
    catEvents.set(category, {
      n: prev.n + 1,
      sumFields: prev.sumFields + fieldsCount,
    });

    if (m.success && typeof m.data.titleChanged === "boolean") {
      titleEvents += 1;
      if (m.data.titleChanged) titleChanged += 1;
    }

    const removed = diff?.keywords?.removed;
    if (removed?.length) {
      for (const term of removed) {
        const t = term.trim().slice(0, 120);
        if (t) bump(removedKw, t, 1);
      }
    }
    const added = diff?.keywords?.added;
    if (added?.length) {
      for (const term of added) {
        const t = term.trim().slice(0, 120);
        if (t) bump(addedKw, t, 1);
      }
    }
  }

  const categoryAggs: CategoryEditAgg[] = [...catEvents.entries()]
    .map(([category, v]) => ({
      category,
      eventCount: v.n,
      avgFieldsEdited: v.n ? v.sumFields / v.n : 0,
    }))
    .sort((a, b) => b.eventCount - a.eventCount)
    .slice(0, 20);

  const { count: completedInWindow, error: cErr } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed")
    .gte("created_at", since);
  if (cErr) throw cErr;

  const { data: behaviorListingRows, error: bErr } = await supabase
    .from("listing_behavior_events")
    .select("listing_id")
    .gte("created_at", since);
  if (bErr) throw bErr;

  const distinctWithBehavior = new Set(
    (behaviorListingRows ?? []).map((r) => r.listing_id as string),
  ).size;
  const completed = completedInWindow ?? 0;
  const saveAfterGenerationRate =
    completed > 0 ? distinctWithBehavior / completed : null;

  const out: BehaviorInsights = {
    sampleEvents: rows.length,
    windowDays,
    topEditedFields: topN(fieldCounts, 12),
    topKeywordsRemoved: topN(removedKw, 15),
    topKeywordsAdded: topN(addedKw, 15),
    categoryAggs,
    titleEditRate: titleEvents ? titleChanged / titleEvents : null,
    saveAfterGenerationRate,
  };

  logServerInfo("behavior_insight_generated", {
    sampleEvents: out.sampleEvents,
    windowDays: out.windowDays,
  });

  return out;
}
