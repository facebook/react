var assertEventsContainsName = function(events, eventName) {
  var found = false;
  for (var i = 0; i < events.length; ++i) {
    if (events[i].name == eventName) {
      found = true;
      break;
    }
  }
  expect(found).toBeTruthy();
};

describe('firefox extension', function() {
  var TEST_URL = 'http://localhost:8001/playground/src/hello_world/index.html';

  it('should measure performance', function() {
    browser.sleep(3000);  // wait for extension to load

    browser.driver.get(TEST_URL);

    browser.executeScript('window.startProfiler()')
        .then(function() { console.log('started measuring perf'); });

    browser.executeAsyncScript('setTimeout(arguments[0], 1000);');
    browser.executeScript('window.forceGC()');

    browser.executeAsyncScript('var cb = arguments[0]; window.getProfile(cb);')
        .then(function(profile) {
          assertEventsContainsName(profile, 'gc');
          assertEventsContainsName(profile, 'script');
        });
  })
});
