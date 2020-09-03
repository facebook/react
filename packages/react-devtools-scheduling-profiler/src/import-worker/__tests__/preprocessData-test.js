/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

import preprocessData, {
  getLanesFromTransportDecimalBitmask,
} from '../preprocessData';
import {REACT_TOTAL_NUM_LANES} from '../../constants';

// Disable quotes rule in the whole file as we paste raw JSON as test inputs and
// Prettier will already format the remaining quotes.
/* eslint-disable quotes */

describe(getLanesFromTransportDecimalBitmask, () => {
  it('should return array of lane numbers from bitmask string', () => {
    expect(getLanesFromTransportDecimalBitmask('1')).toEqual([0]);
    expect(getLanesFromTransportDecimalBitmask('512')).toEqual([9]);
    expect(getLanesFromTransportDecimalBitmask('3')).toEqual([0, 1]);
    expect(getLanesFromTransportDecimalBitmask('1234')).toEqual([
      1,
      4,
      6,
      7,
      10,
    ]); // 2 + 16 + 64 + 128 + 1024
    expect(
      getLanesFromTransportDecimalBitmask('1073741824'), // 0b1000000000000000000000000000000
    ).toEqual([30]);
    expect(
      getLanesFromTransportDecimalBitmask('2147483647'), // 0b1111111111111111111111111111111
    ).toEqual(Array.from(Array(31).keys()));
  });

  it('should return empty array if laneBitmaskString is not a bitmask', () => {
    expect(getLanesFromTransportDecimalBitmask('')).toEqual([]);
    expect(getLanesFromTransportDecimalBitmask('hello')).toEqual([]);
    expect(getLanesFromTransportDecimalBitmask('-1')).toEqual([]);
    expect(getLanesFromTransportDecimalBitmask('-0')).toEqual([]);
  });

  it('should ignore lanes outside REACT_TOTAL_NUM_LANES', () => {
    // Sanity check; this test may need to be updated when the no. of fiber
    // lanes are changed.
    expect(REACT_TOTAL_NUM_LANES).toBe(31);

    expect(
      getLanesFromTransportDecimalBitmask(
        '4294967297', // 2^32 + 1
      ),
    ).toEqual([0]);
  });
});

