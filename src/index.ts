/**
 * @file index.ts
 * @author chaiyanchen@baidu.com
 */

import * as path from 'path';
import * as fs from 'fs';
import * as through from 'through2';
import * as gutil from 'gulp-util';
import { inlineToJs } from './inlineToJs';
import { inlineToTpl } from './inlineToTpl';
import { inlineToCss } from './inlineToCss';

interface parserOption {
    base: string,
    type: string,
    staticDomain: string,
    useHash: boolean,
    compress: boolean
}

function parseInline(options: parserOption) {
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

        if (file.isBuffer()) {
            switch (options.type) {
                case 'js':
                    inlineToJs.call(this, file, options);
                    break;
                case 'tpl':
                    inlineToTpl.call(this, file, options);
                    break;
                case 'css':
                    inlineToCss.call(this, file, options);
                    break;
            }
            this.push(file);
            cb();
        }
    })
}

export { parseInline };