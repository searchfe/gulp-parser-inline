import * as path from 'path';
import * as fs from 'fs';
import * as gutil from 'gulp-util';
import { parseJs, parseJSContent } from './parseJs';
import { parseCss, parseCssContent } from './parseCss';
import { modifyUrl, getFileDataFromResourceMap } from './utils';
import { parserOption } from '../global';
import Debug from 'debug';
const debug = Debug('inline:parseTpl');
function parseTpl (file: any, options: parserOption) {
    debug('input file', file.path);
    let content = '';
    if (file.contents) {
        content = file.contents.toString();
    } else if (fs.existsSync(file.path)) {
        content = fs.readFileSync(file.path, 'utf-8');
    }

    if (!content) {
        return content;
    }

    content = parseCssContent(content, options, file);

    content = parseJSContent(content, options, file);

    content = parseTplContent(content, options, file);

    file.contents = Buffer.from(content);
    return content;
}

// 处理内联文件
function parseTplContent (content: string, options: parserOption, file: any) {
    // 处理<link rel="stylesheet" type="text/css"> 这种内联的方式，如果在属性加上?__inline则表示需要内联。
    debug('parse tpl inline', file.path);
    const linkReg = /<link.*href\s*=\s*('|")\/?(.+)\?(__lsInline|__inline)\1.*>/ig;
    content = content.replace(linkReg, function (all, quote, value, type) {
        let inlinecontent = '';
        if (type) {
            switch (type) {
            case '__lsInline':
                debug('link lsInline', file.path);
                let lsPath = path.resolve(path.join(options.base, value));
                if (!fs.existsSync(lsPath)) {
                    lsPath = path.resolve(path.join(path.dirname(file.path), value));
                }
                if (fs.existsSync(lsPath)) {
                    const tmpPath = value.split('/');
                    const name = tmpPath[tmpPath.length - 1].replace('.', '');
                    const key = name.replace('.', '');
                    const type = path.extname(lsPath).replace('.', '').replace(/less/, 'css');
                    const content = parseCss({ path: lsPath }, options);
                    const hash = getFileDataFromResourceMap(lsPath, options.sourceMapPath).md5;
                    const srcPath = (options.staticDomain ? options.staticDomain : '') + '/se/' + value.replace(/(\.[a-zA-Z]+)$/, '') + '_' + hash + '.css';
                    const captureStr = '{%capture name ="' + name + '"%}' + content + '{%/capture%}';
                    const feLsInlineStr = '{%fe_ls_inline codeConf=["type"=>"' + type + '"' +
                            ',"code"=>$smarty.capture.' + name +
                            ',"key"=>"' + key + '"' +
                            ',"path"=>"' + srcPath + '"' +
                            ',"version"=>"' + hash + '"] lsControl=$lsControl%}';
                    inlinecontent += captureStr + feLsInlineStr;
                    if (!file.lsInline) {
                        file.lsInline = [];
                    }
                    file.lsInline.push(lsPath);
                }
                break;
            case '__inline':
                debug('link inline', file.path);
                let filePath = path.resolve(path.join(options.base, value));
                if (!fs.existsSync(filePath)) {
                    filePath = path.resolve(path.join(path.dirname(file.path), value));
                }
                inlinecontent += parsefile(filePath, options, 'link', file);
                break;
            }
        }
        return inlinecontent;
    });

    // 处理<script src=""> 这种src方式。
    const scriptReg = /<script.*src\s*=\s*('|")\/?(.+)\?(__lsInline|__inline)\1[^>]*>[\s\S]*?<\/script>/ig;

    content = content.replace(scriptReg, function (all, quote, value, type) {
        let inlinecontent = '';
        if (type) {
            switch (type) {
            case '__lsInline':
                debug('script lsInline', file.path);
                let lsPath = path.resolve(path.join(options.base, value));
                if (!fs.existsSync(lsPath)) {
                    lsPath = path.resolve(path.join(path.dirname(file.path), value));
                }
                if (fs.existsSync(lsPath)) {
                    const tmpPath = value.split('/');
                    const name = tmpPath[tmpPath.length - 1].replace('.', '');
                    const key = name.replace('.', '');
                    const type = 'js';
                    const content = parseJs({ path: lsPath }, options);
                    const hash = getFileDataFromResourceMap(lsPath, options.sourceMapPath).md5;
                    const srcPath = (options.staticDomain ? options.staticDomain : '') + '/se/' + value.replace(/(\.[a-zA-Z]+)$/, '') + '_' + hash + '.js';
                    const captureStr = '{%capture name ="' + name + '"%}' + content + '{%/capture%}';
                    const feLsInlineStr = '{%fe_ls_inline codeConf=["type"=>"' + type + '"' +
                            ',"code"=>$smarty.capture.' + name +
                            ',"key"=>"' + key + '"' +
                            ',"path"=>"' + srcPath + '"' +
                            ',"version"=>"' + hash + '"] lsControl=$lsControl%}';
                    inlinecontent += captureStr + feLsInlineStr;
                    if (!file.lsInline) {
                        file.lsInline = [];
                    }
                    file.lsInline.push(lsPath);
                }
                break;
            case '__inline':
                debug('inline', file.path);
                const jsPath = path.resolve(path.join(options.base, value));
                inlinecontent += parsefile(jsPath, options, 'script', file);
                break;
            }
        }
        return inlinecontent;
    });
    content = modifyUrl(content, options.staticDomain, options.sourceMapPath);
    return content;
}

function parsefile (filePath: string, options: parserOption, type:string, file: any) {
    debug('parse file', filePath);
    let inlinecontent = '';
    if (fs.existsSync(filePath)) {
        // 判断inline的文件的后缀名，无后缀增加js后缀并inline
        switch (path.extname(filePath)) {
        case '.tpl':
            inlinecontent += parseTpl({ path: filePath }, options);
            break;
        case '.css':
            inlinecontent += '<style type="text/css">\n' + parseCss({ path: filePath }, options) + '\n</style>';
            break;
        case '.less':
            inlinecontent += '<style type="text/css">\n' + parseCss({ path: filePath }, options) + '\n</style>';
            break;
        case '.js':
            const jsContent = parseJs({ path: filePath }, options);
            // 把文件内容放到script标签 中间
            return type === 'script' ? '<script type="text/javascript">\n' + jsContent + '\n</script>' : jsContent;
        }
        if (!file.inline) {
            file.inline = [];
        }
        file.inline.push(filePath);
    } else {
        gutil.log(filePath);
    }
    return inlinecontent;
}

export { parseTpl };
