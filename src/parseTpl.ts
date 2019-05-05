import * as path from 'path';
import * as fs from 'fs';
import * as gutil from 'gulp-util';
import { parseJs, parseJSContent } from './parseJs';
import { parseCss, parseCssContent } from './parseCss';
import { getMd5 } from './utils';

interface parserOption {
    base: string,
    type: string,
    staticDomain: string,
    useHash: boolean,
    compress: boolean
}

function parseTpl(file: any, options: parserOption) {
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

    content = parseJSContent(content, options, file);

    content = parseTplContent(content, options, file);

    file.contents = new Buffer(content);
    return content;
}


// 处理内联文件
function parseTplContent(content: string, options: parserOption, file: any) {
    // 处理<link rel="stylesheet" type="text/css"> 这种内联的方式，如果在属性加上?__inline则表示需要内联。
    let linkReg = /<link.*href\s*=\s*('|")(.+)\?(__lsInline|__inline)\1.*>/ig;
    content = content.replace(linkReg, function (all, quote, value, type) {
        let inlinecontent = '';
        if (type) {
            switch (type) {
                case '__lsInline':
                    let lsPath = path.resolve(path.join(options.base, value));
                    if (!fs.existsSync(lsPath)) {
                        lsPath = path.resolve(path.join(path.dirname(file.path), value));
                    }
                    if (fs.existsSync(lsPath)) {
                        let tmpPath = value.split('/');
                        let name = tmpPath[tmpPath.length - 1].replace('.', '');
                        let key = name.replace('.', '');
                        let type = path.extname(lsPath);
                        let content = parseCss({path: lsPath}, options);
                        let hash = getMd5(content, 7);
                        let srcPath = (options.staticDomain ? options.staticDomain : '') + '/se' + value.substring(0, value.length - 4) + '_' + hash + '.css';
                        let captureStr = '{%capture name ="' + name + '"%}' + content + '{%/capture%}';
                        let feLsInlineStr = '{%fe_ls_inline codeConf=["type"=>"' + type + '"'
                            + ',"code"=>$smarty.capture.' + name
                            + ',"key"=>"' + key + '"'
                            + ',"path"=>"' + srcPath + '"'
                            + ',"version"=>"' + hash + '"] lsControl=$lsControl%}';
                        inlinecontent += captureStr + feLsInlineStr;
                    }
                    break;
                case '__inline':
                    let filePath = path.resolve(path.join(options.base, value));
                    if (!fs.existsSync(filePath)) {
                        filePath = path.resolve(path.join(path.dirname(file.path), value));
                    }
                    inlinecontent += parsefile(filePath, options);
                    break;
            }
        }
        return inlinecontent;
    });

    // 处理<script src=""> 这种src方式。
    let scriptReg = /<script.*src\s*=\s*('|")(.+)\?(__lsInline|__inline)\1[^>]*>[\s\S]*?<\/script>/ig;

    content = content.replace(scriptReg, function (all, quote, value, type) {
        let inlinecontent = '';
        if (type) {
            switch (type) {
                case '__lsInline':
                    let lsPath = path.resolve(path.join(options.base, value));
                    if (!fs.existsSync(lsPath)) {
                        lsPath = path.resolve(path.join(path.dirname(file.path), value));
                    }
                    if (fs.existsSync(lsPath)) {
                        let tmpPath = value.split('/');
                        let name = tmpPath[tmpPath.length - 1].replace('.', '');
                        let key = name.replace('.', '');
                        let type = 'js';
                        let content = parseJs({ path: lsPath }, options);
                        let hash = getMd5(content, 7);
                        let srcPath = (options.staticDomain ? options.staticDomain : '') + '/se' + value.substring(0, value.length - 3) + '_' + hash + '.js';
                        let captureStr = '{%capture name ="' + name + '"%}' + content + '{%/capture%}';
                        let feLsInlineStr = '{%fe_ls_inline codeConf=["type"=>"' + type + '"'
                            + ',"code"=>$smarty.capture.' + name
                            + ',"key"=>"' + key + '"'
                            + ',"path"=>"' + srcPath + '"'
                            + ',"version"=>"' + hash + '"] lsControl=$lsControl%}';
                        inlinecontent += captureStr + feLsInlineStr;
                    }
                    break;
                case '__inline':
                    let jsPath = path.resolve(path.join(options.base, value));
                    inlinecontent += parsefile(jsPath, options);
                    break;
            }
        }
        return inlinecontent;
    });
    return content;
}

function parsefile(filePath: string, options: parserOption) {
    let inlinecontent = '';
    if (fs.existsSync(filePath)) {
        // 判断inline的文件的后缀名，无后缀增加js后缀并inline
        switch (path.extname(filePath)) {
            case '.tpl':
                inlinecontent += parseTpl({ path: filePath }, options);
                break;
            case '.css':
                inlinecontent += '<style type="text/css">' + fs.readFileSync(filePath) + '</style>';
                break;
            case '.js':
                let jsContent = parseJs({ path: filePath }, options);
                //把文件内容放到script标签 中间
                return '<script type="text/javascript">\n' + jsContent + '</script>';
        }
    } else {
        gutil.log(filePath);
    }
    return inlinecontent;
}

export { parseTpl }