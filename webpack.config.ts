import * as path from "path";
import * as webpack from "webpack";

const HtmlWebpackPlugin = require("html-webpack-plugin");

const webpackConfig: webpack.Configuration = {
    mode: "none",
    node: {
        __dirname: false
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js"
    },
    module: {
        rules: [{
            test: /\.ts$/,
            enforce: "pre",
            loader: "tslint-loader",
            options: {
                typeCheck: true,
                emitErrors: true
            }
        }, {
            test: /\.tsx?$/,
            exclude: /node_modules/,
            loaders: ["babel-loader", "ts-loader" ]
        }, {
            test: /\.jsx?$/,
            exclude: /node_modules/,
            loader: "babel-loader"
        }]
    },
    resolve: {
        extensions: [".js", ".ts", ".tsx", ".jsx", ".json"]
    },
    plugins: []
};

const setBuildVariables = (debug: boolean) => {
    if(webpackConfig && webpackConfig.plugins) {
        webpackConfig.plugins.push(
            new webpack.DefinePlugin({
                __DEV__: JSON.stringify(debug)
            })
        );
    }
};

module.exports = (param: any): webpack.Configuration[] => {
    console.log(`running webpack config with ${JSON.stringify(param)}`);

    const debug = param && param.debug === "true";
    setBuildVariables(debug);

    const config = [
        Object.assign({}, {
            target: "electron-main",
            devtool: debug ? "inline-source-map" : undefined,
            entry: {
                main: "./src/main.ts"
            }
        } as webpack.Configuration, webpackConfig),
        Object.assign({}, {
            target: "electron-renderer",
            devtool: debug ? "inline-source-map" : undefined,
            entry: {
                gui: "./src/gui.tsx"
            },
            plugins: [new HtmlWebpackPlugin({
                template: "src/index.template.html",
                inject: "body",
                title: "Electron Test"
            })]
        } as webpack.Configuration, webpackConfig)
    ];

    return config;
};