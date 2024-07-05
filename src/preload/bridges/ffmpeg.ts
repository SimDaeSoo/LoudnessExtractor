import { ipcRenderer } from 'electron';

export const ffmpeg = {
  extractLoudnessSummary: (path: string) => {
    return ipcRenderer.invoke('ffmpeg-extract-loudness-summary', { path });
  },
};
