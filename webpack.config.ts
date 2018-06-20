import * as path from "path";
import * as webpack from "webpack";

const os = require("os");
const chalk = require("chalk");

// plugins
const HtmlWebpackPlugin = require("html-webpack-plugin");
const BabiliPlugin = require("babili-webpack-plugin");
const HappyPack = require("happypack");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const HardSourceWebpackPlugin = require("hard-source-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");

// needed for: DeprecationWarning: Tapable.plugin is deprecated. Use new API on `.hooks` instead
// see: https://nodejs.org/api/util.html
(process as any).noDeprecation = true;

interface IAppGlobal {
    startDate: Date;
    buildCount: number;
}

declare global {
    namespace NodeJS {
        interface Global {
            app: IAppGlobal;
        }
    }
}

declare const global: NodeJS.Global;

const tsThreads = Math.max(5, os.cpus().length / 2);
const jsThreads = 2;
const checkerThreads = 2;

const webpackConfig: webpack.Configuration = {
    mode: "none",
    cache: true,
    node: {
        __dirname: false
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js"
    },
    module: {
        rules: [
            // The Forked Checker takes the place of this
            // {
            //     test: /\.ts$/,
            //     enforce: "pre",
            //     loader: "tslint-loader",
            //     options: {
            //         typeCheck: true,
            //         emitErrors: true
            //     }
            // },
            // The original (no HappyPack) loaders for ts/js
            // {
            //     test: /\.tsx?$/,
            //     exclude: /node_modules/,
            //     use: [
            //         {
            //             loader: "babel-loader",
            //         },
            //         {
            //             loader: "ts-loader",
            //             query: {
            //                 transpileOnly: true,
            //                 configFile: path.resolve(__dirname, "tsconfig.json"),
            //                 logLevel: "info"
            //             }
            //         }
            //     ]
            // },
            // {
            //     test: /\.jsx?$/,
            //     exclude: /node_modules/,
            //     use:  [
            //         {
            //             loader: "babel-loader"
            //         }
            //     ]
            // }

            // HappyPack Versions
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: "happypack/loader?id=ts"
            },
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: "happypack/loader?id=js"
            }
        ]
    },
    resolve: {
        extensions: [".js", ".ts", ".tsx", ".jsx", ".json"]
    },
    plugins: []
};

const setBuildVariables = (debug: boolean, config: webpack.Configuration) => {
    if(config && config.plugins) {
        config.plugins.push(
            new webpack.DefinePlugin({
                __DEV__: JSON.stringify(debug)
            })
        );

        config.mode = "none";
        config.performance = !debug ? {
            assetFilter: undefined,
            hints: undefined,
            maxEntrypointSize: undefined,
            maxAssetSize: undefined }
            : undefined;

        config.optimization = !debug ? {
            concatenateModules: true,
            flagIncludedChunks: true,
            minimize: false, // we run babili as a plugin
            namedChunks: false,
            namedModules: false,
            nodeEnv: "production",
            noEmitOnErrors: true,
            occurrenceOrder: true,
            //portableRecords: true, // not quite sure what this does!
            providedExports: true,
            removeAvailableModules: true,
            removeEmptyChunks: true,
            //runtimeChunk: { name: "runtime", },
            sideEffects: true,
            //splitChunks: { name: "splitchunk", },
            usedExports: true,
        } : undefined;
    }
};

// no sourcemaps with minify (issue with Babili) - debug leaves the console logs in place
const setMinify = (debug: boolean, config: webpack.Configuration) => {
    if(config && config.plugins) {
        config.plugins.push(
            new BabiliPlugin({
                "mangle": false,
                "removeConsole": !debug,
                "removeDebugger": !debug,
                "deadcode": true,
            }, {
                //"comments": false -- remove all comments.  Use the default, it leaves license info in place
                //sourceMap: "nosources-source-map" - by default this will use the devtools setting
                sourceMap: false
            })
        );

        // fix sourcemap bug by forcing the plugin to use v1.0.1 (not 1.1!)
        config.plugins.push(new CleanWebpackPlugin("node_modules/babili-webpack-plugin/webpack-sources"));
    }
};

