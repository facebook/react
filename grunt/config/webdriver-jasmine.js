// https://saucelabs.com/docs/platforms

var browsers = [
  { browserName: 'chrome', platform: 'linux' },
  
  // { browserName: 'android', platform: 'Linux', version: '4.0', 'device-type': 'tablet', 'device-orientation': 'portrait' },
  // { browserName: 'android', platform: 'Linux', version: '4.0' },
  // 
  // { browserName: 'ipad', platform: 'OS X 10.6', version: '4' },
  // { browserName: 'ipad', platform: 'OS X 10.8', version: '5.1' },
  // { browserName: 'iphone', platform: 'OS X 10.8', version: '6.1' },
  // 
  // { browserName: 'firefox', version: '24', platform: 'Windows 7' },
  // { browserName: 'firefox', version: '19', platform: 'Windows XP' },
  // { browserName: 'firefox', version: '3', platform: 'Linux' },
  // 
  // { browserName: 'opera', platform: 'Windows 2008', version: '12' },
  // 
  // { browserName: 'internet explorer', platform: 'Windows 8', version: '10' },
  // { browserName: 'internet explorer', platform: 'Windows 7', version: '9' },
  // { browserName: 'internet explorer', platform: 'Windows 7', version: '8' },
  // { browserName: 'internet explorer', platform: 'Windows XP', version: '8' },
  // { browserName: 'internet explorer', platform: 'Windows XP', version: '7' },
  // { browserName: 'internet explorer', platform: 'Windows XP', version: '6' },
  // 
  // { browserName: 'safari', platform: 'OS X 10.8', version: '6' },
  // { browserName: 'safari', platform: 'OS X 10.6', version: '5' },
];

exports.local = {
  webdriver: {
    remote: {
      protocol: 'http:',
      hostname: '127.0.0.1',
      port: '9515',
      path: '/'
    }
  },
  browser:{browserName:'chrome'},
  url: "http://127.0.0.1:9999/test/sauce-harness.html",
  onComplete: function(report){
    var browser = this;
    console.log('report.passed', report.passed)
  }
}

if (false)
exports.saucelabs = {
  webdriver: {
    remote:{
      // https://github.com/admc/wd/blob/master/README.md#named-parameters
      user: process.env.SAUCE_USERNAME,
      pwd: process.env.SAUCE_ACCESS_KEY,
        
      protocol: 'http:',
      hostname: 'ondemand.saucelabs.com',
      port: '80',
      path: '/wd/hub'
    }
  },
  url: "http://127.0.0.1:9999/test/sauce-harness.html",
  onComplete: function(report){
    var browser = this;
    // .then(function(report){return browser.sauceJobStatus(report.passed);})
  }
}
