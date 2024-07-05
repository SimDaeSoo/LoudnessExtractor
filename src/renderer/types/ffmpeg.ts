export type LoudnessSummary = Partial<{
  integratedLoudness: Partial<{
    i: number;
    threshold: number;
  }>;
  loudnessRange: Partial<{
    lra: number;
    threshold: number;
    lraLow: number;
    lraHigh: number;
  }>;
  truePeak: Partial<{
    peak: number;
  }>;
}>;
