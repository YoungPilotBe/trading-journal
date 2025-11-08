import MakerZIP from "@electron-forge/maker-zip";
import FusesPlugin from "@electron-forge/plugin-fuses";
import PublisherGithub from "@electron-forge/publisher-github";
import type { ForgeConfig } from "@electron-forge/shared-types";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    name: "Trading Journal",
    appCategoryType: "public.app-category.developer-tools",
  },
  rebuildConfig: {},
  makers: [
    new MakerZIP({}, ["darwin"]), // macOS
    new MakerZIP({}, ["linux"]), // Linux ARM64 for Raspberry Pi
    // Uncomment DEB maker if building on Linux
    // new MakerDeb({}, ["linux"])
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        name: "trading-journal",
        owner: "YoungPilotBe",
      },
      draft: true,
      generateReleaseNotes: true,
      force: true,
    }),
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
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
};
export default config;
