// Unique place to configure the browsers which are used in the different CI jobs in Sauce Labs (SL) and BrowserStack (BS).
// If the target is set to null, then the browser is not run anywhere during CI.
// If a category becomes empty (e.g. BS and required), then the corresponding job must be commented out in Travis configuration.
var CIconfiguration = {
  'Chrome':       { unitTest: {target: 'SL', required: true}, e2e: {target: null, required: true}},
  'Firefox':      { unitTest: {target: 'SL', required: true}, e2e: {target: null, required: true}},
  // FirefoxBeta and ChromeBeta should be target:'BS' or target:'SL', and required:true
  // Currently deactivated due to https://github.com/angular/angular/issues/7560
  'ChromeBeta':   { unitTest: {target: null, required: true}, e2e: {target: null, required: false}},
  'FirefoxBeta':  { unitTest: {target: null, required: false}, e2e: {target: null, required: false}},
  'ChromeDev':    { unitTest: {target: null, required: true}, e2e: {target: null, required: true}},
  'FirefoxDev':   { unitTest: {target: null, required: true}, e2e: {target: null, required: true}},
  'IE9':          { unitTest: {target: 'SL', required: false}, e2e: {target: null, required: true}},
  'IE10':         { unitTest: {target: 'SL', required: true}, e2e: {target: null, required: true}},
  'IE11':         { unitTest: {target: 'SL', required: true}, e2e: {target: null, required: true}},
  'Edge':         { unitTest: {target: 'SL', required: false}, e2e: {target: null, required: true}},
  'Android4.1':   { unitTest: {target: 'SL', required: false}, e2e: {target: null, required: true}},
  'Android4.2':   { unitTest: {target: 'SL', required: false}, e2e: {target: null, required: true}},
  'Android4.3':   { unitTest: {target: 'SL', required: false}, e2e: {target: null, required: true}},
  'Android4.4':   { unitTest: {target: 'SL', required: false}, e2e: {target: null, required: true}},
  'Android5':     { unitTest: {target: 'SL', required: false}, e2e: {target: null, required: true}},
  'Safari7':      { unitTest: {target: 'BS', required: false}, e2e: {target: null, required: true}},
  'Safari8':      { unitTest: {target: 'BS', required: false}, e2e: {target: null, required: true}},
  'Safari9':      { unitTest: {target: 'BS', required: false}, e2e: {target: null, required: true}},
  'iOS7':         { unitTest: {target: 'BS', required: true}, e2e: {target: null, required: true}},
  'iOS8':         { unitTest: {target: 'BS', required: false}, e2e: {target: null, required: true}},
  'iOS9':         { unitTest: {target: 'BS', required: false}, e2e: {target: null, required: true}},
  'WindowsPhone': { unitTest: {target: 'BS', required: false}, e2e: {target: null, required: true}}
};

