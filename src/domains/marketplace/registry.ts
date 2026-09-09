/** @module src/domains/marketplace/registry.ts */

import { amazonConstraints } from "@/domains/marketplace/amazon/constraints";
import { mercadoLivreConstraints } from "@/domains/marketplace/mercado-livre/constraints";
import { mercadoLivreExporter } from "@/domains/marketplace/mercado-livre/export";
import { lojaPropriaConstraints } from "@/domains/marketplace/loja-propria/constraints";
import { lojaPropriaExporter } from "@/domains/marketplace/loja-propria/export";
import type {
  ListingConstraints,
  MarketplaceExporter,
  MarketplaceId,
} from "@/domains/marketplace/types";

const exporters: Record<MarketplaceId, MarketplaceExporter> = {
  mercado_livre: mercadoLivreExporter,
  loja_propria: lojaPropriaExporter,
  amazon: lojaPropriaExporter,
};

const constraints: Record<MarketplaceId, ListingConstraints> = {
  mercado_livre: mercadoLivreConstraints,
  loja_propria: lojaPropriaConstraints,
  amazon: amazonConstraints,
};

export function getMarketplaceExporter(id: MarketplaceId): MarketplaceExporter {
  return exporters[id];
}

export function getListingConstraints(id: MarketplaceId): ListingConstraints {
  return constraints[id];
}

export function isMarketplaceAvailable(id: MarketplaceId): boolean {
  if (id === "amazon") return false;
  return true;
}
