export type Tier = {
  id: string;
  label: string;
  color: string;
};

export type Item = {
  id: string;
  label: string;
  image: string | null;
  color?: string | null;
  description?: string | null;
  tier: string | null;
};

export type TierList = {
  version: 1;
  name: string;
  tiers: Tier[];
  items: Item[];
};

export type Preset = {
  id: string;
  name: string;
  tiers: Tier[];
};

export type ListSummary = {
  name: string;
  itemCount: number;
  mtime: number;
};

export const UNRANKED_ID = "__unranked__";