var customLaunchers = {
  'DartiumWithWebPlatform': {
    base: 'Dartium',
    flags: ['--enable-experimental-web-platform-features'] },
  'ChromeNoSandbox': {
    base: 'Chrome',
    flags: ['--no-sandbox'] },
  'SL_CHROME': {
    base: 'SauceLabs',
    browserName: 'chrome',
    version: '50'
  },
  'SL_CHROMEBETA': {
    base: 'SauceLabs',
    browserName: 'chrome',
    version: 'beta'
  },
  'SL_CHROMEDEV': {
    base: 'SauceLabs',
    browserName: 'chrome',
    version: 'dev'
  },
  'SL_FIREFOX': {
    base: 'SauceLabs',
    browserName: 'firefox',
    version: '45'
  },
  'SL_FIREFOXBETA': {
    base: 'SauceLabs',
    browserName: 'firefox',
    version: 'beta'
  },
  'SL_FIREFOXDEV': {
    base: 'SauceLabs',
    browserName: 'firefox',
    version: 'dev'
  },
  'SL_SAFARI7': {
    base: 'SauceLabs',
    browserName: 'safari',
    platform: 'OS X 10.9',
    version: '7'
  },
  'SL_SAFARI8': {
    base: 'SauceLabs',
    browserName: 'safari',
    platform: 'OS X 10.10',
    version: '8'
  },
  'SL_SAFARI9': {
    base: 'SauceLabs',
    browserName: 'safari',
    platform: 'OS X 10.11',
    version: '9.0'
  },
  'SL_IOS7': {
    base: 'SauceLabs',
    browserName: 'iphone',
    platform: 'OS X 10.10',
    version: '7.1'
  },
  'SL_IOS8': {
    base: 'SauceLabs',
    browserName: 'iphone',
    platform: 'OS X 10.10',
    version: '8.4'
  },
  'SL_IOS9': {
    base: 'SauceLabs',
    browserName: 'iphone',
    platform: 'OS X 10.10',
    version: '9.1'
  },
  'SL_IE9': {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    platform: 'Windows 2008',
    version: '9'
  },
  'SL_IE10': {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    platform: 'Windows 2012',
    version: '10'
  },
  'SL_IE11': {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    platform: 'Windows 8.1',
    version: '11'
  },
  'SL_EDGE': {
    base: 'SauceLabs',
    browserName: 'MicrosoftEdge',
    platform: 'Windows 10',
    version: '13.10586'
  },
  'SL_ANDROID4.1': {
    base: 'SauceLabs',
    browserName: 'android',
    platform: 'Linux',
    version: '4.1'
  },
  'SL_ANDROID4.2': {
    base: 'SauceLabs',
    browserName: 'android',
    platform: 'Linux',
    version: '4.2'
  },
  'SL_ANDROID4.3': {
    base: 'SauceLabs',
    browserName: 'android',
    platform: 'Linux',
    version: '4.3'
  },
  'SL_ANDROID4.4': {
    base: 'SauceLabs',
    browserName: 'android',
    platform: 'Linux',
    version: '4.4'
  },
  'SL_ANDROID5': {
    base: 'SauceLabs',
    browserName: 'android',
    platform: 'Linux',
    version: '5.1'
  },

  'BS_CHROME': {
    base: 'BrowserStack',
    browser: 'chrome',
    os: 'OS X',
    os_version: 'Yosemite'
  },
  'BS_FIREFOX': {
    base: 'BrowserStack',
    browser: 'firefox',
    os: 'Windows',
    os_version: '10'
  },
  'BS_SAFARI7': {
    base: 'BrowserStack',
    browser: 'safari',
    os: 'OS X',
    os_version: 'Mavericks'
  },
  'BS_SAFARI8': {
    base: 'BrowserStack',
    browser: 'safari',
    os: 'OS X',
    os_version: 'Yosemite'
  },
  'BS_SAFARI9': {
    base: 'BrowserStack',
    browser: 'safari',
    os: 'OS X',
    os_version: 'El Capitan'
  },
  'BS_IOS7': {
    base: 'BrowserStack',
    device: 'iPhone 5S',
    os: 'ios',
    os_version: '7.0'
  },
  'BS_IOS8': {
    base: 'BrowserStack',
    device: 'iPhone 6',
    os: 'ios',
    os_version: '8.3'
  },
  'BS_IOS9': {
    base: 'BrowserStack',
    device: 'iPhone 6S',
    os: 'ios',
    os_version: '9.0'
  },
  'BS_IE9': {
    base: 'BrowserStack',
    browser: 'ie',
    browser_version: '9.0',
    os: 'Windows',
    os_version: '7'
  },
  'BS_IE10': {
    base: 'BrowserStack',
    browser: 'ie',
    browser_version: '10.0',
    os: 'Windows',
    os_version: '8'
  },
  'BS_IE11': {
    base: 'BrowserStack',
    browser: 'ie',
    browser_version: '11.0',
    os: 'Windows',
    os_version: '10'
  },
  'BS_EDGE': {
    base: 'BrowserStack',
    browser: 'edge',
    os: 'Windows',
    os_version: '10'
  },
  'BS_WINDOWSPHONE' : {
    base: 'BrowserStack',
    device: 'Nokia Lumia 930',
    os: 'winphone',
    os_version: '8.1'
  },
  'BS_ANDROID5': {
    base: 'BrowserStack',
    device: 'Google Nexus 5',
    os: 'android',
    os_version: '5.0'
  },
  'BS_ANDROID4.4': {
    base: 'BrowserStack',
    device: 'HTC One M8',
    os: 'android',
    os_version: '4.4'
  },
  'BS_ANDROID4.3': {
    base: 'BrowserStack',
    device: 'Samsung Galaxy S4',
    os: 'android',
    os_version: '4.3'
  },
  'BS_ANDROID4.2': {
    base: 'BrowserStack',
    device: 'Google Nexus 4',
    os: 'android',
    os_version: '4.2'
  },
  'BS_ANDROID4.1': {
    base: 'BrowserStack',
    device: 'Google Nexus 7',
    os: 'android',
    os_version: '4.1'
  }
};

