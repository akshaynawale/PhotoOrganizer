import type { Configuration } from "webpack";
import path from "node:path";

const webpackmainconfig: Configuration = {
    mode: "production",
    target: "electron-main",
    entry: "./src/main/main.ts",
    output: {
        path: path.resolve(import.meta.dirname, "dist"),
        filename: "main.js",
        // needed for the ESModule
        module: true,
        libraryTarget: "module",
    },
    experiments: {
        // following is needed for the ESModule
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
                    configFile: "tsconfig.main.json",
                },
            },
        ],
    },
};

export default webpackmainconfig;