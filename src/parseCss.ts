import * as path from 'path';
import * as fs from 'fs';
import * as gutil from 'gulp-util';
import { isInline, getBase64, getMd5, modifyUrl, writeMap, getFileDataFromResourceMap } from './utils';

import * as CleanCSS from 'clean-css';
import * as less from 'less';
import { parserOption } from '../global';
import Debug from 'debug';
const debug = Debug('inline:parseCss');
function parseCss (file: any, options: parserOption) {
    debug('input file', file.path);
    let content = '';
    if (file.contents) {
        content = file.contents.toString();
    } else if (fs.existsSync(file.path)) {
        debug('parse file exist', file.path);
        const fileParseData = getFileDataFromResourceMap(file.path, options.sourceMapPath);
        if (fileParseData.md5 && fs.existsSync(path.resolve(process.cwd(), fileParseData.output))) {
            debug('the had parsed', file.path, 'read', path.resolve(process.cwd(), fileParseData.output));
            content = fs.readFileSync(path.resolve(process.cwd(), fileParseData.output), 'utf-8');
            return content;
        } else {
            debug('read file', file.path);
            content = fs.readFileSync(file.path, 'utf-8');
        }
    }

    if (!content) {
        return content;
    }

    if (path.extname(file.path) === '.less') {
        file.path = file.path.replace('.less', '.css');
        content = parseLess(content);
    }
    content = parseCssContent(content, options, file);
    content = modifyUrl(content, options.staticDomain);
    if ((options.unCompressFiles && options.compress && options.unCompressFiles.indexOf(file.path) === -1) || (options.compress && !options.unCompressFiles)) {
        content = new CleanCSS({ format: 'keep-breaks' }).minify(content).styles;
    }
    if ((options.unHashFiles && options.useHash && options.unHashFiles.indexOf(file.path) === -1) || (options.useHash && !options.unHashFiles)) {
        const md5Hash = getMd5(content, 7);
        let filename = path.basename(file.path);
        let dir;
        if (file.path[0] === '.') {
            dir = path.join(file.base, file.path);
        } else {
            dir = file.path;
        }
        dir = path.dirname(dir);
        filename = filename.split('.').map(function (item, i, arr) {
            return i === arr.length - 2 ? item + '_' + md5Hash : item;
        }).join('.');
        file.path = path.join(dir, filename);
        file.md5 = md5Hash;
    }
    file.contents = Buffer.from(content);
    return content;
}

function parseLess (content) {
    debug('parse less content');
    less.render(content.toString(),
        function (e, output) {
            content = output && output.css ? output.css : '';
        });
    return content;
}

function parseCssContent (content: string, options: parserOption, file: any) {
    debug('parse content', file.path);
    /* eslint-disable */
    const reg = /@import\s*url\(\s*['"]?\/?([^\)]+?)(\?__inline)?['"]?\s*\)\s*[;]*/ig;
    /* eslint-enable */
    content = content.replace(reg, function (s, p, i) {
        let inlinecontent = '';
        if (i) {
            debug('parse content has inline:', i);
            let filePath = path.resolve(path.join(options.base, p));
            if (!fs.existsSync(filePath)) {
                filePath = path.resolve(path.join(path.dirname(file.path), p));
            }
            if (!fs.existsSync(filePath)) {
                debug('warning: "the file "', filePath, ' is not exists');
            } else {
                debug('parse content inline file', filePath);
                inlinecontent += parseCss({ path: filePath }, options);
                if (!file.inline) {
                    file.inline = [];
                }
                file.inline.push(filePath);
            }
        }
        return inlinecontent;
    });

    const imgInlineReg = /url\(\/?(.+\.png)\?(__inline).*\)/ig;
    content = content.replace(imgInlineReg, function (s, p, i) {
        debug('parse img inline');
        let filePath = path.resolve(path.join(options.base, p));
        if (!fs.existsSync(filePath)) {
            filePath = path.resolve(path.join(path.dirname(file.path), p));
        }
        if (!fs.existsSync(filePath)) {
            debug('warning: "the file "', filePath, ' is not exists');
            gutil.log(gutil.colors.cyan('warning:'), gutil.colors.red('the file ' + filePath + ' is not exists'));
            return '';
        } else {
            const prefix = 'data:image/' + path.extname(filePath).substring(1) + ';base64,';
            const base64String = getBase64(fs.readFileSync(filePath)) || '';
            if (!file.inline) {
                file.inline = [];
            }
            file.inline.push(filePath);
            return `url(${prefix}${base64String})`;
        }
    });

    return content;
}

export { parseCss, parseCssContent };
