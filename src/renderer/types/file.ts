import { UploadFile } from 'antd';
import { LoudnessSummary } from './ffmpeg';

export type AnalyzeFile = UploadFile &
  Partial<{
    path: string;
    analyzeStatus: 'PROGRESS' | 'DONE' | 'ERROR';
    loudness: LoudnessSummary;
  }>;
