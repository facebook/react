// JSLitmus.js
//
// History:
//   2008-10-27: Initial release
//   2008-11-09: Account for iteration loop overhead
//   2008-11-13: Added OS detection
//   2009-02-25: Create tinyURL automatically, shift-click runs tests in reverse
//
// Copyright (c) 2008-2009, Robert Kieffer
// All Rights Reserved
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the
// Software), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// THE SOFTWARE IS PROVIDED AS IS, WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

(function() {
  // Private methods and state

  // Get platform info but don't go crazy trying to recognize everything
  // that's out there.  This is just for the major platforms and OSes.
  var platform = 'unknown platform', ua = navigator.userAgent;

  // Detect OS
  var oses = ['Windows','iPhone OS','(Intel |PPC )?Mac OS X','Linux'].join('|');
  var pOS = new RegExp('((' + oses + ') [^ \);]*)').test(ua) ? RegExp.$1 : null;
  if (!pOS) pOS = new RegExp('((' + oses + ')[^ \);]*)').test(ua) ? RegExp.$1 : null;

  // Detect browser
  var pName = /(Chrome|MSIE|Safari|Opera|Firefox)/.test(ua) ? RegExp.$1 : null;

  // Detect version
  var vre = new RegExp('(Version|' + pName + ')[ \/]([^ ;]*)');
  var pVersion = (pName && vre.test(ua)) ? RegExp.$2 : null;
  var platform = (pOS && pName && pVersion) ? pName + ' '  + pVersion + ' on ' + pOS : 'unknown platform';

  /**
  * A smattering of methods that are needed to implement the JSLitmus testbed.
  */
  var jsl = {
    /**
    * Enhanced version of escape()
    */
    escape: function(s) {
      s = s.replace(/,/g, '\\,');
      s = escape(s);
      s = s.replace(/\+/g, '%2b');
      s = s.replace(/ /g, '+');
      return s;
    },

    /**
    * Get an element by ID.
    */
    $: function(id) {
      return document.getElementById(id);
    },

    /**
    * Null function
    */
    F: function() {},

    /**
    * Set the status shown in the UI
    */
    status: function(msg) {
      var el = jsl.$('jsl_status');
      if (el) el.innerHTML = msg || '';
    },

    /**
    * Convert a number to an abbreviated string like, "15K" or "10M"
    */
    toLabel: function(n) {
      if (n == Infinity) {
        return 'Infinity';
      } else if (n > 1e9) {
        n = Math.round(n/1e8);
        return n/10 + 'B';
      } else if (n > 1e6) {
        n = Math.round(n/1e5);
        return n/10 + 'M';
      } else if (n > 1e3) {
        n = Math.round(n/1e2);
        return n/10 + 'K';
      }
      return n;
    },

    /**
    * Copy properties from src to dst
    */
    extend: function(dst, src) {
      for (var k in src) dst[k] = src[k]; return dst;
    },

    /**
    * Like Array.join(), but for the key-value pairs in an object
    */
    join: function(o, delimit1, delimit2) {
      if (o.join) return o.join(delimit1);  // If it's an array
      var pairs = [];
      for (var k in o) pairs.push(k + delimit1 + o[k]);
      return pairs.join(delimit2);
    },

    /**
    * Array#indexOf isn't supported in IE, so we use this as a cross-browser solution
    */
    indexOf: function(arr, o) {
      if (arr.indexOf) return arr.indexOf(o);
      for (var i = 0; i < this.length; i++) if (arr[i] === o) return i;
      return -1;
    }
  };

  /**
  * Test manages a single test (created with
  * JSLitmus.test())
  * 
  * @private
  */
  var Test = function (name, f) {
    if (!f) throw new Error('Undefined test function');
    if (!(/function[^\(]*\(([^,\)]*)/).test(f.toString())) {
      throw new Error('"' + name + '" test: Test is not a valid Function object');
    }
    this.loopArg = RegExp.$1;
    this.name = name;
    this.f = f;
  };
  
  jsl.extend(Test, /** @lends Test */ {
    /** Calibration tests for establishing iteration loop overhead */
    CALIBRATIONS: [
      new Test('calibrating loop', function(count) {while (count--);}),
      new Test('calibrating function', jsl.F)
    ],

    /**
    * Run calibration tests.  Returns true if calibrations are not yet
    * complete (in which case calling code should run the tests yet again).
    * onCalibrated - Callback to invoke when calibrations have finished
    */
    calibrate: function(onCalibrated) {
      for (var i = 0; i < Test.CALIBRATIONS.length; i++) { 
        var cal = Test.CALIBRATIONS[i];
        if (cal.running) return true;
        if (!cal.count) {
          cal.isCalibration = true;
          cal.onStop = onCalibrated;
          //cal.MIN_TIME = .1; // Do calibrations quickly
          cal.run(2e4);
          return true;
        }
      }
      return false;
    }
  });

  jsl.extend(Test.prototype, {/** @lends Test.prototype */
    /** Initial number of iterations */
    INIT_COUNT: 10,
    /** Max iterations allowed (i.e. used to detect bad looping functions) */
    MAX_COUNT: 1e9,
    /** Minimum time a test should take to get valid results (secs) */
    MIN_TIME: .5,

    /** Callback invoked when test state changes */
    onChange: jsl.F,

    /** Callback invoked when test is finished */
    onStop: jsl.F,

    /**
     * Reset test state
     */
    reset: function() {
      delete this.count;
      delete this.time;
      delete this.running;
      delete this.error;
    },

    /**
    * Run the test (in a timeout). We use a timeout to make sure the browser
    * has a chance to finish rendering any UI changes we've made, like
    * updating the status message.
    */
    run: function(count) {
      count = count || this.INIT_COUNT;
      jsl.status(this.name + ' x ' + count);
      this.running = true;
      var me = this;
      setTimeout(function() {me._run(count);}, 200);
    },

    /**
     * The nuts and bolts code that actually runs a test
     */
    _run: function(count) {
      var me = this;

      // Make sure calibration tests have run
      if (!me.isCalibration && Test.calibrate(function() {me.run(count);})) return;
      this.error = null;

      try {
        var start, f = this.f, now, i = count;

        // Start the timer
        start = new Date();

        // Now for the money shot.  If this is a looping function ...
        if (this.loopArg) {
          // ... let it do the iteration itself
          f(count);
        } else {
          // ... otherwise do the iteration for it
          while (i--) f();
        }

        // Get time test took (in secs)
        this.time = Math.max(1,new Date() - start)/1000;

        // Store iteration count and per-operation time taken
        this.count = count;
        this.period = this.time/count;

        // Do we need to do another run?
        this.running = this.time <= this.MIN_TIME;

        // ... if so, compute how many times we should iterate
        if (this.running) {
          // Bump the count to the nearest power of 2
          var x = this.MIN_TIME/this.time;
          var pow = Math.pow(2, Math.max(1, Math.ceil(Math.log(x)/Math.log(2))));
          count *= pow;
          if (count > this.MAX_COUNT) {
            throw new Error('Max count exceeded.  If this test uses a looping function, make sure the iteration loop is working properly.');
          }
        }
      } catch (e) {
        // Exceptions are caught and displayed in the test UI
        this.reset();
        this.error = e;
      }

      // Figure out what to do next
      if (this.running) {
        me.run(count);
      } else {
        jsl.status('');
        me.onStop(me);
      }

      // Finish up
      this.onChange(this);
    },

    /**
    * Get the number of operations per second for this test.
    * 
    * @param normalize if true, iteration loop overhead taken into account
    */
    getHz: function(/**Boolean*/ normalize) {
      var p = this.period;

      // Adjust period based on the calibration test time
      if (normalize && !this.isCalibration) {
        var cal = Test.CALIBRATIONS[this.loopArg ? 0 : 1];

        // If the period is within 20% of the calibration time, then zero the
        // it out
        p = p < cal.period*1.2 ? 0 : p - cal.period;
      }

      return Math.round(1/p);
    },

    /**
    * Get a friendly string describing the test
    */
    toString: function() {
      return this.name + ' - '  + this.time/this.count + ' secs';
    }
  });

  // CSS we need for the UI
  var STYLESHEET = '<style> \
    #jslitmus {font-family:sans-serif; font-size: 12px;} \
    #jslitmus a {text-decoration: none;} \
    #jslitmus a:hover {text-decoration: underline;} \
    #jsl_status { \
      margin-top: 10px; \
      font-size: 10px; \
      color: #888; \
    } \
    A IMG  {border:none} \
    #test_results { \
      margin-top: 10px; \
      font-size: 12px; \
      font-family: sans-serif; \
      border-collapse: collapse; \
      border-spacing: 0px; \
    } \
    #test_results th, #test_results td { \
      border: solid 1px #ccc; \
      vertical-align: top; \
      padding: 3px; \
    } \
    #test_results th { \
      vertical-align: bottom; \
      background-color: #ccc; \
      padding: 1px; \
      font-size: 10px; \
    } \
    #test_results #test_platform { \
      color: #444; \
      text-align:center; \
    } \
    #test_results .test_row { \
      color: #006; \
      cursor: pointer; \
    } \
    #test_results .test_nonlooping { \
      border-left-style: dotted; \
      border-left-width: 2px; \
    } \
    #test_results .test_looping { \
      border-left-style: solid; \
      border-left-width: 2px; \
    } \
    #test_results .test_name {white-space: nowrap;} \
    #test_results .test_pending { \
    } \
    #test_results .test_running { \
      font-style: italic; \
    } \
    #test_results .test_done {} \
    #test_results .test_done { \
      text-align: right; \
      font-family: monospace; \
    } \
    #test_results .test_error {color: #600;} \
    #test_results .test_error .error_head {font-weight:bold;} \
    #test_results .test_error .error_body {font-size:85%;} \
    #test_results .test_row:hover td { \
      background-color: #ffc; \
      text-decoration: underline; \
    } \
    #chart { \
      margin: 10px 0px; \
      width: 250px; \
    } \
    #chart img { \
      border: solid 1px #ccc; \
      margin-bottom: 5px; \
    } \
    #chart #tiny_url { \
      height: 40px; \
      width: 250px; \
    } \
    #jslitmus_credit { \
      font-size: 10px; \
      color: #888; \
      margin-top: 8px; \
    } \
    </style>';

  // HTML markup for the UI
  var MARKUP = '<div id="jslitmus"> \
      <button onclick="JSLitmus.runAll(event)">Run Tests</button> \
      <button id="stop_button" disabled="disabled" onclick="JSLitmus.stop()">Stop Tests</button> \
      <br \> \
      <br \> \
      <input type="checkbox" style="vertical-align: middle" id="test_normalize" checked="checked" onchange="JSLitmus.renderAll()""> Normalize results \
      <table id="test_results"> \
        <colgroup> \
          <col /> \
          <col width="100" /> \
        </colgroup> \
        <tr><th id="test_platform" colspan="2">' + platform + '</th></tr> \
        <tr><th>Test</th><th>Ops/sec</th></tr> \
        <tr id="test_row_template" class="test_row" style="display:none"> \
          <td class="test_name"></td> \
          <td class="test_result">Ready</td> \
        </tr> \
      </table> \
      <div id="jsl_status"></div> \
      <div id="chart" style="display:none"> \
      <a id="chart_link" target="_blank"><img id="chart_image"></a> \
      TinyURL (for chart): \
      <iframe id="tiny_url" frameBorder="0" scrolling="no" src=""></iframe> \
      </div> \
      <a id="jslitmus_credit" title="JSLitmus home page" href="http://code.google.com/p/jslitmus" target="_blank">Powered by JSLitmus</a> \
    </div>';

  /**
   * The public API for creating and running tests
   */
  window.JSLitmus = {
    /** The list of all tests that have been registered with JSLitmus.test */
    _tests: [],
    /** The queue of tests that need to be run */
    _queue: [],

    /**
    * The parsed query parameters the current page URL.  This is provided as a
    * convenience for test functions - it's not used by JSLitmus proper
    */
    params: {},

    /**
     * Initialize
     */
    _init: function() {
      // Parse query params into JSLitmus.params[] hash
      var match = (location + '').match(/([^?#]*)(#.*)?$/);
      if (match) {
        var pairs = match[1].split('&');
        for (var i = 0; i < pairs.length; i++) {
          var pair = pairs[i].split('=');
          if (pair.length > 1) {
            var key = pair.shift();
            var value = pair.length > 1 ? pair.join('=') : pair[0];
            this.params[key] = value;
          }
        }
      }

      // Write out the stylesheet.  We have to do this here because IE
      // doesn't honor sheets written after the document has loaded.
      document.write(STYLESHEET);

      // Setup the rest of the UI once the document is loaded
      if (window.addEventListener) {
        window.addEventListener('load', this._setup, false);
      } else if (document.addEventListener) {
        document.addEventListener('load', this._setup, false);
      } else if (window.attachEvent) {
        window.attachEvent('onload', this._setup);
      }

      return this;
    },

    /**
     * Set up the UI
     */
    _setup: function() {
      var el = jsl.$('jslitmus_container');
      if (!el) document.body.appendChild(el = document.createElement('div'));

      el.innerHTML = MARKUP;

      // Render the UI for all our tests
      for (var i=0; i < JSLitmus._tests.length; i++)
        JSLitmus.renderTest(JSLitmus._tests[i]);
    },

    /**
     * (Re)render all the test results
     */
    renderAll: function() {
      for (var i = 0; i < JSLitmus._tests.length; i++)
        JSLitmus.renderTest(JSLitmus._tests[i]);
      JSLitmus.renderChart();
    },

    /**
     * (Re)render the chart graphics
     */
    renderChart: function() {
      var url = JSLitmus.chartUrl();
      jsl.$('chart_link').href = url;
      jsl.$('chart_image').src = url;
      jsl.$('chart').style.display = '';

      // Update the tiny URL
      jsl.$('tiny_url').src = 'http://tinyurl.com/api-create.php?url='+escape(url);
    },

    /**
     * (Re)render the results for a specific test
     */
    renderTest: function(test) {
      // Make a new row if needed
      if (!test._row) {
        var trow = jsl.$('test_row_template');
        if (!trow) return;

        test._row = trow.cloneNode(true);
        test._row.style.display = '';
        test._row.id = '';
        test._row.onclick = function() {JSLitmus._queueTest(test);};
        test._row.title = 'Run ' + test.name + ' test';
        trow.parentNode.appendChild(test._row);
        test._row.cells[0].innerHTML = test.name;
      }

      var cell = test._row.cells[1];
      var cns = [test.loopArg ? 'test_looping' : 'test_nonlooping'];

      if (test.error) {
        cns.push('test_error');
        cell.innerHTML = 
        '<div class="error_head">' + test.error + '</div>' +
        '<ul class="error_body"><li>' +
          jsl.join(test.error, ': ', '</li><li>') +
          '</li></ul>';
      } else {
        if (test.running) {
          cns.push('test_running');
          cell.innerHTML = 'running';
        } else if (jsl.indexOf(JSLitmus._queue, test) >= 0) {
          cns.push('test_pending');
          cell.innerHTML = 'pending';
        } else if (test.count) {
          cns.push('test_done');
          var hz = test.getHz(jsl.$('test_normalize').checked);
          cell.innerHTML = hz != Infinity ? hz : '&infin;';
        } else {
          cell.innerHTML = 'ready';
        }
      }
      cell.className = cns.join(' ');
    },

    /**
     * Create a new test
     */
    test: function(name, f) {
      // Create the Test object
      var test = new Test(name, f);
      JSLitmus._tests.push(test);

      // Re-render if the test state changes
      test.onChange = JSLitmus.renderTest;

      // Run the next test if this one finished
      test.onStop = function(test) {
        if (JSLitmus.onTestFinish) JSLitmus.onTestFinish(test);
        JSLitmus.currentTest = null;
        JSLitmus._nextTest();
      };

      // Render the new test
      this.renderTest(test);
    },

    /**
     * Add all tests to the run queue
     */
    runAll: function(e) {
      e = e || window.event;
      var reverse = e && e.shiftKey, len = JSLitmus._tests.length;
      for (var i = 0; i < len; i++) {
        JSLitmus._queueTest(JSLitmus._tests[!reverse ? i : (len - i - 1)]);
      }
    },

    /**
     * Remove all tests from the run queue.  The current test has to finish on
     * it's own though
     */
    stop: function() {
      while (JSLitmus._queue.length) {
        var test = JSLitmus._queue.shift();
        JSLitmus.renderTest(test);
      }
    },

    /**
     * Run the next test in the run queue
     */
    _nextTest: function() {
      if (!JSLitmus.currentTest) {
        var test = JSLitmus._queue.shift();
        if (test) {
          jsl.$('stop_button').disabled = false;
          JSLitmus.currentTest = test;
          test.run();
          JSLitmus.renderTest(test);
          if (JSLitmus.onTestStart) JSLitmus.onTestStart(test);
        } else {
          jsl.$('stop_button').disabled = true;
          JSLitmus.renderChart();
        }
      }
    },

    /**
     * Add a test to the run queue
     */
    _queueTest: function(test) {
      if (jsl.indexOf(JSLitmus._queue, test) >= 0) return;
      JSLitmus._queue.push(test);
      JSLitmus.renderTest(test);
      JSLitmus._nextTest();
    },

    /**
     * Generate a Google Chart URL that shows the data for all tests
     */
    chartUrl: function() {
      var n = JSLitmus._tests.length, markers = [], data = [];
      var d, min = 0, max = -1e10;
      var normalize = jsl.$('test_normalize').checked;

      // Gather test data
      for (var i=0; i < JSLitmus._tests.length; i++) {
        var test = JSLitmus._tests[i];
        if (test.count) {
          var hz = test.getHz(normalize);
          var v = hz != Infinity ? hz : 0;
          data.push(v);
          markers.push('t' + jsl.escape(test.name + '(' + jsl.toLabel(hz)+ ')') + ',000000,0,' +
            markers.length + ',10');
          max = Math.max(v, max);
        }
      }
      if (markers.length <= 0) return null;

      // Build chart title
      var title = document.getElementsByTagName('title');
      title = (title && title.length) ? title[0].innerHTML : null;
      var chart_title = [];
      if (title) chart_title.push(title);
      chart_title.push('Ops/sec (' + platform + ')');

      // Build labels
      var labels = [jsl.toLabel(min), jsl.toLabel(max)];

      var w = 250, bw = 15;
      var bs = 5;
      var h = markers.length*(bw + bs) + 30 + chart_title.length*20;

      var params = {
        chtt: escape(chart_title.join('|')),
        chts: '000000,10',
        cht: 'bhg',                     // chart type
        chd: 't:' + data.join(','),     // data set
        chds: min + ',' + max,          // max/min of data
        chxt: 'x',                      // label axes
        chxl: '0:|' + labels.join('|'), // labels
        chsp: '0,1',
        chm: markers.join('|'),         // test names
        chbh: [bw, 0, bs].join(','),    // bar widths
        // chf: 'bg,lg,0,eeeeee,0,eeeeee,.5,ffffff,1', // gradient
        chs: w + 'x' + h
      };
      return 'http://chart.apis.google.com/chart?' + jsl.join(params, '=', '&');
    } 
  };

  JSLitmus._init();
})();