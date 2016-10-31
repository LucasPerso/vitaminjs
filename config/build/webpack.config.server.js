import { optimize, BannerPlugin, DefinePlugin } from 'webpack';
import mergeWith from 'lodash.mergewith';
import fs from 'fs';
import { config, createBabelLoaderConfig } from './webpack.config.common';
import { vitaminResolve, appResolve, concat } from '../utils';
import appConfig from '../index';

const safeReaddirSync = (path) => {
    try {
        return fs.readdirSync(path);
    } catch (e) {
        return [];
    }
};

const externalModules = modulesPath => safeReaddirSync(modulesPath).filter(m => m !== '.bin');
const appModules = externalModules(appResolve('node_modules'));
const vitaminModules = externalModules(vitaminResolve('node_modules'));
const hotPoll = vitaminResolve('config', 'utils', 'customHotPoll.js?1000');

function externals(context, request, callback) {
    const pathStart = request.split('/')[0];

    if (appModules.indexOf(pathStart) !== -1) {
        return callback(null, `commonjs2 ${request}`);
    }
    if (vitaminModules.indexOf(pathStart) !== -1) {
        return callback(null, `commonjs2 vitaminjs/node_modules/${request}`);
    }
    return callback();
}


module.exports = function serverConfig(options) {
    return mergeWith({}, config(options), {
        entry: [
            ...(options.hot ? [hotPoll] : []),
            vitaminResolve('src', 'server', 'server.js'),
        ],
        output: {
            filename: appConfig.server.filename,
            path: appConfig.server.buildPath,
            libraryTarget: 'commonjs2',
        },

        target: 'node',
        externals,
        node: {
            console: false,
            global: false,
            process: false,
            Buffer: false,
            __filename: false,
            __dirname: false,
        },

        module: {
            rules: [createBabelLoaderConfig('server')],
        },
        plugins: [
            new optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
            ...(options.dev ? [new BannerPlugin({
                banner: 'require("source-map-support").install();',
                raw: true,
                entryOnly: false,
            })] : []),
            new DefinePlugin({
                ASSETS_BY_CHUNK_NAME: JSON.stringify(options.assetsByChunkName),
            }),
        ],
    }, concat);
};
