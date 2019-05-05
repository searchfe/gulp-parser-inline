# gulp-parser-inline

> gulp插件，用于处理inline语法

> inline plugin for [gulp](https://github.com/wearefractal/gulp).

## Install

```bash
npm install
npm build

```

## Usage

**在构建目录安装 `gulp-parser-inline`**

```shell
npm install --save-dev gulp-parser-inline
```
**在构建目录下创建 `gulpfile.js`**

```javascript

const staticDomain = process.env.dev ? '' : '//m.baidu.com';
const parse = require('gulp-parser-inline').parseInline;
// parse tpl
gulp.task('build:tpl', function (stream) {
    return gulp.src(['src/**/*.tpl'])
        .pipe(parse({
            base: path.resolve('./src/'),
            type: 'tpl',
            staticDomain: staticDomain,
            compress: true
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('build:js', function (stream) {
    return gulp.src(['src/**/*.js'])
        .pipe(parse({
            base: path.resolve('./src/'),
            type: 'js',
            staticDomain: staticDomain,
            useHash: true,
            compress: true
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('build:css', function (stream) {
    return gulp.src(['src/**/*.css'])
        .pipe(parse({
            base: path.resolve('./src/'),
            type: 'css',
            useHash: true,
            compress: true
        }))
        .pipe(gulp.dest('dist'));
});

```

## 运行

在gulpfile.js目录下执行如下命令

```js
$ gulp
```

## 用法
    构建路径基于base目录，若该目录下找不到该文件则会以当前文件目录为当前路径计算

**1.js**

js文件中的inline用法主要是将对应文件内容内联到当前js文件中

例：
```js
__inline('./a.js');
var dom = __inline('./a.etpl');
```
构建后：
```js
var a = 'I am a.js';
var dom = '<div>I am a.etpl</div>'
```

**2.css**

css文件中的inline用法除了将对应文件内容内联到当前css文件中外，还支持将图片文件转为base64

例：

```css
@import url('./a.css?__inline');
.bg {
    background:url(./a.png?__inline);
}
```
构建后：
```css
/* a.css文件内容 start */
.a {
    width: 100%;
}
/* a.css文件内容 end */
.bg {
    background:url(data:png;base64,iVBORw0KGgoAAAANSUh...);
}
```

**3.tpl**

把对应的文件内容内联到当前html(tpl)文件中。

例：
```html
<link rel="stylesheet" href="/static/css/style.css?__inline" /> 
<style>
	__inline('/static/css/style.css')
</style>
<script>
__inline('a.js');
</script>
```
构建后：
```html
<style>
	body,html{margin:0;padding:0}...略
</style>
<script>
define("a",[],function(n,a,i){a.run=function(){alert("i am a")}});
</script>
```


parse({
    base: path.resolve('./src/'),
    type: 'js',
    staticDomain: staticDomain,
    useHash: true,
    compress: true
}))

### base
Type: `String`

default: false

### type
Type:  `String`

Value: `js|tpl|css`

### staticDomain
Type:  `String`

default: ''

### useHash

Type:  `Boolean`

### compress

Type:  `Boolean`

## Build

Run `npm run build` to build.

## Watch

Run `npm run watch` to start a dev server and watch to build.

## Running unit tests

Run `npm run test` to execute the unit tests.

## Coveralls

Run `npm run cover` to cover the project.

## Docs
Run `npm run docs` to make docs in floder docs/.

## Publish
Run `npm version path` and then `npm publish`.

## Further help

To get more help on the Apmts CLI use `apm-ts help` or go check out the [README](https://github.com/apmjs/apm-ts-cli/).
