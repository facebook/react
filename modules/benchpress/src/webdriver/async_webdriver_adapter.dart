library benchpress.src.webdriver.async_webdriver_adapter_dart;

import 'dart:async';
import 'package:webdriver/webdriver.dart' show WebDriver, LogEntry;
import '../web_driver_adapter.dart' show WebDriverAdapter;

class AsyncWebDriverAdapter extends WebDriverAdapter {
  WebDriver _driver;
  AsyncWebDriverAdapter(this._driver);

  Future waitFor(Function callback) {
    return callback();
  }

  Future executeScript(String script) {
    return _driver.execute(script, const []);
  }

  Future executeAsyncScript(String script) {
    return _driver.executeAsync(script, const []);
  }

  Future<Map> capabilities() {
    return new Future.value(_driver.capabilities);
  }

  Future<List<Map>> logs(String type) {
    return _driver.logs
        .get(type)
        .map((LogEntry entry) => {'message': entry.message})
        .fold(<Map>[], (log, Map entry) {
      return log..add(entry);
    });
  }
}
