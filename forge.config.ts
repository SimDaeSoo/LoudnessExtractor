import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import type { ForgeConfig } from '@electron-forge/shared-types';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { config as loadConfig } from 'dotenv';
import { cpSync } from 'fs';
import { resolve } from 'path';
import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

loadConfig();

const config: ForgeConfig = {
  packagerConfig:
    process.platform === 'darwin'
      ? {
          asar: true,
          icon: './src/resources/icons/icon',
          extraResource: ['./src/resources/log', './src/resources/icons'],
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
        }
      : {
          asar: true,
          extraResource: ['./src/resources/log'],
        },
  rebuildConfig: {},
  makers:
    process.platform === 'darwin'
      ? [
          new MakerDMG({
            format: 'ULFO',
            icon: './src/resources/icons/icon.icns',
          }),
          new MakerZIP({}, ['win32', 'darwin']),
        ]
      : [
          new MakerSquirrel({
            setupIcon: './src/resources/icons/icon.ico',
          }),
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
      platforms: ['darwin', 'win32'],
      config: {
        authToken: process.env.GITHUB_TOKEN,
        repository: {
          owner: 'SimDaeSoo',
          name: 'LoudnessExtractor',
        },
        prerelease: true,
      },
    },
  ],
  hooks: {
    packageAfterCopy: async (_forgeConfig, buildPath, _electronVersion, platform, _arch) => {
      const binaryPath = resolve(__dirname, 'src', 'resources', platform);
      const resourcePath = resolve(buildPath, '..', platform);

      cpSync(binaryPath, resourcePath, { recursive: true });
    },
  },
};

export default config;
