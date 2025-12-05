import path from "node:path";
import type { Configuration } from "webpack";

const webpackrendererconfig: Configuration = {
    mode: "production",
    target: "electron-renderer",
    entry: "./renderer/renderer.ts",
    output: {
        path: path.resolve(import.meta.dirname, "dist"),
        filename: "renderer.js",
        module: true,
        libraryTarget: "module",
    },
    experiments: {
        outputModule: true,
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
                    configFile: "tsconfig.renderer.json",
                },
            },
        ],
    },
}
export default webpackrendererconfig;