import path from "path";
import { ForgeConfig } from "@electron-forge/shared-types";

const PhotoOrgForgeConfig: ForgeConfig = {
    packagerConfig: {
        asar: true,
    },
    rebuildConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {},
        },
        {
            name: '@electron-forge/maker-zip',
            platforms: ['darwin'],
            config: {},
        },
        {
            name: '@electron-forge/maker-deb',
            config: {},
        },
        {
            name: '@electron-forge/maker-rpm',
            config: {},
        },
    ],
    plugins: [
        {
            name: "@electron-forge/plugin-webpack",
            config: {
                mainConfig: "./webpack.main.config.ts",
                renderer: {
                    config: "./webpack.renderer.config.ts",
                    entryPoints: [{
                        name: "main_window",
                        html: "./src/renderer/index.html",
                        js: "./src/renderer/renderer.ts",
                        preload: {
                            js: "./src/preload/preload.ts",
                        },
                    }],
                }
            }
        }

    ],
}

export default PhotoOrgForgeConfig;