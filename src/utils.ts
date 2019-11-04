import * as crypto from 'crypto';
import * as fs from 'fs';
import Debug from 'debug';
import * as path from 'path';
import * as parseJson from 'fast-json-parse';
import * as fastJson from 'fast-json-stringify';
const stringify = fastJson({
    title: 'Example Schema',
    type: 'object'
});
const debug = Debug('inline:utils');
function isInline (url: string) {
    return /[?&]__inline(?:[=&'"]|$)/.test(url);
}

function getMd5 (data: string, len: number = 7) {
    const md5sum = crypto.createHash('md5');
    md5sum.update(data, 'utf8');
    return md5sum.digest('hex').substring(0, len);
}
function getFileDataFromResourceMap (key: string, sourceMapPath: string): any {
    console.time('read source');
    key = path.relative(process.cwd(), key);
    if (fs.existsSync(sourceMapPath)) {
        const fileContent = fs.readFileSync(sourceMapPath, 'utf-8');
        const fileObj = parseJson(fileContent || '{}');
        debug('getFile: ' + key + '; Data: ', fileObj[key] ? fileObj[key] : 'null');
        console.timeEnd('read source');
        return fileObj[key] ? fileObj[key] : {};
    }
    console.timeEnd('read source');
    return {};
}
function writeMap (key: string, value: fileInfo, sourceMapPath: string) {
    console.time('writeMap');
    let obj = {};
    if (fs.existsSync(sourceMapPath)) {
        obj = parseJson(fs.readFileSync(sourceMapPath).toString());
    }
    // if (value.md5) {
    obj[key] = value;
    // } else {
    // obj[key] = { md5: 'null', output: key.replace('src/', 'output/'), inline:  };
    // }
    debug('writeFile: ' + key + '; data: ', obj[key].output);
    fs.writeFileSync(sourceMapPath, stringify(obj), 'utf-8');
    console.timeEnd('writeMap');
}
function getBase64 (data: string | Buffer | any[]) {
    if (data instanceof Buffer) {
        // do nothing for quickly determining.
    } else if (data instanceof Array) {
        data = Buffer.from(data);
    } else {
        // convert to string.
        data = Buffer.from(String(data || ''));
    }
    return data.toString('base64');
}
function modifyUrl (content: string, prefix: string, sourceMapPath?: string) {
    if (sourceMapPath) {
        content = content.replace(/(href=|src=)('|")(\/static\/\S+\.[a-zA-Z]+)('|")/g, (all, href, quote, value) => {
            const fileMd5 = getFileDataFromResourceMap(path.resolve(process.cwd(), 'src' + value), sourceMapPath).md5;
            if (fileMd5) {
                value = value.replace(/(\.[a-zA-Z]+)/g, `_${fileMd5}$1`);
            } else {
                value = value.replace(/(\.[a-zA-Z]+)/g, `_$1`);
            }
            return href + quote + prefix + value + quote;
        });
    }
    content = content.replace(/url\(('|")?(\/static)(.*)\.(png|jpg|gif|jpeg)('|")?\)/ig, `url($1${prefix}$2$3.$4$5)`);
    return content;
}
interface fileInfo {
    md5: string;
    output: string;
    moduleId: string;
    dependences: [string];
    inline: [string];
    lsInline: [string];
    depFiles: [string];
    mtimeMs: number;
}
export {
    isInline,
    getMd5,
    getBase64,
    modifyUrl,
    writeMap,
    getFileDataFromResourceMap
};
