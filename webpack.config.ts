import * as path from "path";
import * as webpack from "webpack";

const chalk = require("chalk");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const BabiliPlugin = require("babili-webpack-plugin");

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

const setBuildVariables = (debug: boolean, config: webpack.Configuration) => {
    if(config && config.plugins) {
        config.plugins.push(
            new webpack.DefinePlugin({
                __DEV__: JSON.stringify(debug)
            })
        );
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
                //"comments": false, // default leaves license info in place
            })
        );
    }
};

const setPlugins = (debug: boolean, config: webpack.Configuration) => {
    if(config && config.plugins) {
        config.plugins.push(
            function(this: any) {
                this.plugin("run", function(_compiler: any, callback: any) {
                    global.app.startDate = new Date();
                    console.log(chalk.green.bold(`\n${global.app.buildCount}: Start compile ${global.app.startDate.toTimeString().split(" ")[0]}`));
                    console.log(chalk.green.bold(JSON.stringify(Object.keys(_compiler.options.entry).join(", "), null, 2)));
                    callback();
                });

                this.plugin("watch-run", function(_watching: any, callback: any) {
                    global.app.startDate = new Date();
                    console.log(chalk.green.bold(`\n${global.app.buildCount}: Watch-start compile ${global.app.startDate.toTimeString().split(" ")[0]}`));
                    console.log(chalk.green.bold(JSON.stringify(Object.keys(_watching.options.entry).join(", "), null, 2)));
                    callback();
                });

                this.plugin("done", function(_stats: any) {
                    let curDate = new Date();
                    let diff = (curDate.getTime() - global.app.startDate.getTime()) / 1000.0;
                    console.log(chalk.green.bold(`\n${global.app.buildCount++}: End compile ${diff} seconds`));
                    console.log(chalk.green.bold(JSON.stringify(Object.keys(_stats.compilation.options.entry).join(", "), null, 2)));
                });
            }
        );
    }
};

const setSourceMaps = (config: webpack.Configuration) => {
    if(config && config.plugins) {
        config.plugins.push(
            new webpack.SourceMapDevToolPlugin({
                filename: null, // if no value is provided the sourcemap is inlined
                test: /\.(ts(x?)|js(x?))($|\?)/i
            })
        );
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
            //devtool: debug ? "inline-source-map" : undefined, // using plugin
            entry: {
                main: "./src/main.ts"
            },
            stats: "errors-only"
        } as webpack.Configuration),
        Object.assign({}, webpackConfig, {
            target: "electron-renderer",
            //devtool: debug ? "inline-source-map" : undefined, // using plugin
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

    if(minify) {
        config.forEach(c => setMinify(debug, c));
    }
    else if(debug) {
        config.forEach(c => setSourceMaps(c));
    }

    config.forEach(c => setBuildVariables(debug, c));
    config.forEach(c => setPlugins(debug, c));

    return config;
};