const setPlugins = (debug: boolean, config: webpack.Configuration) => {
    if(config && config.plugins) {
        config.plugins.push(
            function () {
                this.plugin("run", (_compiler: any, callback: any) => {
                    global.app.startDate = new Date();
                    console.log(chalk.green.bold(`\n${global.app.buildCount}: Start compile ${global.app.startDate.toTimeString().split(" ")[0]}`));
                    console.log(chalk.green.bold(JSON.stringify(Object.keys(_compiler.options.entry).join(", "), null, 2)));
                    callback();
                });

                this.plugin("watch-run", (_watching: any, callback: any) => {
                    global.app.startDate = new Date();
                    console.log(chalk.green.bold(`\n${global.app.buildCount}: Watch-start compile ${global.app.startDate.toTimeString().split(" ")[0]}`));
                    console.log(chalk.green.bold(JSON.stringify(Object.keys(_watching.options.entry).join(", "), null, 2)));
                    callback();
                });

                this.plugin("done", (_stats: any) => {
                    let curDate = new Date();
                    let diff = (curDate.getTime() - global.app.startDate.getTime()) / 1000.0;
                    console.log(chalk.green.bold(`\n${global.app.buildCount++}: End compile ${diff} seconds`));
                    console.log(chalk.green.bold(JSON.stringify(Object.keys(_stats.compilation.options.entry).join(", "), null, 2)));
                });
            }
        );

        config.plugins.push(new HappyPack({
            id: "ts",
            threads: tsThreads,
            loaders: [
                {
                    path: "babel-loader",
                },
                {
                    path: "ts-loader",
                    query: {
                        transpileOnly: true,
                        happyPackMode: true,
                        configFile: path.resolve(__dirname, "tsconfig.json"),
                        logLevel: "info"
                    }
                }
            ]
        }));

        config.plugins.push(new HappyPack({
            id: "js",
            threads: jsThreads,
            loaders: [
                {
                    path: "babel-loader"
                }
            ]
        }));

        config.plugins.push(new HardSourceWebpackPlugin({
            // Either an absolute path or relative to webpack's options.context.
            cacheDirectory: path.resolve(__dirname, "node_modules/.cache/hard-source/[confighash]"),

            // Either a string of object hash function given a webpack config.
            configHash: (webpackConfig: webpack.Configuration) => {
                // node-object-hash on npm can be used to build this.
                return require("node-object-hash")({sort: false}).hash(webpackConfig);
            },

            // Either false, a string, an object, or a project hashing function.
            environmentHash: {
                root: process.cwd(),
                directories: [],
                files: ["package.json", "yarn.lock", "webpack.config.ts", "webpack.tests.config.ts"],
            },
            // An object.
            info: {
                // 'none' or 'test'.
                mode: "test",
                // 'debug', 'log', 'info', 'warn', or 'error'.
                level: "log",
            }
        }));

        config.plugins.push(new ForkTsCheckerWebpackPlugin({
            checkSyntacticErrors: true,
            tsconfig: path.resolve(__dirname, "tsconfig.json"),
            workers: checkerThreads,
            watch: [ "src" ]
        }));

        config.plugins.push(new CleanWebpackPlugin("dist"));

        if(!debug) {
            config.plugins.push(new webpack.optimize.ModuleConcatenationPlugin());
        }
    }
};

const setSourceMaps = (debug: boolean, config: webpack.Configuration) => {
    if(config) {
        // sourcemaps can use plugin or devtool
        config.devtool = debug ? "source-map" : false;

        // the plugin gives you much more control
        // config.plugins.push(
        //     new webpack.SourceMapDevToolPlugin({
        //         filename: "[name].js.map", // (null) if no value is provided the sourcemap is inlined
        //         test: /\.(ts(x?)|js(x?))($|\?)/i
        //     })
        // );
    }
};

const setEnv = (debug: boolean) => {
    if(!debug) {
        process.env["BABEL_ENV"] = "production";
        process.env["NODE_ENV"] = "production";
    } else {
        process.env["BABEL_ENV"] = "development";
        process.env["NODE_ENV"] = "development";
    }
};

module.exports = (param: any): webpack.Configuration[] => {
    if(param && param.break) {
        debugger;
    }

    const debug = param && param.debug === "true";
    const minify = param && param.minify === "true";

    // build status
    global.app = {
        startDate: null,
        buildCount: 1,
    };

    console.log("running webpack config with:");
    console.log(`   debug = ${debug}`);
    console.log(`   minify = ${minify}`);
    setEnv(debug);

    const config = [
        Object.assign({}, webpackConfig, {
            target: "electron-main",
            entry: {
                main: "./src/main.ts"
            },
            stats: "errors-only"
        } as webpack.Configuration),
        Object.assign({}, webpackConfig, {
            target: "electron-renderer",
            entry: {
                gui: "./src/gui.tsx"
            },
            stats: "errors-only",
            plugins: [
                new HtmlWebpackPlugin({
                    template: "src/index.template.html",
                    inject: "body",
                    title: "Electron Test"
                })
            ]
        } as webpack.Configuration)
    ];

    config.forEach(c => setSourceMaps(debug, c));
    config.forEach(c => setBuildVariables(debug, c));
    config.forEach(c => setPlugins(debug, c));
    if(minify) {
        config.forEach(c => setMinify(debug, c));
    }

    return config;
};