# gulp-parser-inline

> inline plugin for [gulp](https://github.com/wearefractal/gulp).

## Install

```bash
npm install
npm build

```

## Usage

First, install `gulp-parser-inline` as a development dependency:

```shell
npm install --save-dev gulp-md5
```

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

## API

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
