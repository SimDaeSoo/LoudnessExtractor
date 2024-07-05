import { MakerZIP } from '@electron-forge/maker-zip';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import type { ForgeConfig } from '@electron-forge/shared-types';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { config as loadConfig } from 'dotenv';
import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

loadConfig();

const platform = process.argv[3];
const isWindowsBuild = platform === 'win32';
const isDarwinBuild = platform === 'darwin';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    extraResource: [`./src/resources/${platform}`, './src/resources/log'],
    osxUniversal: {
      x64ArchFiles: 'Contents/Resources/**/*',
    },
    osxSign: {
      identity: process.env.APPLE_SIGN_ID,
    },
    osxNotarize: {
      appleApiKey: process.env.APPLE_API_KEY || '',
      appleApiKeyId: process.env.APPLE_API_KEY_ID || '',
      appleApiIssuer: process.env.APPLE_API_ISSUER || '',
    },
  },
  rebuildConfig: {},
  makers: [
    ...(isWindowsBuild ? [] : []),
    ...(isDarwinBuild
      ? [
          {
            name: '@electron-forge/maker-dmg',
            config: {
              format: 'ULFO',
            },
          },
        ]
      : []),
    new MakerZIP({}, ['darwin', 'win32']),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      devContentSecurityPolicy: '',
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/renderer/public/index.html',
            js: './src/renderer/index.tsx',
            name: 'main_window',
            preload: {
              js: './src/preload/index.ts',
            },
          },
        ],
      },
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'SimDaeSoo',
          name: 'LoudnessExtractor',
        },
        prerelease: true,
      },
    },
  ],
};

export default config;
