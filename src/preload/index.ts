import { contextBridge } from 'electron';
import { versions } from './bridges/versions';
import { ffmpeg } from './bridges/ffmpeg';

contextBridge.exposeInMainWorld('versions', versions);
contextBridge.exposeInMainWorld('ffmpeg', ffmpeg);
