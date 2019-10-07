export declare function __inline(str: any): string;
export declare interface parserOption {
    base: string,
    type: string,
    staticDomain: string,
    useHash: boolean,
    compress: boolean,
    eslBase: string,
    sourceMapPath: string,
    unHashFiles?: [string],
    unCompressFiles?: [string],
    ugilyJsConfig?: any,
    cleanCssConfig?: any
}