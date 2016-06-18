import {Json, isPresent, isBlank, RegExpWrapper, StringWrapper} from '@angular/facade';
import {BaseException, WrappedException} from '@angular/facade';

import {WebDriverExtension, PerfLogFeatures} from '../web_driver_extension';
import {WebDriverAdapter} from '../web_driver_adapter';

export class IOsDriverExtension extends WebDriverExtension {
  // TODO(tbosch): use static values when our transpiler supports them
  static get PROVIDERS(): any[] { return _PROVIDERS; }

  constructor(private _driver: WebDriverAdapter) { super(); }

  gc(): Promise<any> { throw new BaseException('Force GC is not supported on iOS'); }

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

  // See https://github.com/WebKit/webkit/tree/master/Source/WebInspectorUI/Versions
  readPerfLog() {
    // TODO(tbosch): Bug in IOsDriver: Need to execute at least one command
    // so that the browser logs can be read out!
    return this._driver.executeScript('1+1')
        .then((_) => this._driver.logs('performance'))
        .then((entries) => {
          var records = [];
          entries.forEach(entry => {
            var message = Json.parse(entry['message'])['message'];
            if (StringWrapper.equals(message['method'], 'Timeline.eventRecorded')) {
              records.push(message['params']['record']);
            }
          });
          return this._convertPerfRecordsToEvents(records);
        });
  }

  _convertPerfRecordsToEvents(records: any[], events: any[] = null) {
    if (isBlank(events)) {
      events = [];
    }
    records.forEach((record) => {
      var endEvent = null;
      var type = record['type'];
      var data = record['data'];
      var startTime = record['startTime'];
      var endTime = record['endTime'];

      if (StringWrapper.equals(type, 'FunctionCall') &&
          (isBlank(data) || !StringWrapper.equals(data['scriptName'], 'InjectedScript'))) {
        events.push(createStartEvent('script', startTime));
        endEvent = createEndEvent('script', endTime);
      } else if (StringWrapper.equals(type, 'Time')) {
        events.push(createMarkStartEvent(data['message'], startTime));
      } else if (StringWrapper.equals(type, 'TimeEnd')) {
        events.push(createMarkEndEvent(data['message'], startTime));
      } else if (StringWrapper.equals(type, 'RecalculateStyles') ||
                 StringWrapper.equals(type, 'Layout') ||
                 StringWrapper.equals(type, 'UpdateLayerTree') ||
                 StringWrapper.equals(type, 'Paint') || StringWrapper.equals(type, 'Rasterize') ||
                 StringWrapper.equals(type, 'CompositeLayers')) {
        events.push(createStartEvent('render', startTime));
        endEvent = createEndEvent('render', endTime);
      }
      // Note: ios used to support GCEvent up until iOS 6 :-(
      if (isPresent(record['children'])) {
        this._convertPerfRecordsToEvents(record['children'], events);
      }
      if (isPresent(endEvent)) {
        events.push(endEvent);
      }
    });
    return events;
  }

  perfLogFeatures(): PerfLogFeatures { return new PerfLogFeatures({render: true}); }

  supports(capabilities: {[key: string]: any}): boolean {
    return StringWrapper.equals(capabilities['browserName'].toLowerCase(), 'safari');
  }
}

function createEvent(ph, name, time, args = null) {
  var result = {
    'cat': 'timeline',
    'name': name,
    'ts': time,
    'ph': ph,
    // The ios protocol does not support the notions of multiple processes in
    // the perflog...
    'pid': 'pid0'
  };
  if (isPresent(args)) {
    result['args'] = args;
  }
  return result;
}

function createStartEvent(name, time, args = null) {
  return createEvent('B', name, time, args);
}

function createEndEvent(name, time, args = null) {
  return createEvent('E', name, time, args);
}

function createMarkStartEvent(name, time) {
  return createEvent('b', name, time);
}

function createMarkEndEvent(name, time) {
  return createEvent('e', name, time);
}

var _PROVIDERS = [
  {provide: IOsDriverExtension, useFactory: (driver) => new IOsDriverExtension(driver), deps: [WebDriverAdapter]}
];
