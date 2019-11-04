import { minify } from 'html-minifier';
import * as through from 'through2';
import * as fs from 'fs';
import * as path from 'path';
import { File, PluginError } from 'gulp-util';
interface sanOption {
    basePath: string;
    minify?: boolean;
    minifyConfig?: any;
}
function parseSan (option: sanOption) {
    return through.obj(function (file, enc, cb) {
        // 如果文件为空，不做任何操作，转入下一个操作，即下一个 .pipe()
        if (file.isNull()) {
            this.emit('error', new PluginError('files can not be empty'));
            return cb();
        }

        // 插件不支持对 Stream 对直接操作，跑出异常
        if (file.isStream()) {
            this.emit('error', new PluginError('Streaming not supported'));
            return cb();
        }
        if (file.isBuffer()) {
            const inputContents = file.contents ? file.contents.toString() : '';
            const content = parseInline(inputContents, file.path, option);
            file.contents = Buffer.from(content);
            this.push(file);
            cb();
        }
    });
};
function parseInline (content: string, inputPath: string, option: sanOption): string {
    /* eslint-disable */
    const reg = /import\s+(\S+)\s+from\s+['|"](\S+)\!text['|"]\;/ig;
    /* eslint-enable */
    if (reg.test(content)) {
        content = content.replace(reg, function (s, p, i) {
            let inlinecontent = '';
            if (s) {
                const regPath = i.replace(/(^\/?['"]*)\/?|(['"]*$)/g, '');
                let filePath;
                if (regPath.match(/^\./)) {
                    filePath = path.resolve(path.dirname(inputPath), regPath);
                } else {
                    filePath = path.resolve(option.basePath, regPath);
                }
                if (option.minify) {
                    const minifyConfig = option.minifyConfig ? option.minifyConfig : {
                        minifyCss: true,
                        minifyJs: true,
                        removeComments: true,
                        collapseWhitespace: true,
                        removeTagWhitespace: true
                    };
                    inlinecontent += `const ${p} = ${JSON.stringify(minify(fs.readFileSync(filePath).toString(), minifyConfig))};`;
                } else {
                    inlinecontent += `const ${p} = ${JSON.stringify(fs.readFileSync(filePath).toString().replace(/\r\n/g, '\n'))};`;
                }
                return inlinecontent;
            }
            return '';
        });
    }
    return content;
}
export { parseSan };
