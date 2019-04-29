import * as crypto from 'crypto';

function isInline(url: string) {
    return /[?&]__inline(?:[=&'"]|$)/.test(url);
}

function getMd5(data: string, len: number) {
    let md5sum = crypto.createHash('md5');
    md5sum.update(data, 'utf8');
    len = len || 7;
    return md5sum.digest('hex').substring(0, len);
}

function getBase64(data: string|Buffer|any[]) {
    if (data instanceof Buffer) {
        //do nothing for quickly determining.
    } else if (data instanceof Array) {
        data = new Buffer(data);
    } else {
        //convert to string.
        data = new Buffer(String(data || ''));
    }
    return data.toString('base64');
}

export {
    isInline,
    getMd5,
    getBase64
}