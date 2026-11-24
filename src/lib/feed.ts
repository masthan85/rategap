import { SNAPSHOT_PRODUCTS } from "../data/products";
import type { Product } from "./types";

/**
 * The seam where the licensed rate feed plugs in. The MVP ships the snapshot;
 * production swaps in a client for the Moneyfacts or Defaqto API that returns
 * the same Product shape, refreshed daily.
 */
export interface RateFeed {
  name: string;
  live: boolean;
  load(): Promise<Product[]>;
}

export const snapshotFeed: RateFeed = {
  name: "Snapshot, 17–20 November 2026",
  live: false,
  load: async () => SNAPSHOT_PRODUCTS,
};
