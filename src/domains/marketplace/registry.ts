/** @module src/domains/marketplace/registry.ts */

import type { MarketplaceExporter, MarketplaceId } from "./types";
import { mercadoLivreExporter } from "./mercado-livre/export";
import { mercadoLivreConstraints } from "./mercado-livre/constraints";
import type { ListingConstraints } from "./types";

const exporters: Record<MarketplaceId, MarketplaceExporter> = {
  mercado_livre: mercadoLivreExporter,
};

const constraints: Record<MarketplaceId, ListingConstraints> = {
  mercado_livre: mercadoLivreConstraints,
};

export function getMarketplaceExporter(id: MarketplaceId): MarketplaceExporter {
  return exporters[id];
}

export function getListingConstraints(id: MarketplaceId): ListingConstraints {
  return constraints[id];
}