describe(preprocessData, () => {
  it('should throw given an empty timeline', () => {
    expect(() => preprocessData([])).toThrow();
  });

  it('should throw given a timeline with no Profile event', () => {
    expect(() =>
      // prettier-ignore
      preprocessData([
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--schedule-render-512-","ph":"R","pid":9312,"tid":10252,"ts":8994056569,"tts":1816966},
      ]),
    ).toThrow();
  });

  it('should return empty data given a timeline with no React scheduling profiling marks', () => {
    expect(
      // prettier-ignore
      preprocessData([
        {"args":{"data":{"startTime":8993778496}},"cat":"disabled-by-default-v8.cpu_profiler","id":"0x1","name":"Profile","ph":"P","pid":9312,"tid":10252,"ts":8993778520,"tts":1614266},
        {"pid":57632,"tid":38659,"ts":874860756135,"ph":"X","cat":"disabled-by-default-devtools.timeline","name":"RunTask","dur":18,"tdur":19,"tts":8700284918,"args":{}},
        {"pid":57632,"tid":38659,"ts":874860756158,"ph":"X","cat":"disabled-by-default-devtools.timeline","name":"RunTask","dur":30,"tdur":30,"tts":8700284941,"args":{}},
        {"pid":57632,"tid":38659,"ts":874860756192,"ph":"X","cat":"disabled-by-default-devtools.timeline","name":"RunTask","dur":21,"tdur":20,"tts":8700284976,"args":{}},
        {"pid":57632,"tid":38659,"ts":874860756216,"ph":"X","cat":"disabled-by-default-devtools.timeline","name":"RunTask","dur":6,"tdur":5,"tts":8700285000,"args":{}},
        {"pid":57632,"tid":38659,"ts":874860756224,"ph":"X","cat":"disabled-by-default-devtools.timeline","name":"RunTask","dur":7,"tdur":6,"tts":8700285008,"args":{}},
        {"pid":57632,"tid":38659,"ts":874860756233,"ph":"X","cat":"disabled-by-default-devtools.timeline","name":"RunTask","dur":5,"tdur":4,"tts":8700285017,"args":{}},
      ]),
    ).toEqual({
      startTime: 8993778496,
      duration: 865866977.737,
      events: [],
      measures: [],
      flamechart: [],
      otherUserTimingMarks: [],
    });
  });

  it('should error if events and measures are incomplete', () => {
    const error = spyOnDevAndProd(console, 'error');
    // prettier-ignore
    preprocessData([
      {"args":{"data":{"startTime":8993778496}},"cat":"disabled-by-default-v8.cpu_profiler","id":"0x1","name":"Profile","ph":"P","pid":9312,"tid":10252,"ts":8993778520,"tts":1614266},
      {"args":{"data":{"navigationId":"1065756F5FDAD64BE45CA86B0BBC1F8B"}},"cat":"blink.user_timing","name":"--render-start-8","ph":"R","pid":1852,"tid":12484,"ts":42351664678,"tts":1512475},
    ]);
    expect(error).toHaveBeenCalled();
  });

  it('should error if work is completed without being started', () => {
    const error = spyOnDevAndProd(console, 'error');
    // prettier-ignore
    preprocessData([
      {"args":{"data":{"startTime":8993778496}},"cat":"disabled-by-default-v8.cpu_profiler","id":"0x1","name":"Profile","ph":"P","pid":9312,"tid":10252,"ts":8993778520,"tts":1614266},
      {"args":{"data":{"navigationId":"E082C30FBDA3ACEE0E7B5FD75F8B7F0D"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":17232,"tid":13628,"ts":264686513020,"tts":4082554},
    ]);
    expect(error).toHaveBeenCalled();
  });

  it('should process complete set of events (page load sample data)', () => {
    expect(
      // prettier-ignore
      preprocessData([
        {"args":{"data":{"documentLoaderURL":"https://concurrent-demo.now.sh/","isLoadingMainFrame":true,"navigationId":"43BC238A4FB7548146D3CD739C9C9434"},"frame":"FD65D9AFD04B1295CEA36B883F0FA82F"},"cat":"blink.user_timing","name":"navigationStart","ph":"R","pid":9312,"tid":10252,"ts":8993749139,"tts":1646191},
        {"args":{"data":{"startTime":8993778496}},"cat":"disabled-by-default-v8.cpu_profiler","id":"0x1","name":"Profile","ph":"P","pid":9312,"tid":10252,"ts":8993778520,"tts":1614266},
        {"args":{"frame":"FD65D9AFD04B1295CEA36B883F0FA82F"},"cat":"blink.user_timing","name":"fetchStart","ph":"R","pid":9312,"tid":10252,"ts":8993751576,"tts":1646197},
        {"args":{},"cat":"blink.user_timing","name":"requestStart","ph":"R","pid":9312,"tid":10252,"ts":8993757325,"tts":1612760},
        {"args":{"frame":"FD65D9AFD04B1295CEA36B883F0FA82F"},"cat":"blink.user_timing","name":"responseEnd","ph":"R","pid":9312,"tid":10252,"ts":8993762841,"tts":1652151},
        {"args":{"frame":"FD65D9AFD04B1295CEA36B883F0FA82F"},"cat":"blink.user_timing","name":"unloadEventStart","ph":"R","pid":9312,"tid":10252,"ts":8993777756,"tts":1646416},
        {"args":{"frame":"FD65D9AFD04B1295CEA36B883F0FA82F"},"cat":"blink.user_timing","name":"unloadEventEnd","ph":"R","pid":9312,"tid":10252,"ts":8993818104,"tts":1646419},
        {"args":{"frame":"FD65D9AFD04B1295CEA36B883F0FA82F"},"cat":"blink.user_timing,rail","name":"domLoading","ph":"R","pid":9312,"tid":10252,"ts":8993820215,"tts":1647488},
        {"args":{},"cat":"blink.user_timing","name":"requestStart","ph":"R","pid":9312,"tid":10252,"ts":8993886145,"tts":1771277},
        {"args":{},"cat":"blink.user_timing","name":"requestStart","ph":"R","pid":9312,"tid":10252,"ts":8993886881,"tts":1778953},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--schedule-render-512-","ph":"R","pid":9312,"tid":10252,"ts":8994056569,"tts":1816966},
        {"args":{"frame":"FD65D9AFD04B1295CEA36B883F0FA82F"},"cat":"blink.user_timing,rail","name":"domInteractive","ph":"R","pid":9312,"tid":10252,"ts":8994058638,"tts":1818851},
        {"args":{"frame":"FD65D9AFD04B1295CEA36B883F0FA82F"},"cat":"blink.user_timing,rail","name":"domContentLoadedEventStart","ph":"R","pid":9312,"tid":10252,"ts":8994058898,"tts":1819078},
        {"args":{"frame":"FD65D9AFD04B1295CEA36B883F0FA82F"},"cat":"blink.user_timing,rail","name":"domContentLoadedEventEnd","ph":"R","pid":9312,"tid":10252,"ts":8994060045,"tts":1820100},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994063789,"tts":1823183},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994069024,"tts":1826507},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994076204,"tts":1830657},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994084372,"tts":1837590},
        {"args":{"frame":"FD65D9AFD04B1295CEA36B883F0FA82F"},"cat":"blink.user_timing,rail","name":"domComplete","ph":"R","pid":9312,"tid":10252,"ts":8994085517,"tts":1838615},
        {"args":{"frame":"FD65D9AFD04B1295CEA36B883F0FA82F"},"cat":"blink.user_timing","name":"loadEventStart","ph":"R","pid":9312,"tid":10252,"ts":8994085552,"tts":1838649},
        {"args":{"frame":"FD65D9AFD04B1295CEA36B883F0FA82F"},"cat":"blink.user_timing","name":"loadEventEnd","ph":"R","pid":9312,"tid":10252,"ts":8994086738,"tts":1839690},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994088953,"tts":1840749},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994093942,"tts":1844455},
        {"args":{},"cat":"blink.user_timing","name":"requestStart","ph":"R","pid":9312,"tid":10252,"ts":8994119825,"tts":1877483},
        {"args":{},"cat":"blink.user_timing","name":"requestStart","ph":"R","pid":9312,"tid":10252,"ts":8994122516,"tts":1886344},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994136263,"tts":1871212},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994142733,"tts":1875838},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994149982,"tts":1880208},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994156615,"tts":1885309},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994163546,"tts":1887453},
        {"args":{},"cat":"blink.user_timing","name":"requestStart","ph":"R","pid":9312,"tid":10252,"ts":8994166081,"tts":1895751},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994173436,"tts":1894442},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994176556,"tts":1897176},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994184415,"tts":1904263},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994185162,"tts":1904938},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994192423,"tts":1910624},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994192714,"tts":1910872},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994200415,"tts":1917859},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994200637,"tts":1918062},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994208430,"tts":1924894},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994208681,"tts":1925124},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994216388,"tts":1932117},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994218048,"tts":1933622},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994225455,"tts":1940076},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994225790,"tts":1940391},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994233439,"tts":1947224},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994233711,"tts":1947473},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994241447,"tts":1954160},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994241755,"tts":1954426},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994249451,"tts":1961213},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994249743,"tts":1961494},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994257444,"tts":1968141},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994257858,"tts":1968525},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994265413,"tts":1975172},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994265691,"tts":1975416},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994273481,"tts":1981826},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994273850,"tts":1982112},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994281467,"tts":1988537},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994282202,"tts":1988894},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994289444,"tts":1994103},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994291602,"tts":1995165},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994299421,"tts":2000342},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994300163,"tts":2001009},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994309433,"tts":2005662},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994309681,"tts":2005897},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994317439,"tts":2012641},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994317709,"tts":2012890},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994325444,"tts":2019235},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994325719,"tts":2019477},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994333449,"tts":2026367},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994333730,"tts":2026617},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994341427,"tts":2033147},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994341728,"tts":2033411},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994349443,"tts":2040163},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994349708,"tts":2040409},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994357469,"tts":2047136},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994357820,"tts":2047465},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994365438,"tts":2054203},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994365697,"tts":2054434},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994373435,"tts":2061259},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994373705,"tts":2061502},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994381444,"tts":2068300},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994381690,"tts":2068529},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994389422,"tts":2075272},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994389708,"tts":2075518},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994397421,"tts":2082156},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994398070,"tts":2082726},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994405440,"tts":2088860},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994405684,"tts":2089091},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994413420,"tts":2095780},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994413689,"tts":2096021},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994421418,"tts":2102791},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994421702,"tts":2103047},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994429611,"tts":2110142},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994429835,"tts":2110349},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-suspend-0-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8994436841,"tts":2115594},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994437451,"tts":2116087},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994437941,"tts":2116287},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-suspend-1-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8994439235,"tts":2117153},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-suspend-2-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8994441050,"tts":2118088},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-suspend-3-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8994441951,"tts":2118783},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-suspend-4-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8994442698,"tts":2119371},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994443276,"tts":2119875},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994443448,"tts":2120040},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-suspend-0-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8994445176,"tts":2121499},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-suspend-1-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8994445697,"tts":2121968},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-suspend-2-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8994446236,"tts":2122460},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-suspend-3-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8994446778,"tts":2122951},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-suspend-4-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8994447344,"tts":2123444},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-yield","ph":"R","pid":9312,"tid":10252,"ts":8994449037,"tts":2124925},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994449280,"tts":2125142},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-suspend-0-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at SuspenseList\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8994449831,"tts":2125639},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-stop","ph":"R","pid":9312,"tid":10252,"ts":8994450864,"tts":2126555},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--commit-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994451820,"tts":2127417},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--layout-effects-start-512","ph":"R","pid":9312,"tid":10252,"ts":8994455732,"tts":2130777},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--schedule-state-update-1-ForceUpdateDemo_ForceUpdateDemo-\n    at ForceUpdateDemo_ForceUpdateDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:18:98)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8994457934,"tts":2132671},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--layout-effects-stop","ph":"R","pid":9312,"tid":10252,"ts":8994458421,"tts":2133089},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-1","ph":"R","pid":9312,"tid":10252,"ts":8994462600,"tts":2136847},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-stop","ph":"R","pid":9312,"tid":10252,"ts":8994464817,"tts":2138817},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--commit-start-1","ph":"R","pid":9312,"tid":10252,"ts":8994464844,"tts":2138843},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--layout-effects-start-1","ph":"R","pid":9312,"tid":10252,"ts":8994465763,"tts":2139664},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--layout-effects-stop","ph":"R","pid":9312,"tid":10252,"ts":8994465784,"tts":2139686},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--commit-stop","ph":"R","pid":9312,"tid":10252,"ts":8994466156,"tts":2140023},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--commit-stop","ph":"R","pid":9312,"tid":10252,"ts":8994466372,"tts":2140208},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-resolved-1-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8995573418,"tts":2205582},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-resolved-1-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8995573870,"tts":2205980},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-1024","ph":"R","pid":9312,"tid":10252,"ts":8995574538,"tts":2206568},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-suspend-0-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8995575662,"tts":2207534},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-suspend-2-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8995576307,"tts":2208142},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-suspend-3-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8995576659,"tts":2208445},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-suspend-4-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8995577001,"tts":2208736},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-stop","ph":"R","pid":9312,"tid":10252,"ts":8995577971,"tts":2209602},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--commit-start-1024","ph":"R","pid":9312,"tid":10252,"ts":8995578068,"tts":2209689},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--layout-effects-start-1024","ph":"R","pid":9312,"tid":10252,"ts":8995580101,"tts":2211495},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--layout-effects-stop","ph":"R","pid":9312,"tid":10252,"ts":8995580122,"tts":2211515},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--commit-stop","ph":"R","pid":9312,"tid":10252,"ts":8995580657,"tts":2211995},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-resolved-2-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8995644745,"tts":2217336},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-resolved-2-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8995645038,"tts":2217571},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-resolved-2-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8995645354,"tts":2217861},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-2048","ph":"R","pid":9312,"tid":10252,"ts":8995645494,"tts":2217999},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-suspend-0-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8995646312,"tts":2218721},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-suspend-3-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8995647134,"tts":2219450},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-suspend-4-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8995647462,"tts":2219740},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-stop","ph":"R","pid":9312,"tid":10252,"ts":8995648162,"tts":2220335},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--commit-start-2048","ph":"R","pid":9312,"tid":10252,"ts":8995648191,"tts":2220363},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--layout-effects-start-2048","ph":"R","pid":9312,"tid":10252,"ts":8995649260,"tts":2221320},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--layout-effects-stop","ph":"R","pid":9312,"tid":10252,"ts":8995649280,"tts":2221340},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--commit-stop","ph":"R","pid":9312,"tid":10252,"ts":8995649611,"tts":2221636},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-resolved-3-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8995758769,"tts":2228839},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-resolved-3-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8995759018,"tts":2229064},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-resolved-3-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8995759442,"tts":2229424},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-resolved-3-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8995759660,"tts":2229627},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-4096","ph":"R","pid":9312,"tid":10252,"ts":8995759857,"tts":2229803},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-suspend-0-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8995760575,"tts":2230456},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-suspend-4-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8995761666,"tts":2231399},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-stop","ph":"R","pid":9312,"tid":10252,"ts":8995762296,"tts":2231965},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--commit-start-4096","ph":"R","pid":9312,"tid":10252,"ts":8995762367,"tts":2232017},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--layout-effects-start-4096","ph":"R","pid":9312,"tid":10252,"ts":8995763427,"tts":2232966},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--layout-effects-stop","ph":"R","pid":9312,"tid":10252,"ts":8995763454,"tts":2232993},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--commit-stop","ph":"R","pid":9312,"tid":10252,"ts":8995763625,"tts":2233154},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-resolved-4-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8996158083,"tts":2252466},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-resolved-4-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8996158391,"tts":2252730},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-resolved-4-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8996158738,"tts":2253038},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-resolved-4-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8996158983,"tts":2253239},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-resolved-4-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8996159231,"tts":2253447},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-8192","ph":"R","pid":9312,"tid":10252,"ts":8996159465,"tts":2253624},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-suspend-0-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8996160268,"tts":2254312},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-stop","ph":"R","pid":9312,"tid":10252,"ts":8996161775,"tts":2255670},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--commit-start-8192","ph":"R","pid":9312,"tid":10252,"ts":8996161834,"tts":2255716},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--layout-effects-start-8192","ph":"R","pid":9312,"tid":10252,"ts":8996163031,"tts":2256754},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--layout-effects-stop","ph":"R","pid":9312,"tid":10252,"ts":8996163051,"tts":2256773},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--commit-stop","ph":"R","pid":9312,"tid":10252,"ts":8996163355,"tts":2257045},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-resolved-0-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8996357682,"tts":2267920},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-resolved-0-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8996357983,"tts":2268179},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-resolved-0-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at SuspenseList\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8996358231,"tts":2268389},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-resolved-0-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8996358538,"tts":2268679},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-resolved-0-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8996358786,"tts":2268867},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-resolved-0-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8996359042,"tts":2269066},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--suspense-resolved-0-ResourceButton-\n    at ResourceButton (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:295)\n    at Suspense\n    at div\n    at div\n    at SuspenseDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:36:713)\n    at App","ph":"R","pid":9312,"tid":10252,"ts":8996359296,"tts":2269264},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-start-16384","ph":"R","pid":9312,"tid":10252,"ts":8996359448,"tts":2269412},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--render-stop","ph":"R","pid":9312,"tid":10252,"ts":8996362873,"tts":2272363},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--commit-start-16384","ph":"R","pid":9312,"tid":10252,"ts":8996362944,"tts":2272420},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--layout-effects-start-16384","ph":"R","pid":9312,"tid":10252,"ts":8996364618,"tts":2273869},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--layout-effects-stop","ph":"R","pid":9312,"tid":10252,"ts":8996364645,"tts":2273895},
        {"args":{"data":{"navigationId":"43BC238A4FB7548146D3CD739C9C9434"}},"cat":"blink.user_timing","name":"--commit-stop","ph":"R","pid":9312,"tid":10252,"ts":8996365391,"tts":2274547},
      ]),
    ).toMatchSnapshot();
  });

  it('should process forced update event', () => {
    expect(
      // prettier-ignore
      preprocessData([
        {"args":{"data":{"startTime":40806924876}},"cat":"disabled-by-default-v8.cpu_profiler","id":"0x2","name":"Profile","ph":"P","pid":1852,"tid":12484,"ts":40806924880,"tts":996658},
        {"args":{"data":{"navigationId":"1065756F5FDAD64BE45CA86B0BBC1F8B"}},"cat":"blink.user_timing","name":"--schedule-forced-update-16-ForceUpdateDemo_ForceUpdateDemo-\n    at ForceUpdateDemo_ForceUpdateDemo (https://concurrent-demo.now.sh/static/js/main.c9f122eb.chunk.js:18:98)\n    at App","ph":"R","pid":1852,"tid":12484,"ts":40806988231,"tts":1037762},
        {"args":{"data":{"navigationId":"1065756F5FDAD64BE45CA86B0BBC1F8B"}},"cat":"blink.user_timing","name":"--render-start-16","ph":"R","pid":1852,"tid":12484,"ts":40806990146,"tts":1038890},
        {"args":{"data":{"navigationId":"1065756F5FDAD64BE45CA86B0BBC1F8B"}},"cat":"blink.user_timing","name":"--render-stop","ph":"R","pid":1852,"tid":12484,"ts":40806991123,"tts":1039401},
        {"args":{"data":{"navigationId":"1065756F5FDAD64BE45CA86B0BBC1F8B"}},"cat":"blink.user_timing","name":"--commit-start-16","ph":"R","pid":1852,"tid":12484,"ts":40806991170,"tts":1039447},
        {"args":{"data":{"navigationId":"1065756F5FDAD64BE45CA86B0BBC1F8B"}},"cat":"blink.user_timing","name":"--layout-effects-start-16","ph":"R","pid":1852,"tid":12484,"ts":40806992201,"tts":1040023},
        {"args":{"data":{"navigationId":"1065756F5FDAD64BE45CA86B0BBC1F8B"}},"cat":"blink.user_timing","name":"--layout-effects-stop","ph":"R","pid":1852,"tid":12484,"ts":40806992219,"tts":1040041},
        {"args":{"data":{"navigationId":"1065756F5FDAD64BE45CA86B0BBC1F8B"}},"cat":"blink.user_timing","name":"--commit-stop","ph":"R","pid":1852,"tid":12484,"ts":40806992337,"tts":1040149},
      ]),
    ).toMatchSnapshot();
  });

  it('should populate other user timing marks', () => {
    expect(
      // prettier-ignore
      preprocessData([
        {"args":{},"cat":"blink.user_timing","id":"0xcdf75f7c","name":"VCWithoutImage: root","ph":"n","pid":55132,"scope":"blink.user_timing","tid":775,"ts":458734963394},
        {"args":{"data":{"startTime":458738069897}},"cat":"disabled-by-default-v8.cpu_profiler","id":"0x4","name":"Profile","ph":"P","pid":55132,"tid":775,"ts":458738069898,"tts":27896428},
        {"args":{"data":{"navigationId":"B8774C733A75946C099FE21F8A0E8D38"}},"cat":"blink.user_timing","name":"--a-mark-that-looks-like-one-of-ours","ph":"R","pid":55132,"tid":775,"ts":458738256356,"tts":28082555},
        {"args":{"data":{"navigationId":"B8774C733A75946C099FE21F8A0E8D38"}},"cat":"blink.user_timing","name":"Some other mark","ph":"R","pid":55132,"tid":775,"ts":458738261491,"tts":28087691},
      ]).otherUserTimingMarks,
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "name": "VCWithoutImage: root",
          "timestamp": -3106.503,
        },
        Object {
          "name": "--a-mark-that-looks-like-one-of-ours",
          "timestamp": 186.459,
        },
        Object {
          "name": "Some other mark",
          "timestamp": 191.594,
        },
      ]
    `);
  });

  // TODO: Add test for flamechart parsing
});
