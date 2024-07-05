import { app } from 'electron';
import { resolve } from 'path';
import { IS_DEV_MODE } from './environment';

export const RESOURCE_PATH = IS_DEV_MODE
  ? resolve(app.getAppPath(), 'src', 'resources')
  : resolve(app.getAppPath(), '..');
export const LOG_PATH = resolve(RESOURCE_PATH, 'log');
export const PLATFORM_RESOURCE_PATH = resolve(RESOURCE_PATH, process.platform);
export const BINARY_PATH = resolve(PLATFORM_RESOURCE_PATH, 'bin');
export const FFMPEG_PATH = resolve(BINARY_PATH, 'ffmpeg');
export const FFPROBE_PATH = resolve(BINARY_PATH, 'ffprobe');
export const ICON_PATH = resolve(RESOURCE_PATH, 'icons');
