import * as path from "path";
import * as fs from "fs";

const webPack = require("./webpack.config")({ debug: true });

const readDirRecursiveSync = (folder: string, filter: (v: string) => RegExpMatchArray | null): string[] => {
    const currentPath = fs.readdirSync(folder).map(f => path.join(folder, f));
    const files = currentPath.filter(filter);

    const directories = currentPath
        .filter(f => fs.statSync(f).isDirectory())
        .map(f => readDirRecursiveSync(f, filter))
        .reduce((cur, next) => [...cur, ...next], []);

    return [...files, ...directories];
};

const getEntries = (folder: string) =>
    readDirRecursiveSync(folder, f => f.match(/.*(tests|specs)\.tsx?$/))
        .map((file: string) => {
            return {
                name: path.basename(file, path.extname(file)),
                path: path.resolve(file)
            };
        }
    ).reduce((memo: any, file: any) => {
        memo[file.name] = file.path;
        return memo;
    }, {});

module.exports = [
    Object.assign({}, webPack[0], {entry: getEntries("./tests/host/")}),
    Object.assign({}, webPack[0], {entry: getEntries("./tests/gui/")})
].map(s => {
    s.output.path = path.resolve(__dirname, "__tests__");
    return s;
});