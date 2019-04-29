import * as path from 'path';
import * as fs from 'fs';
import * as gutil from 'gulp-util';
import { isInline, getBase64 } from './utils';
import { getMd5 } from './utils';
import * as CleanCSS from 'clean-css';

interface parserOption {
    base: string,
    type: string,
    staticDomain: string,
    useHash: boolean,
    compress: boolean
}

function inlineToCss(file: any, options: parserOption) {
    let content = '';
    if (file.contents) {
        content = file.contents.toString();
    }
    else if (fs.existsSync(file.path)) {
        content = fs.readFileSync(file.path, 'utf-8');
    }

    if (!content) {
        return content;
    }

    content = parseCssContent(content, options, file);

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

    if (options.compress) {
        content = new CleanCSS().minify(content).styles;
    }

    file.contents = new Buffer(content);
    return content;
}

function parseCssContent(content: string, options: parserOption, file: any) {
    let reg = /@import\s*url\(\s*['"]?([^\)]+?)(\?__inline)?['"]?\s*\)\s*[;]*/ig;
    content = content.replace(reg, function (s, p, i) {
        let inlinecontent = '';
        if (i) {
            let filePath = path.resolve(path.join(options.base, p));
            if (!fs.existsSync(filePath)) {
                filePath = path.resolve(path.join(path.dirname(file.path), p));
            } 
            if (!fs.existsSync(filePath)) {
                gutil.log(gutil.colors.cyan('warning:'), gutil.colors.red("the file " + filePath + " is not exists"));
            } else {
                inlinecontent += inlineToCss({ path: filePath }, options);
            }
        }
        
        return inlinecontent;
    });

    let imgInlineReg = /url\((.+\.png)\?(__inline).*\)/ig;
    content = content.replace(imgInlineReg, function (s, p, i) {
        
        let filePath = path.resolve(path.join(options.base, p));
        if (!fs.existsSync(filePath)) {
            filePath = path.resolve(path.join(path.dirname(file.path), p));
        }
        if (!fs.existsSync(filePath)) {
            gutil.log(gutil.colors.cyan('warning:'), gutil.colors.red("the file " + filePath + " is not exists"));
            return '';
        } else {
            let prefix = 'data:' + path.extname(filePath).substring(1) + ';base64,';
            let base64String = getBase64(fs.readFileSync(filePath)) || '';
            return `url(${prefix}${base64String})`;
        }
    })

    return content;
}

export { inlineToCss, parseCssContent }