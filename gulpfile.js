const gulp = require("gulp");
const replace = require('gulp-replace');
const ts = require("gulp-typescript");
const tsProject = ts.createProject("tscompile.json");
const typedoc = require("gulp-typedoc");
const del = require("del");
const inline = require("gulp-inline-template");
var base64 = require('gulp-base64-inline');
const path = require('path');


gulp.task("build:clean", function() {return del(["build/**", "dist/**"]);});

gulp.task("build:copy", function () {
  return gulp.src(["src/**/*"])
      .pipe(gulp.dest("build"));
});

gulp.task("build:css", function () {
  return gulp.src(["src/**/*.css"])
      .pipe(base64())
      .pipe(gulp.dest("build"));
});

gulp.task("build:ts", function () {
  return tsProject.src()
      .pipe(inline())
      .pipe(tsProject())
      .js.pipe(gulp.dest("dist"));
});
gulp.task("build:after-clean", function() {return del(["build/**"]);});

gulp.task('watch',function(){
  gulp.watch('./src/**/*', gulp.series('default'));
});



gulp.task("doc:ts", function() {
    return gulp.src(["src/**/*.ts"])
      .pipe(replace(/^[\s]*\*[\s]*\@example(?:(?!\*\/).|\n)*?^[\s]*\*\/$/mg, function(e){
        e = e.replace("@example", "@example\n * ```Typescript\n * ");
        e = e.substr(0, e.length-3) + " * ```\n" + " \*\/\n";
        return e;
      }))
      .pipe(gulp.dest("src_doc"));
});

gulp.task("doc:type", function() {
  return gulp.src(["src_doc/**/*.ts"])
    .pipe(typedoc({
        module: "commonjs",
        target: "es2015",
        out: "docs/",
        name: "gulp-parser-inline",
        hideGenerator: true,
        version: false,
        theme: "minimal", // markdown | minimal | default
        mode: "file",
        exclude: [""],
        excludePrivate: true,
        excludeProtected: true,
        help: false,
        readme: "README.md"
    }));
});
gulp.task("doc:clean", function() {return del(["src_doc/**"]);});

gulp.task('doc', gulp.series('doc:ts','doc:type' , 'doc:clean'));

gulp.task('default', gulp.series('build:clean', 'build:copy', 'build:css' , 'build:ts', 'build:after-clean'));

gulp.task('deploy:project', () => {
  const packages = require('./dev.config.js')
      .packages;
  if (packages) {
      let out = gulp.src(['dist/**/*']);
      packages.forEach(package => {
          const dir = path.resolve(package, '@baidu/gulp-parser-inline/dist');
          console.log(`=> ${dir}`);
          out = out.pipe(gulp.dest(dir));
      });
      return out;
  }
});

gulp.task('watch', function () {
  const arr = ['default'];
  if (process.env.NODE_ENV) {
      arr.push('deploy:project');
  }
  gulp.watch('./src/**/*', gulp.series(arr));
});
