/**
 * Patch Protractor so that it uses ChromeDriver 2.14 instead of 2.15.
 *
 * This is necessary because as of v2.1.0, Protractor by default uses
 * chromedriver 2.15. However, angular need to test against Dartium, which
 * is an old version of Chromium which is incompatible with Chromedriver > 2.14.
 *
 * TODO(juliemr): Remove this script once Dartium has been updated.
 */
var fs = require('fs');
var path = require('path');

var protractorConfigFile = path.resolve(require.resolve('protractor'), '../../config.json');

var newConfig = {
  "webdriverVersions": {
    "selenium": "2.45.0",
    "chromedriver": "2.14",
    "iedriver": "2.45.0"
  }
}

fs.writeFile(protractorConfigFile,  JSON.stringify(newConfig));