var sauceAliases = {
  'ALL': Object.keys(customLaunchers).filter(function(item) {return customLaunchers[item].base == 'SauceLabs';}),
  'DESKTOP': ['SL_CHROME', 'SL_FIREFOX', 'SL_IE9', 'SL_IE10', 'SL_IE11', 'SL_EDGE', 'SL_SAFARI7', 'SL_SAFARI8', 'SL_SAFARI9'],
  'MOBILE': ['SL_ANDROID4.1', 'SL_ANDROID4.2', 'SL_ANDROID4.3', 'SL_ANDROID4.4', 'SL_ANDROID5', 'SL_IOS7', 'SL_IOS8', 'SL_IOS9'],
  'ANDROID': ['SL_ANDROID4.1', 'SL_ANDROID4.2', 'SL_ANDROID4.3', 'SL_ANDROID4.4', 'SL_ANDROID5'],
  'IE': ['SL_IE9', 'SL_IE10', 'SL_IE11'],
  'IOS': ['SL_IOS7', 'SL_IOS8', 'SL_IOS9'],
  'SAFARI': ['SL_SAFARI7', 'SL_SAFARI8', 'SL_SAFARI9'],
  'BETA': ['SL_CHROMEBETA', 'SL_FIREFOXBETA'],
  'DEV': ['SL_CHROMEDEV', 'SL_FIREFOXDEV'],
  'CI_REQUIRED': buildConfiguration('unitTest', 'SL', true),
  'CI_OPTIONAL': buildConfiguration('unitTest', 'SL', false)
};

var browserstackAliases = {
  'ALL': Object.keys(customLaunchers).filter(function(item) {return customLaunchers[item].base == 'BrowserStack';}),
  'DESKTOP': ['BS_CHROME', 'BS_FIREFOX', 'BS_IE9', 'BS_IE10', 'BS_IE11', 'BS_EDGE', 'BS_SAFARI7', 'BS_SAFARI8', 'BS_SAFARI9'],
  'MOBILE': ['BS_ANDROID4.3', 'BS_ANDROID4.4', 'BS_IOS7', 'BS_IOS8', 'BS_IOS9', 'BS_WINDOWSPHONE'],
  'ANDROID': ['BS_ANDROID4.3', 'BS_ANDROID4.4'],
  'IE': ['BS_IE9', 'BS_IE10', 'BS_IE11'],
  'IOS': ['BS_IOS7', 'BS_IOS8', 'BS_IOS9'],
  'SAFARI': ['BS_SAFARI7', 'BS_SAFARI8', 'BS_SAFARI9'],
  'CI_REQUIRED': buildConfiguration('unitTest', 'BS', true),
  'CI_OPTIONAL': buildConfiguration('unitTest', 'BS', false)
};

module.exports = {
  customLaunchers: customLaunchers,
  sauceAliases: sauceAliases,
  browserstackAliases: browserstackAliases
};

function buildConfiguration(type, target, required) {
  return Object.keys(CIconfiguration)
    .filter((item) => {
      var conf = CIconfiguration[item][type];
      return conf.required === required && conf.target === target;
    })
    .map((item) => {
      return target + '_' + item.toUpperCase();
    });
}
