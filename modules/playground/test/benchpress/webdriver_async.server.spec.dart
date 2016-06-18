import 'dart:async';
import 'dart:io' show Platform;
import 'package:guinness2/guinness2.dart';
import 'package:benchpress/benchpress.dart';
import 'package:webdriver/webdriver.dart'
    show WebDriver, Capabilities, LogType, LogLevel, By;

main() {
  describe('benchpress', () {
    WebDriver driver;
    Runner runner;

    beforeEach(() async {
      driver = await createTestDriver();
      await driver
          .get('http://localhost:8002/playground/src/benchpress/index.html');

      var bindings = [{
        provide: WebDriverAdapter,
        useFactory: () => new AsyncWebDriverAdapter(driver),
        deps: []
      }];
      runner = new Runner(bindings);
    });

    afterEach(() async {
      await driver.close();
    });

    it('should work', () {
      return runner.sample(id: 'benchpress smoke test', execute: () async {
        var button = await driver.findElement(const By.tagName('button'));
        await button.click();
        var logText = await (await driver.findElement(const By.id('log'))).text;
        expect(logText, 'hi');
      });
    });
  });
}

Future<WebDriver> createTestDriver() {
  Map env = Platform.environment;
  return WebDriver.createDriver(desiredCapabilities: {
    'name': 'Dartium',
    'browserName': 'chrome',
    'chromeOptions': {
      'binary': env['DARTIUM_BIN'],
      'args': ['--js-flags=--expose-gc'],
      'perfLoggingPrefs': {
        'traceCategories':
            'v8,blink.console,disabled-by-default-devtools.timeline'
      },
    },
    'loggingPrefs': {'performance': 'ALL', 'browser': 'ALL',}
  });
}
