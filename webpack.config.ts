import * as path from "path";
import * as webpack from "webpack";

const HtmlWebpackPlugin = require("html-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

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

// @ts-ignore
const setMinify = (debug: boolean) => {
    const minifyOpts = {
        parallel: true,
        cache: false,
        sourceMap: debug,
        uglifyOptions: {
            ecma: 8,
            warnings: false,
            toplevel: true,
            nameCache: null,
            ie8: false,
            keep_classnames: undefined,
            keep_fnames: false,
            safari10: false,
            compress: {
                drop_console: !debug,
                drop_debugger: !debug,
                ecma: 8
            },
            output: {
                comments: false,
                beautify: false,
                ecma: 8,
            },
        }
    };
    if(webpackConfig && webpackConfig.plugins) {
        webpackConfig.plugins.push(
            new UglifyJsPlugin(minifyOpts)
        );
    }
};

const setEnv = (debug: boolean) => {
    if(!debug) {
        process.env["BABEL_ENV"] = "production";
        process.env["NODE_ENV"] = "production";
    }
    else {
        process.env["BABEL_ENV"] = "development";
        process.env["NODE_ENV"] = "development";
    }
};

module.exports = (param: any): webpack.Configuration[] => {
    const debug = param && param.debug === "true";
    const minify = param && param.minify === "true";

    console.log("running webpack config with:");
    console.log(`   debug = ${debug}`);
    console.log(`   minify = ${minify}`);
    setEnv(debug);
    setBuildVariables(debug);

    // current uglify settings make it so I can't debug the main process easily
    if(minify) {
        setMinify(debug);
    }

    const config = [
        Object.assign({}, {
            target: "electron-main",
            devtool: debug ? "inline-source-map" : undefined,
            entry: {
                main: "./src/main.ts"
            },
            stats: "errors-only"
        } as webpack.Configuration, webpackConfig),
        Object.assign({}, {
            target: "electron-renderer",
            devtool: debug ? "inline-source-map" : undefined,
            entry: {
                gui: "./src/gui.tsx"
            },
            stats: "errors-only",
            plugins: [new HtmlWebpackPlugin({
                template: "src/index.template.html",
                inject: "body",
                title: "Electron Test"
            })]
        } as webpack.Configuration, webpackConfig)
    ];

    return config;
};