var gulp = require('gulp');
var concat = require('gulp-concat');
var replace = require('gulp-replace');
var insert = require('gulp-insert');
var fs = require('fs-extra');
var browserify = require('browserify');
var path = require('path');

module.exports.bundle = function(buildConfig, moduleName, outputFile, outputConfig,
    sfx) {
  var sfx = sfx || false;
  // Workaround for https://github.com/dart-lang/dart_style/issues/493
  var Builder = require('systemjs-builder');
  var builder = new Builder();
  builder.config(buildConfig);
  builder.loader.baseURL = 'file:' + process.cwd() + '/';
  if (sfx) {
    return builder.buildSFX(moduleName, outputFile, outputConfig);
  } else {
    return builder.build(moduleName, outputFile, outputConfig);
  }
};


module.exports.modify = function(srcs, concatName) {
  return gulp.src(srcs)
    .pipe(concat(concatName))
    .pipe(replace('sourceMappingURL', 'sourceMappingURLDisabled'))  // TODO: add concat for sourceMaps
};


module.exports.benchpressBundle = function(entries, packageJsonPath, includes, excludes, ignore, dest, cb) {
  var b = browserify({
    entries: entries,
    builtins: [],
    insertGlobalVars: ['__filename','__dirname'],
    detectGlobals: false
  });
  for (var i = 0; i < excludes.length; i++) {
    b.exclude(excludes[i]);
  }
  var packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
  for (var dep in packageJson.dependencies) {
    //remove deps from package that we want to include in the bundle
    if (includes.indexOf(dep) > -1) {
      delete packageJson.dependencies[dep];
    } else {
      b.exclude(dep);
    }
  }
  for (var i = 0; i < ignore.length; i++) {
    b.ignore(ignore[i]);
  }
  fs.mkdirsSync(dest);
  fs.writeFileSync(dest + '/package.json', JSON.stringify(packageJson, null, '  '));
  b.bundle(function(err, buf) {
    if (err) {
      return cb(err);
    }
    var contents = buf.toString();

    contents += 'module.exports = global.__benchpressExports;\n';
    fs.writeFileSync(dest + '/index.js', contents);
    cb(null);
  });
};
