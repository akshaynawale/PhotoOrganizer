import type { Configuration } from "webpack";

import path from "node:path";

const webpackpreloadconfig: Configuration = {
    mode: "production",
    target: "electron-preload",
    entry: "./src/preload.ts",
    output: {
        path: path.resolve(import.meta.dirname, "dist"),
        filename: "preload.js",
    },
    resolve: {
        extensions: [".js", ".ts"],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                loader: "ts-loader",
                options: {
                    configFile: "tsconfig.preload.json",
                },
            },
        ],
    },
}