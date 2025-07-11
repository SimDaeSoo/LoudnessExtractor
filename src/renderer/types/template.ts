export type LoudnessTemplate = {
  id: number;
  groupName: string;
  name: string;
  integratedLoudnessLow: number;
  integratedLoudnessHigh: number;
  truePeakLow?: number;
  truePeakHigh?: number;
};
