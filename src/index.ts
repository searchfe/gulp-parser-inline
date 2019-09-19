/**
 * @file index.ts
 * @author chaiyanchen@baidu.com
 */

import * as path from 'path';
import * as through from 'through2';
import * as gutil from 'gulp-util';
import { parseJs } from './parseJs';
import { parseTpl } from './parseTpl';
import { parseCss } from './parseCss';
import { parserOption } from '../global';
import { writeMap } from './utils';
import Debug from 'debug';
let debug = Debug('inline:index');
function parseInline(options: parserOption) {
    gutil.log('write source map to ', options.sourceMapPath);
    return through.obj(function (file, enc, cb) {
        // 如果文件为空，不做任何操作，转入下一个操作，即下一个 .pipe()
        if (file.isNull()) {
            this.emit('error', new gutil.PluginError('files can not be empty'));
            return cb();
        }

        // 插件不支持对 Stream 对直接操作，跑出异常
        if (file.isStream()) {
            this.emit('error', new gutil.PluginError('Streaming not supported'));
            return cb();
        }
        let oldFilePath = file.path;
        if (file.isBuffer()) {
            debug('input file', file.path, options.useHash);
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
            this.push(file);
            writeMap(path.relative(process.cwd(), oldFilePath), file.md5, options.sourceMapPath);
            cb();
        }
    })
}

export { parseInline, parserOption };