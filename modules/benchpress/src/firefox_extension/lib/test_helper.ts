var q = require('q');
var FirefoxProfile = require('firefox-profile');
var jpm = require('jpm/lib/xpi');
var pathUtil = require('path');

var PERF_ADDON_PACKAGE_JSON_DIR = '..';

exports.getAbsolutePath = function(path) {
  var normalizedPath = pathUtil.normalize(path);
  if (pathUtil.resolve(normalizedPath) == normalizedPath) {
    // Already absolute path
    return normalizedPath;
  } else {
    return pathUtil.join(__dirname, normalizedPath);
  }
};

exports.getFirefoxProfile = function(extensionPath) {
  var deferred = q.defer();

  var firefoxProfile = new FirefoxProfile();
  firefoxProfile.addExtensions([extensionPath], () => {
    firefoxProfile.encoded(encodedProfile => {
      var multiCapabilities = [{browserName: 'firefox', firefox_profile: encodedProfile}];
      deferred.resolve(multiCapabilities);
    });
  });

  return deferred.promise;
};

exports.getFirefoxProfileWithExtension = function() {
  var absPackageJsonDir = pathUtil.join(__dirname, PERF_ADDON_PACKAGE_JSON_DIR);
  var packageJson = require(pathUtil.join(absPackageJsonDir, 'package.json'));

  var savedCwd = process.cwd();
  process.chdir(absPackageJsonDir);

  return jpm(packageJson)
      .then(xpiPath => {
        process.chdir(savedCwd);
        return exports.getFirefoxProfile(xpiPath);
      });
};
