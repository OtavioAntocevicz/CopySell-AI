/** @module src/server/listing/behavior/types.ts */

import type { ListingAiOutput } from "@/domains/listing/schemas";

export type ListingOutputFieldKey =
  | "title"
  | "short_description"
  | "long_description"
  | "bullets"
  | "keywords"
  | "seo_suggestions";

/** Diff estruturado leve (MVP, sem NLP). */
export type ListingBehaviorDiff = {
  fieldsChanged: ListingOutputFieldKey[];
  title: {
    beforeLen: number;
    afterLen: number;
    delta: number;
    shortened: boolean;
    /** Igual ignorando caixa e espaços extras. */
    normalizedEquals: boolean;
  };
  short_description: { beforeLen: number; afterLen: number; delta: number };
  long_description: { beforeLen: number; afterLen: number; delta: number };
  bullets: {
    countBefore: number;
    countAfter: number;
    /** Índices 0-based onde o texto do bullet mudou. */
    changedIndices: number[];
  };
  keywords: {
    before: string[];
    after: string[];
    added: string[];
    removed: string[];
  };
  seo_suggestions: {
    countBefore: number;
    countAfter: number;
    changedIndices: number[];
  };
};

/** Métricas indexáveis / agregáveis (parte espelha o diff; útil para dashboards). */
export type ListingBehaviorMetrics = {
  editedFields: ListingOutputFieldKey[];
  fieldsEditedCount: number;
  titleChanged: boolean;
  titleLengthDelta: number;
  titleShortened: boolean;
  keywordsAdded: number;
  keywordsRemoved: number;
  bulletsChangedCount: number;
  shortDescriptionCharDelta: number;
  longDescriptionCharDelta: number;
  seoSuggestionsChangedCount: number;
  /** Tempo entre abrir sessão de edição (cliente) e salvar; opcional. */
  editDurationMs: number | null;
  /** Tempo entre criação do listing e este save (servidor). */
  generationToSaveMs: number | null;
  /** Heurística grosseira: delta de dígitos na descrição longa (possível inserção de spec). */
  longDescriptionDigitDelta: number;
};

export type RecordListingBehaviorInput = {
  listingId: string;
  userId: string;
  listingCreatedAtIso: string;
  aiSnapshot: ListingAiOutput;
  finalOutput: ListingAiOutput;
  editDurationMs: number | null;
};
