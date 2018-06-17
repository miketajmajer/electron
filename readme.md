# Electron Sample with Typescript Tooling

## A webpack configuration for high performance

### Webpack using TypeScript Config

Using ts-node makes this pretty easy.

Have debug-build target to debug the webpack config.

### TypeScript build speed

Using ts-loader with HappyPack for multi-treaded builds.  Using HardSource webpack-plugin for caching.

### Deadcode and such
Using Babili to minimize and (more importantly) to remove dead code.  I'm generating ES2018, and this does a good job with it.

Babili doesn't work with sourcemaps - the maps are there, but are broken.

### Bugs
    Need to set this version of webpack-sources to fix an issue with sourcemap build
    "webpack-sources": "1.0.1"

### Testing

Using Jest with Enzyme (snapshots!).

## Note: how to use react dev tools for electron:
https://github.com/firejune/electron-react-devtools

Then execute the following from the Console tab of your running Electron app's developer tools:

`require('electron-react-devtools').install()`

And than refresh or restart the renderer process, you can see a React tab added.

## Some Links that I pulled information from

https://blog.scottlogic.com/2017/06/06/typescript-electron-webpack.html

https://github.com/Microsoft/vscode-recipes/tree/master/Electron

https://electronjs.org/docs/tutorial/application-distribution

https://scotch.io/@rui/how-to-build-a-cross-platform-desktop-application-with-electron-and-net-core

https://github.com/TypeStrong/ts-loader/tree/master/examples/happypack

https://github.com/Realytics/fork-ts-checker-webpack-plugin