import * as crypto from 'crypto';
import * as fs from 'fs';
import Debug from 'debug';
let debug = Debug('inline:utils');
function isInline(url: string) {
    return /[?&]__inline(?:[=&'"]|$)/.test(url);
}

function getMd5(data: string, len: number = 7) {
    let md5sum = crypto.createHash('md5');
    md5sum.update(data, 'utf8');
    return md5sum.digest('hex').substring(0, len);
}
function getFileDataFromResourceMap(key: string, sourceMapPath: string): any {
    key = key.indexOf('www-wise/') !== -1 ? key.split('www-wise/')[1] : key;
    if (fs.existsSync(sourceMapPath)) {
        let fileContent = fs.readFileSync(sourceMapPath, 'utf-8');
        let fileObj = JSON.parse(fileContent ? fileContent : '{}');
        debug('getFileData', fileObj[key] ? fileObj[key] : 'null');
        return fileObj[key] ? fileObj[key] : {};
    }
    return {};
}
function writeMap(key: string, value: fileInfo, sourceMapPath: string) {
    let obj = {};
    if (fs.existsSync(sourceMapPath)) {
        obj = JSON.parse(fs.readFileSync(sourceMapPath).toString());
    }
    // if (value.md5) {
        obj[key] = value;
    // } else {
        // obj[key] = { md5: 'null', output: key.replace('src/', 'output/'), inline:  };
    // }
    debug('writeMap', obj[key].output);
    fs.writeFileSync(sourceMapPath, JSON.stringify(obj), 'utf-8');
}
function getBase64(data: string | Buffer | any[]) {
    if (data instanceof Buffer) {
        //do nothing for quickly determining.
    } else if (data instanceof Array) {
        data = Buffer.from(data);
    } else {
        //convert to string.
        data = Buffer.from(String(data || ''));
    }
    return data.toString('base64');
}
function modifyUrl(content: string, prefix: string, sourceMapPath?: string) {
    if (sourceMapPath) {
        content = content.replace(/(href=|src=)('|")(\/static\/\S+\.[a-zA-Z]+)('|")/g, (all, href, quote, value) => {
            let fileMd5 = getFileDataFromResourceMap('src' + value, sourceMapPath).md5;
            value = value.replace(/(\.[a-zA-Z]+)/g, `_${fileMd5}$1`);
            return href + quote + prefix + value + quote;
        });
    }
    content = content.replace(/url\(('|")?(\/static)(.*)\.(png|jpg|gif|jpeg)('|")?\)/ig, `url($1${prefix}$2$3.$4$5)`);
    return content;
}
interface fileInfo {
    md5:string;
    output:string;
    moduleId:string;
    dependences:[string];
    inline:[string];
    lsInline:[string];
    depFiles:[string];
    mtimeMs: number;
}
export {
    isInline,
    getMd5,
    getBase64,
    modifyUrl,
    writeMap,
    getFileDataFromResourceMap
}
