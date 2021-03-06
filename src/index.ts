/**
 * @file index.ts
 * @author chaiyanchen@baidu.com
 */

import * as path from 'path';
import { File, log, PluginError } from 'gulp-util';
import { parseJs } from './parseJs';
import { parseTpl } from './parseTpl';
import { parseCss } from './parseCss';
import { parserOption } from '../global';
import { parseSan } from './san-inline';
import { writeMap } from './utils';
import Debug from 'debug';
import { Transform } from 'gulp-transform-cache';
const debug = Debug('inline:index');
class Inline extends Transform {}
function parseInline (options: parserOption) {
    log('write source map to ', options.sourceMapPath);
    return new Inline({
        objectMode: true,
        transform: (file: File, enc, cb: Function) => {
            // 如果文件为空，不做任何操作，转入下一个操作，即下一个 .pipe()
            if (file.isNull()) {
                this.emit('error', new PluginError('files can not be empty'));
                return cb(null, file);
            }

            // 插件不支持对 Stream 对直接操作，跑出异常
            if (file.isStream()) {
                this.emit('error', new PluginError('Streaming not supported'));
                return cb(null, file);
            }
            const oldFilePath = file.path;
            if (file.isBuffer()) {
                debug('input file', file.path, options.useHash);
                // const fileCache = getFileDataFromResourceMap(file.path, options.sourceMapPath);
                // if (file && file.stat && fileCache && fileCache.mtimeMs === file.stat.mtimeMs && fileCache.depFiles && fileCache.depFiles.length === 0) {
                //     cb();
                // }
                // else {
                file.lsInline = [];
                file.inline = [];
                options = Object.assign({
                    base: path.resolve('./src/'),
                    staticDomain: '',
                    useHash: false,
                    compress: false,
                    eslBase: '/se'
                }, options);
                switch (path.extname(file.path)) {
                case '.js':
                    parseJs(file, options);
                    break;
                case '.tpl':
                    parseTpl(file, options);
                    break;
                case '.css':
                    parseCss(file, options);
                    break;
                case '.less':
                    parseCss(file, options);
                    break;
                }
                const key = path.relative(process.cwd(), oldFilePath);
                file.depFiles = Array.from(new Set([...file.inline, ...file.lsInline]));
                writeMap(key, { md5: file.md5, output: path.resolve(process.cwd(), file.path).replace(/src\//, 'output/'), moduleId: file.moduleId, dependences: file.dependences, inline: file.inline, lsInline: file.lsInline, depFiles: file.depFiles, mtimeMs: file && file.stat ? file.stat.mtimeMs : 0 }, options.sourceMapPath);
                cb(null, file);
                // }
            }
        }
    });
}

export { parseInline, parserOption, parseSan };
