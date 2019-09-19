import * as path from 'path';
import * as fs from 'fs';
import * as gutil from 'gulp-util';
import { getMd5, writeMap, getFileDataFromResourceMap } from './utils';
import * as UglifyJS from 'uglify-js';
import { parseCss } from './parseCss';
import { parserOption } from '../global';
import Debug from 'debug';
let debug = Debug('inline:parseJs');
function parseJs(file: any, options: parserOption) {
    debug('input file', file.path);
    var content = '';
    if (file.contents) {
        content = file.contents.toString();
    }
    else if (fs.existsSync(file.path)) {
        debug('parse file exist', file.path);
        let fileParseData = getFileDataFromResourceMap(file.path, options.sourceMapPath);
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

    content = parseJSContent(content, options, file);
    content = content.replace(/('|")?(\/\/)?m.baidu.com\/se(\/)?('|")/, '$1/se$4');
    if ((options.unCompressFiles && options.compress && options.unCompressFiles.indexOf(file.path) === -1) || (options.compress && !options.unCompressFiles)) {
        content = UglifyJS.minify(content, {
            output: { max_line_len: 500 },
            compress: false,
            mangle: false
        }).code || content;
    }
    if ((options.unHashFiles && options.useHash && options.unHashFiles.indexOf(file.path) === -1) || (options.useHash && !options.unHashFiles)) {
        let md5Hash = getMd5(content, 7);
        let filename = path.basename(file.path);
        let dir;
        if (file.path[0] == '.') {
            dir = path.join(file.base, file.path);
        } else {
            dir = file.path;
        }
        dir = path.dirname(dir);
        filename = filename.split('.').map(function (item, i, arr) {
            return i == arr.length - 2 ? item + '_' + md5Hash : item;
        }).join('.');
        file.path = path.join(dir, filename);
        file.md5 = md5Hash;
    }
    file.contents = Buffer.from(content);

    return content;
}

function parseJSContent(content: string, options: parserOption, file: any) {
    debug('parse content', file.path);
    let reg = /(__inline)\s*\(\s*([^\)]+)\s*\)\s*[;]*/ig;
    if (reg.test(content)) {
        debug('parse content has inline', file.path);
        content = content.replace(reg, function (s, p, i) {
            var inlinecontent = '';
            if (s) {
                debug('parse content inline details', s);
                let regPath = i.replace(/(^\/?['"]*)\/?|(['"]*$)/g, '');
                let filePath;
                if (regPath.match(/^\./)){
                    filePath = path.resolve(path.dirname(file.path), regPath);
                } else {
                    filePath = path.resolve(path.resolve(options.base, regPath));
                }
                debug('parse content inline file', filePath);
                //没有后缀名的默认补.js
                if (path.extname(filePath) === '') {
                    filePath += '.js';
                }
                if (!fs.existsSync(filePath)) {
                    filePath = path.resolve(path.join(path.dirname(file.path), regPath));
                }

                if (fs.existsSync(filePath)) {
                    // 判断inline的文件的后缀名，无后缀增加js后缀并inline
                    switch (path.extname(filePath)) {
                        case '.js':
                            inlinecontent += parseJs({ path: filePath }, options);
                            break;
                        case '.etpl':
                            inlinecontent += JSON.stringify(fs.readFileSync(filePath).toString().replace(/\r\n/g, '\n'));
                            break;
                        case '.css':
                            inlinecontent += JSON.stringify(parseCss({ path: filePath }, options).toString().replace(/\r\n/g, '\n'));
                            break;
                        default:
                            inlinecontent += JSON.stringify(fs.readFileSync(filePath).toString().replace(/\r\n/g, '\n'));
                            break;
                    }
                } else {
                    gutil.log(gutil.colors.blue('parseJS Erorr:'), gutil.colors.green('not find' + i));
                }
            }

            return inlinecontent;
        });
    }

    return content;
}

export { parseJs, parseJSContent }