export type LimitTier = "anonymous" | "signed_in";

export type GenerationLimits = {
  maxRequestBytes: number;
  maxLanes: number;
  maxTasksPerLane: number;
  maxTaskTextLen: number;
  maxNotesLen: number;
  ipRatePerMinute: number;
  userRatePerMinute: number;
};

export const GENERATION_LIMITS_BY_TIER: Record<LimitTier, GenerationLimits> = {
  anonymous: {
    maxRequestBytes: 50_000,
    maxLanes: 15,
    maxTasksPerLane: 20,
    maxTaskTextLen: 500,
    maxNotesLen: 2000,
    ipRatePerMinute: 30,
    userRatePerMinute: 0,
  },
  signed_in: {
    maxRequestBytes: 100_000,
    maxLanes: 40,
    maxTasksPerLane: 50,
    maxTaskTextLen: 500,
    maxNotesLen: 3000,
    ipRatePerMinute: 60,
    userRatePerMinute: 120,
  },
};

export function getGenerationLimitsForTier(tier: LimitTier): GenerationLimits {
  return GENERATION_LIMITS_BY_TIER[tier];
}

