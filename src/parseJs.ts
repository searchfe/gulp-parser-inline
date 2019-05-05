import * as path from 'path';
import * as fs from 'fs';
import * as gutil from 'gulp-util';
import { getMd5 } from "./utils";

interface parserOption {
    base: string,
    type: string,
    staticDomain: string,
    useHash: boolean
}

function parseJs(file: any, options: parserOption) {
    var content = '';
    if (file.contents) {
        content = file.contents.toString();
    }
    else if (fs.existsSync(file.path)) {
        content = fs.readFileSync(file.path, 'utf-8');
    }

    if (!content) {
        return content;
    }

    content = parseJSContent(content, options, file);

    if (options.useHash) {
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
    }

    file.contents = new Buffer(content);

    return content;
}

function parseJSContent(content: string, options: parserOption, file: any) {

    let reg = /(__inline)\s*\(\s*([^\)]+)\s*\)\s*[;]*/ig;

    if (reg.test(content)) {
        content = content.replace(reg, function (s, p, i) {
            var inlinecontent = '';
            if (s) {
                let regPath = i.replace(/(^['"]*)|(['"]*$)/g, '');
                let filePath = path.resolve(path.join(options.base, regPath));
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