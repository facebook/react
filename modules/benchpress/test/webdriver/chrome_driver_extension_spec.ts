import {
  afterEach,
  AsyncTestCompleter,
  beforeEach,
  ddescribe,
  describe,
  expect,
  iit,
  inject,
  it,
  xit,
} from '@angular/testing/testing_internal';

import {PromiseWrapper} from '@angular/facade';
import {Json, isBlank} from '@angular/facade';

import {
  WebDriverExtension,
  ChromeDriverExtension,
  WebDriverAdapter,
  ReflectiveInjector,
  Options
} from 'benchpress/common';

import {TraceEventFactory} from '../trace_event_factory';

export function main() {
  describe('chrome driver extension', () => {
    var CHROME44_USER_AGENT =
        '"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.0 Safari/537.36"';
    var CHROME45_USER_AGENT =
        '"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2499.0 Safari/537.36"';

    var log;
    var extension;

    var blinkEvents = new TraceEventFactory('blink.console', 'pid0');
    var v8Events = new TraceEventFactory('v8', 'pid0');
    var v8EventsOtherProcess = new TraceEventFactory('v8', 'pid1');
    var chromeTimelineEvents =
        new TraceEventFactory('disabled-by-default-devtools.timeline', 'pid0');
    var chrome45TimelineEvents = new TraceEventFactory('devtools.timeline', 'pid0');
    var chromeTimelineV8Events = new TraceEventFactory('devtools.timeline,v8', 'pid0');
    var chromeBlinkTimelineEvents = new TraceEventFactory('blink,devtools.timeline', 'pid0');
    var chromeBlinkUserTimingEvents = new TraceEventFactory('blink.user_timing', 'pid0');
    var benchmarkEvents = new TraceEventFactory('benchmark', 'pid0');
    var normEvents = new TraceEventFactory('timeline', 'pid0');

    function createExtension(perfRecords = null, userAgent = null,
                             messageMethod = 'Tracing.dataCollected'): WebDriverExtension {
      if (isBlank(perfRecords)) {
        perfRecords = [];
      }
      if (isBlank(userAgent)) {
        userAgent = CHROME44_USER_AGENT;
      }
      log = [];
      extension =
          ReflectiveInjector.resolveAndCreate([
                              ChromeDriverExtension.PROVIDERS,
                              {provide: WebDriverAdapter, useValue: new MockDriverAdapter(log, perfRecords, messageMethod)},
                              {provide: Options.USER_AGENT, useValue(userAgent)}
                            ])
              .get(ChromeDriverExtension);
      return extension;
    }

    it('should force gc via window.gc()', inject([AsyncTestCompleter], (async) => {
         createExtension().gc().then((_) => {
           expect(log).toEqual([['executeScript', 'window.gc()']]);
           async.done();
         });
       }));

    it('should mark the timeline via console.time()', inject([AsyncTestCompleter], (async) => {
         createExtension()
             .timeBegin('someName')
             .then((_) => {
               expect(log).toEqual([['executeScript', `console.time('someName');`]]);
               async.done();
             });
       }));

    it('should mark the timeline via console.timeEnd()', inject([AsyncTestCompleter], (async) => {
         createExtension()
             .timeEnd('someName', null)
             .then((_) => {
               expect(log).toEqual([['executeScript', `console.timeEnd('someName');`]]);
               async.done();
             });
       }));

    it('should mark the timeline via console.time() and console.timeEnd()',
       inject([AsyncTestCompleter], (async) => {
         createExtension()
             .timeEnd('name1', 'name2')
             .then((_) => {
               expect(log)
                   .toEqual([['executeScript', `console.timeEnd('name1');console.time('name2');`]]);
               async.done();
             });
       }));

    describe('readPerfLog Chrome44', () => {
      it('should normalize times to ms and forward ph and pid event properties',
         inject([AsyncTestCompleter], (async) => {
           createExtension([chromeTimelineEvents.complete('FunctionCall', 1100, 5500, null)])
               .readPerfLog()
               .then((events) => {
                 expect(events).toEqual([
                   normEvents.complete('script', 1.1, 5.5, null),
                 ]);
                 async.done();
               });
         }));

      it('should normalize "tdur" to "dur"', inject([AsyncTestCompleter], (async) => {
           var event = chromeTimelineEvents.create('X', 'FunctionCall', 1100, null);
           event['tdur'] = 5500;
           createExtension([event]).readPerfLog().then((events) => {
             expect(events).toEqual([
               normEvents.complete('script', 1.1, 5.5, null),
             ]);
             async.done();
           });
         }));

      it('should report FunctionCall events as "script"', inject([AsyncTestCompleter], (async) => {
           createExtension([chromeTimelineEvents.start('FunctionCall', 0)])
               .readPerfLog()
               .then((events) => {
                 expect(events).toEqual([
                   normEvents.start('script', 0),
                 ]);
                 async.done();
               });
         }));

      it('should report gc', inject([AsyncTestCompleter], (async) => {
           createExtension([
             chromeTimelineEvents.start('GCEvent', 1000, {'usedHeapSizeBefore': 1000}),
             chromeTimelineEvents.end('GCEvent', 2000, {'usedHeapSizeAfter': 0}),
           ])
               .readPerfLog()
               .then((events) => {
                 expect(events).toEqual([
                   normEvents.start('gc', 1.0, {'usedHeapSize': 1000}),
                   normEvents.end('gc', 2.0, {'usedHeapSize': 0, 'majorGc': false}),
                 ]);
                 async.done();
               });
         }));

      it('should ignore major gc from different processes',
         inject([AsyncTestCompleter], (async) => {
           createExtension([
             chromeTimelineEvents.start('GCEvent', 1000, {'usedHeapSizeBefore': 1000}),
             v8EventsOtherProcess.start('majorGC', 1100, null),
             v8EventsOtherProcess.end('majorGC', 1200, null),
             chromeTimelineEvents.end('GCEvent', 2000, {'usedHeapSizeAfter': 0}),
           ])
               .readPerfLog()
               .then((events) => {
                 expect(events).toEqual([
                   normEvents.start('gc', 1.0, {'usedHeapSize': 1000}),
                   normEvents.end('gc', 2.0, {'usedHeapSize': 0, 'majorGc': false}),
                 ]);
                 async.done();
               });
         }));

      it('should report major gc', inject([AsyncTestCompleter], (async) => {
           createExtension([
             chromeTimelineEvents.start('GCEvent', 1000, {'usedHeapSizeBefore': 1000}),
             v8Events.start('majorGC', 1100, null),
             v8Events.end('majorGC', 1200, null),
             chromeTimelineEvents.end('GCEvent', 2000, {'usedHeapSizeAfter': 0}),
           ])
               .readPerfLog()
               .then((events) => {
                 expect(events).toEqual([
                   normEvents.start('gc', 1.0, {'usedHeapSize': 1000}),
                   normEvents.end('gc', 2.0, {'usedHeapSize': 0, 'majorGc': true}),
                 ]);
                 async.done();
               });
         }));

      ['RecalculateStyles', 'Layout', 'UpdateLayerTree', 'Paint'].forEach((recordType) => {
        it(`should report ${recordType} as "render"`, inject([AsyncTestCompleter], (async) => {
             createExtension([
               chromeTimelineEvents.start(recordType, 1234),
               chromeTimelineEvents.end(recordType, 2345)
             ])
                 .readPerfLog()
                 .then((events) => {
                   expect(events).toEqual([
                     normEvents.start('render', 1.234),
                     normEvents.end('render', 2.345),
                   ]);
                   async.done();
                 });
           }));
      });

      it('should ignore FunctionCalls from webdriver', inject([AsyncTestCompleter], (async) => {
           createExtension([
             chromeTimelineEvents.start('FunctionCall', 0,
                                        {'data': {'scriptName': 'InjectedScript'}})
           ])
               .readPerfLog()
               .then((events) => {
                 expect(events).toEqual([]);
                 async.done();
               });
         }));


    });

    describe('readPerfLog Chrome45', () => {
      it('should normalize times to ms and forward ph and pid event properties',
         inject([AsyncTestCompleter], (async) => {
           createExtension([chromeTimelineV8Events.complete('FunctionCall', 1100, 5500, null)],
                           CHROME45_USER_AGENT)
               .readPerfLog()
               .then((events) => {
                 expect(events).toEqual([
                   normEvents.complete('script', 1.1, 5.5, null),
                 ]);
                 async.done();
               });
         }));

      it('should normalize "tdur" to "dur"', inject([AsyncTestCompleter], (async) => {
           var event = chromeTimelineV8Events.create('X', 'FunctionCall', 1100, null);
           event['tdur'] = 5500;
           createExtension([event], CHROME45_USER_AGENT)
               .readPerfLog()
               .then((events) => {
                 expect(events).toEqual([
                   normEvents.complete('script', 1.1, 5.5, null),
                 ]);
                 async.done();
               });
         }));

      it('should report FunctionCall events as "script"', inject([AsyncTestCompleter], (async) => {
           createExtension([chromeTimelineV8Events.start('FunctionCall', 0)], CHROME45_USER_AGENT)
               .readPerfLog()
               .then((events) => {
                 expect(events).toEqual([
                   normEvents.start('script', 0),
                 ]);
                 async.done();
               });
         }));

      it('should report minor gc', inject([AsyncTestCompleter], (async) => {
           createExtension(
               [
                 chromeTimelineV8Events.start('MinorGC', 1000, {'usedHeapSizeBefore': 1000}),
                 chromeTimelineV8Events.end('MinorGC', 2000, {'usedHeapSizeAfter': 0}),
               ],
               CHROME45_USER_AGENT)
               .readPerfLog()
               .then((events) => {
                 expect(events.length).toEqual(2);
                 expect(events[0]).toEqual(
                     normEvents.start('gc', 1.0, {'usedHeapSize': 1000, 'majorGc': false}));
                 expect(events[1])
                     .toEqual(normEvents.end('gc', 2.0, {'usedHeapSize': 0, 'majorGc': false}));
                 async.done();
               });
         }));

      it('should report major gc', inject([AsyncTestCompleter], (async) => {
           createExtension(
               [
                 chromeTimelineV8Events.start('MajorGC', 1000, {'usedHeapSizeBefore': 1000}),
                 chromeTimelineV8Events.end('MajorGC', 2000, {'usedHeapSizeAfter': 0}),
               ],
               CHROME45_USER_AGENT)
               .readPerfLog()
               .then((events) => {
                 expect(events.length).toEqual(2);
                 expect(events[0])
                     .toEqual(normEvents.start('gc', 1.0, {'usedHeapSize': 1000, 'majorGc': true}));
                 expect(events[1])
                     .toEqual(normEvents.end('gc', 2.0, {'usedHeapSize': 0, 'majorGc': true}));
                 async.done();
               });
         }));

      ['Layout', 'UpdateLayerTree', 'Paint'].forEach((recordType) => {
        it(`should report ${recordType} as "render"`, inject([AsyncTestCompleter], (async) => {
             createExtension(
                 [
                   chrome45TimelineEvents.start(recordType, 1234),
                   chrome45TimelineEvents.end(recordType, 2345)
                 ],
                 CHROME45_USER_AGENT)
                 .readPerfLog()
                 .then((events) => {
                   expect(events).toEqual([
                     normEvents.start('render', 1.234),
                     normEvents.end('render', 2.345),
                   ]);
                   async.done();
                 });
           }));
      });

      it(`should report UpdateLayoutTree as "render"`, inject([AsyncTestCompleter], (async) => {
           createExtension(
               [
                 chromeBlinkTimelineEvents.start('UpdateLayoutTree', 1234),
                 chromeBlinkTimelineEvents.end('UpdateLayoutTree', 2345)
               ],
               CHROME45_USER_AGENT)
               .readPerfLog()
               .then((events) => {
                 expect(events).toEqual([
                   normEvents.start('render', 1.234),
                   normEvents.end('render', 2.345),
                 ]);
                 async.done();
               });
         }));



      it('should ignore FunctionCalls from webdriver', inject([AsyncTestCompleter], (async) => {
           createExtension([
             chromeTimelineV8Events.start('FunctionCall', 0,
                                          {'data': {'scriptName': 'InjectedScript'}})
           ])
               .readPerfLog()
               .then((events) => {
                 expect(events).toEqual([]);
                 async.done();
               });
         }));

      it('should ignore FunctionCalls with empty scriptName',
         inject([AsyncTestCompleter], (async) => {
           createExtension(
               [chromeTimelineV8Events.start('FunctionCall', 0, {'data': {'scriptName': ''}})])
               .readPerfLog()
               .then((events) => {
                 expect(events).toEqual([]);
                 async.done();
               });
         }));

      it('should report navigationStart', inject([AsyncTestCompleter], (async) => {
           createExtension([chromeBlinkUserTimingEvents.start('navigationStart', 1234)],
                           CHROME45_USER_AGENT)
               .readPerfLog()
               .then((events) => {
                 expect(events).toEqual([normEvents.start('navigationStart', 1.234)]);
                 async.done();
               });
         }));

      it('should report receivedData', inject([AsyncTestCompleter], (async) => {
           createExtension(
               [
                 chrome45TimelineEvents.instant('ResourceReceivedData', 1234,
                                                {'data': {'encodedDataLength': 987}})
               ],
               CHROME45_USER_AGENT)
               .readPerfLog()
               .then((events) => {
                 expect(events).toEqual(
                     [normEvents.instant('receivedData', 1.234, {'encodedDataLength': 987})]);
                 async.done();
               });
         }));

      it('should report sendRequest', inject([AsyncTestCompleter], (async) => {
           createExtension(
               [
                 chrome45TimelineEvents.instant(
                     'ResourceSendRequest', 1234,
                     {'data': {'url': 'http://here', 'requestMethod': 'GET'}})
               ],
               CHROME45_USER_AGENT)
               .readPerfLog()
               .then((events) => {
                 expect(events).toEqual([
                   normEvents.instant('sendRequest', 1.234,
                                      {'url': 'http://here', 'method': 'GET'})
                 ]);
                 async.done();
               });
         }));
    });

    describe('readPerfLog (common)', () => {

      it('should execute a dummy script before reading them',
         inject([AsyncTestCompleter], (async) => {
           // TODO(tbosch): This seems to be a bug in ChromeDriver:
           // Sometimes it does not report the newest events of the performance log
           // to the WebDriver client unless a script is executed...
           createExtension([]).readPerfLog().then((_) => {
             expect(log).toEqual([['executeScript', '1+1'], ['logs', 'performance']]);
             async.done();
           });
         }));

      ['Rasterize', 'CompositeLayers'].forEach((recordType) => {
        it(`should report ${recordType} as "render"`, inject([AsyncTestCompleter], (async) => {
             createExtension(
                 [
                   chromeTimelineEvents.start(recordType, 1234),
                   chromeTimelineEvents.end(recordType, 2345)
                 ],
                 CHROME45_USER_AGENT)
                 .readPerfLog()
                 .then((events) => {
                   expect(events).toEqual([
                     normEvents.start('render', 1.234),
                     normEvents.end('render', 2.345),
                   ]);
                   async.done();
                 });
           }));
      });

      describe('frame metrics', () => {
        it('should report ImplThreadRenderingStats as frame event',
           inject([AsyncTestCompleter], (async) => {
             createExtension([
               benchmarkEvents.instant('BenchmarkInstrumentation::ImplThreadRenderingStats', 1100,
                                       {'data': {'frame_count': 1}})
             ])
                 .readPerfLog()
                 .then((events) => {
                   expect(events).toEqual([
                     normEvents.create('i', 'frame', 1.1),
                   ]);
                   async.done();
                 });
           }));

        it('should not report ImplThreadRenderingStats with zero frames',
           inject([AsyncTestCompleter], (async) => {
             createExtension([
               benchmarkEvents.instant('BenchmarkInstrumentation::ImplThreadRenderingStats', 1100,
                                       {'data': {'frame_count': 0}})
             ])
                 .readPerfLog()
                 .then((events) => {
                   expect(events).toEqual([]);
                   async.done();
                 });
           }));

        it('should throw when ImplThreadRenderingStats contains more than one frame',
           inject([AsyncTestCompleter], (async) => {
             PromiseWrapper.catchError(
                 createExtension([
                   benchmarkEvents.instant('BenchmarkInstrumentation::ImplThreadRenderingStats',
                                           1100, {'data': {'frame_count': 2}})
                 ]).readPerfLog(),
                 (err): any => {
                   expect(() => { throw err; })
                       .toThrowError('multi-frame render stats not supported');
                   async.done();
                 });
           }));

      });

      it('should report begin timestamps', inject([AsyncTestCompleter], (async) => {
           createExtension([blinkEvents.create('S', 'someName', 1000)])
               .readPerfLog()
               .then((events) => {
                 expect(events).toEqual([normEvents.markStart('someName', 1.0)]);
                 async.done();
               });
         }));

      it('should report end timestamps', inject([AsyncTestCompleter], (async) => {
           createExtension([blinkEvents.create('F', 'someName', 1000)])
               .readPerfLog()
               .then((events) => {
                 expect(events).toEqual([normEvents.markEnd('someName', 1.0)]);
                 async.done();
               });
         }));

      it('should throw an error on buffer overflow', inject([AsyncTestCompleter], (async) => {
           PromiseWrapper.catchError(
               createExtension(
                   [
                     chromeTimelineEvents.start('FunctionCall', 1234),
                   ],
                   CHROME45_USER_AGENT, 'Tracing.bufferUsage')
                   .readPerfLog(),
               (err): any => {
                 expect(() => { throw err; })
                     .toThrowError('The DevTools trace buffer filled during the test!');
                 async.done();
               });
         }));

      it('should match chrome browsers', () => {
        expect(createExtension().supports({'browserName': 'chrome'})).toBe(true);

        expect(createExtension().supports({'browserName': 'Chrome'})).toBe(true);
      });

    });

  });
}

class MockDriverAdapter extends WebDriverAdapter {
  constructor(private _log: any[], private _events: any[], private _messageMethod: string) {
    super();
  }

  executeScript(script) {
    this._log.push(['executeScript', script]);
    return PromiseWrapper.resolve(null);
  }

  logs(type) {
    this._log.push(['logs', type]);
    if (type === 'performance') {
      return PromiseWrapper.resolve(this._events.map((event) => {
        return {
          'message': Json.stringify({'message': {'method': this._messageMethod, 'params': event}})
        };
      }));
    } else {
      return null;
    }
  }
}
