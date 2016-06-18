var fs = require('fs');
var path = require('path');
var minimatch = require('minimatch');
var path = require('path');
var Q = require('q');

module.exports = {
  processToPromise: processToPromise,
  streamToPromise: streamToPromise,
  filterByFile: filterByFile,
  subDirs: subDirs,
  forEachSubDir: forEachSubDir,
  forEachSubDirSequential: forEachSubDirSequential
};

function subDirs(dir) {
  return fs.readdirSync(dir).filter(function(file) {
    return fs.statSync(path.join(dir, file)).isDirectory();
  });
}

function forEachSubDir(dir, callback) {
  var dirs = subDirs(dir);
  return Q.all(dirs.map(function(subdir) {
    return callback(path.join(dir, subdir));
  }));
};

function forEachSubDirSequential(dir, callback) {
  var dirs = subDirs(dir);
  return next(0);

  function next(index) {
    if (index < dirs.length) {
      return callback(path.join(dir, dirs[index])).then(function() {
        return next(index+1);
      });
    } else {
      return true;
    }
  }
}

function processToPromise(process) {
  var defer = Q.defer();
  process.on('close', function(code) {
    if (code) {
      defer.reject(code);
    } else {
      defer.resolve();
    }
  });
  return defer.promise;
}

function streamToPromise(stream) {
  var defer = Q.defer();
  stream.on('end', defer.resolve);
  stream.on('error', defer.reject);
  return defer.promise;
}

function filterByFile(pathMapping, folder) {
  var folderParts = folder.split(path.sep);
  var match;
  var lastPattern;
  for (var pattern in pathMapping) {
    if (minimatch(folder, pattern)) {
      if (!lastPattern || lastPattern.length < pattern.length) {
        match = pathMapping[pattern];
        lastPattern = pattern;
      }
    }
  }
  if (match !== undefined) {
    return match;
  } else {
    throw new Error('No entry for folder '+folder+' found in '+JSON.stringify(pathMapping));
  }
}
