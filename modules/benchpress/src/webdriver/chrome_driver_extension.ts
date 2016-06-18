import {ListWrapper, StringMapWrapper} from '@angular/facade';
import {
  Json,
  isPresent,
  isBlank,
  RegExpWrapper,
  StringWrapper,
  NumberWrapper
} from '@angular/facade';
import {BaseException, WrappedException} from '@angular/facade';

import {WebDriverExtension, PerfLogFeatures} from '../web_driver_extension';
import {WebDriverAdapter} from '../web_driver_adapter';
import {Options} from '../common_options';

/**
 * Set the following 'traceCategories' to collect metrics in Chrome:
 * 'v8,blink.console,disabled-by-default-devtools.timeline,devtools.timeline'
 *
 * In order to collect the frame rate related metrics, add 'benchmark'
 * to the list above.
 */
export class ChromeDriverExtension extends WebDriverExtension {
  // TODO(tbosch): use static values when our transpiler supports them
  static get PROVIDERS(): any[] { return _PROVIDERS; }

  private _majorChromeVersion: number;

  constructor(private _driver: WebDriverAdapter, userAgent: string) {
    super();
    this._majorChromeVersion = this._parseChromeVersion(userAgent);
  }

  private _parseChromeVersion(userAgent: string): number {
    if (isBlank(userAgent)) {
      return -1;
    }
    var v = StringWrapper.split(userAgent, /Chrom(e|ium)\//g)[2];
    if (isBlank(v)) {
      return -1;
    }
    v = v.split('.')[0];
    if (isBlank(v)) {
      return -1;
    }
    return NumberWrapper.parseInt(v, 10);
  }

  gc() { return this._driver.executeScript('window.gc()'); }

  timeBegin(name: string): Promise<any> {
    return this._driver.executeScript(`console.time('${name}');`);
  }

  timeEnd(name: string, restartName: string = null): Promise<any> {
    var script = `console.timeEnd('${name}');`;
    if (isPresent(restartName)) {
      script += `console.time('${restartName}');`
    }
    return this._driver.executeScript(script);
  }

  // See [Chrome Trace Event
  // Format](https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/edit)
  readPerfLog(): Promise<any> {
    // TODO(tbosch): Chromedriver bug https://code.google.com/p/chromedriver/issues/detail?id=1098
    // Need to execute at least one command so that the browser logs can be read out!
    return this._driver.executeScript('1+1')
        .then((_) => this._driver.logs('performance'))
        .then((entries) => {
          var events = [];
          entries.forEach(entry => {
            var message = Json.parse(entry['message'])['message'];
            if (StringWrapper.equals(message['method'], 'Tracing.dataCollected')) {
              events.push(message['params']);
            }
            if (StringWrapper.equals(message['method'], 'Tracing.bufferUsage')) {
              throw new BaseException('The DevTools trace buffer filled during the test!');
            }
          });
          return this._convertPerfRecordsToEvents(events);
        });
  }

  private _convertPerfRecordsToEvents(chromeEvents: Array<{[key: string]: any}>,
                                      normalizedEvents: Array<{[key: string]: any}> = null) {
    if (isBlank(normalizedEvents)) {
      normalizedEvents = [];
    }
    var majorGCPids = {};
    chromeEvents.forEach((event) => {
      var categories = this._parseCategories(event['cat']);
      var name = event['name'];
      if (this._isEvent(categories, name, ['blink.console'])) {
        normalizedEvents.push(normalizeEvent(event, {'name': name}));
      } else if (this._isEvent(categories, name, ['benchmark'],
                               'BenchmarkInstrumentation::ImplThreadRenderingStats')) {
        // TODO(goderbauer): Instead of BenchmarkInstrumentation::ImplThreadRenderingStats the
        // following events should be used (if available) for more accurate measurments:
        //   1st choice: vsync_before - ground truth on Android
        //   2nd choice: BenchmarkInstrumentation::DisplayRenderingStats - available on systems with
        //               new surfaces framework (not broadly enabled yet)
        //   3rd choice: BenchmarkInstrumentation::ImplThreadRenderingStats - fallback event that is
        //               always available if something is rendered
        var frameCount = event['args']['data']['frame_count'];
        if (frameCount > 1) {
          throw new BaseException('multi-frame render stats not supported');
        }
        if (frameCount == 1) {
          normalizedEvents.push(normalizeEvent(event, {'name': 'frame'}));
        }
      } else if (this._isEvent(categories, name, ['disabled-by-default-devtools.timeline'],
                               'Rasterize') ||
                 this._isEvent(categories, name, ['disabled-by-default-devtools.timeline'],
                               'CompositeLayers')) {
        normalizedEvents.push(normalizeEvent(event, {'name': 'render'}));
      } else if (this._majorChromeVersion < 45) {
        var normalizedEvent = this._processAsPreChrome45Event(event, categories, majorGCPids);
        if (normalizedEvent != null) normalizedEvents.push(normalizedEvent);
      } else {
        var normalizedEvent = this._processAsPostChrome44Event(event, categories);
        if (normalizedEvent != null) normalizedEvents.push(normalizedEvent);
      }
    });
    return normalizedEvents;
  }

  private _processAsPreChrome45Event(event, categories, majorGCPids) {
    var name = event['name'];
    var args = event['args'];
    var pid = event['pid'];
    var ph = event['ph'];
    if (this._isEvent(categories, name, ['disabled-by-default-devtools.timeline'],
                      'FunctionCall') &&
        (isBlank(args) || isBlank(args['data']) ||
         !StringWrapper.equals(args['data']['scriptName'], 'InjectedScript'))) {
      return normalizeEvent(event, {'name': 'script'});
    } else if (this._isEvent(categories, name, ['disabled-by-default-devtools.timeline'],
                             'RecalculateStyles') ||
               this._isEvent(categories, name, ['disabled-by-default-devtools.timeline'],
                             'Layout') ||
               this._isEvent(categories, name, ['disabled-by-default-devtools.timeline'],
                             'UpdateLayerTree') ||
               this._isEvent(categories, name, ['disabled-by-default-devtools.timeline'],
                             'Paint')) {
      return normalizeEvent(event, {'name': 'render'});
    } else if (this._isEvent(categories, name, ['disabled-by-default-devtools.timeline'],
                             'GCEvent')) {
      var normArgs = {
        'usedHeapSize': isPresent(args['usedHeapSizeAfter']) ? args['usedHeapSizeAfter'] :
                                                               args['usedHeapSizeBefore']
      };
      if (StringWrapper.equals(ph, 'E')) {
        normArgs['majorGc'] = isPresent(majorGCPids[pid]) && majorGCPids[pid];
      }
      majorGCPids[pid] = false;
      return normalizeEvent(event, {'name': 'gc', 'args': normArgs});
    } else if (this._isEvent(categories, name, ['v8'], 'majorGC') &&
               StringWrapper.equals(ph, 'B')) {
      majorGCPids[pid] = true;
    }
    return null;  // nothing useful in this event
  }

  private _processAsPostChrome44Event(event, categories) {
    var name = event['name'];
    var args = event['args'];
    if (this._isEvent(categories, name, ['devtools.timeline', 'v8'], 'MajorGC')) {
      var normArgs = {
        'majorGc': true,
        'usedHeapSize': isPresent(args['usedHeapSizeAfter']) ? args['usedHeapSizeAfter'] :
                                                               args['usedHeapSizeBefore']
      };
      return normalizeEvent(event, {'name': 'gc', 'args': normArgs});
    } else if (this._isEvent(categories, name, ['devtools.timeline', 'v8'], 'MinorGC')) {
      var normArgs = {
        'majorGc': false,
        'usedHeapSize': isPresent(args['usedHeapSizeAfter']) ? args['usedHeapSizeAfter'] :
                                                               args['usedHeapSizeBefore']
      };
      return normalizeEvent(event, {'name': 'gc', 'args': normArgs});
    } else if (this._isEvent(categories, name, ['devtools.timeline', 'v8'], 'FunctionCall') &&
               (isBlank(args) || isBlank(args['data']) ||
                (!StringWrapper.equals(args['data']['scriptName'], 'InjectedScript') &&
                 !StringWrapper.equals(args['data']['scriptName'], '')))) {
      return normalizeEvent(event, {'name': 'script'});
    } else if (this._isEvent(categories, name, ['devtools.timeline', 'blink'],
                             'UpdateLayoutTree')) {
      return normalizeEvent(event, {'name': 'render'});
    } else if (this._isEvent(categories, name, ['devtools.timeline'], 'UpdateLayerTree') ||
               this._isEvent(categories, name, ['devtools.timeline'], 'Layout') ||
               this._isEvent(categories, name, ['devtools.timeline'], 'Paint')) {
      return normalizeEvent(event, {'name': 'render'});
    } else if (this._isEvent(categories, name, ['devtools.timeline'], 'ResourceReceivedData')) {
      let normArgs = {'encodedDataLength': args['data']['encodedDataLength']};
      return normalizeEvent(event, {'name': 'receivedData', 'args': normArgs});
    } else if (this._isEvent(categories, name, ['devtools.timeline'], 'ResourceSendRequest')) {
      let data = args['data'];
      let normArgs = {'url': data['url'], 'method': data['requestMethod']};
      return normalizeEvent(event, {'name': 'sendRequest', 'args': normArgs});
    } else if (this._isEvent(categories, name, ['blink.user_timing'], 'navigationStart')) {
      return normalizeEvent(event, {'name': name});
    }
    return null;  // nothing useful in this event
  }

  private _parseCategories(categories: string): string[] { return categories.split(','); }

  private _isEvent(eventCategories: string[], eventName: string, expectedCategories: string[],
                   expectedName: string = null): boolean {
    var hasCategories = expectedCategories.reduce(
        (value, cat) => { return value && ListWrapper.contains(eventCategories, cat); }, true);
    return isBlank(expectedName) ? hasCategories :
                                   hasCategories && StringWrapper.equals(eventName, expectedName);
  }

  perfLogFeatures(): PerfLogFeatures {
    return new PerfLogFeatures({render: true, gc: true, frameCapture: true, userTiming: true});
  }

  supports(capabilities: {[key: string]: any}): boolean {
    return this._majorChromeVersion != -1 &&
           StringWrapper.equals(capabilities['browserName'].toLowerCase(), 'chrome');
  }
}

function normalizeEvent(chromeEvent: {[key: string]: any},
                        data: {[key: string]: any}): {[key: string]: any} {
  var ph = chromeEvent['ph'];
  if (StringWrapper.equals(ph, 'S')) {
    ph = 'b';
  } else if (StringWrapper.equals(ph, 'F')) {
    ph = 'e';
  }
  var result =
      {'pid': chromeEvent['pid'], 'ph': ph, 'cat': 'timeline', 'ts': chromeEvent['ts'] / 1000};
  if (chromeEvent['ph'] === 'X') {
    var dur = chromeEvent['dur'];
    if (isBlank(dur)) {
      dur = chromeEvent['tdur'];
    }
    result['dur'] = isBlank(dur) ? 0.0 : dur / 1000;
  }
  StringMapWrapper.forEach(data, (value, prop) => { result[prop] = value; });
  return result;
}

var _PROVIDERS = [
  {
    provide: ChromeDriverExtension,
    useFactory: (driver, userAgent) => new ChromeDriverExtension(driver, userAgent),
    deps: [WebDriverAdapter, Options.USER_AGENT]
  }
];
