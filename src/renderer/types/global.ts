import { ffmpeg } from '../../preload/bridges/ffmpeg';
import { versions } from '../../preload/bridges/versions';

declare global {
  interface Window {
    versions: typeof versions;
    ffmpeg: typeof ffmpeg;
  }
}
