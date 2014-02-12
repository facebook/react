/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDefaultPerf
 * @typechecks static-only
 */

var ReactMount = require('ReactMount');
var ReactPerf = require('ReactPerf');

var merge = require('merge');
var performanceNow = require('performanceNow');

// Don't try to save users less than 1.2ms (a number I made up)
var DONT_CARE_THRESHOLD = 1.2;

function getSummary(measurements, sortInclusive) {
  var candidates = {};
  var totalDOMTime = 0;
  var displayName;

  for (var i = 0; i < measurements.length; i++) {
    var measurement = measurements[i];
    var id;

    for (id in measurement.writes) {
      measurement.writes[id].forEach(function(write) {
        totalDOMTime += write.time;
      });
    }

    var allIDs = merge(measurement.exclusive, measurement.inclusive);

    for (id in allIDs) {
      displayName = measurement.displayNames[id];
      candidates[displayName] = candidates[displayName] || {
        inclusive: 0,
        exclusive: 0
      };
      if (measurement.exclusive[id]) {
        candidates[displayName].exclusive += measurement.exclusive[id];
      }
      if (measurement.inclusive[id]) {
        candidates[displayName].inclusive += measurement.inclusive[id];
      }
    }
  }

  // Now make a sorted array with the results.
  var arr = [];
  for (displayName in candidates) {
    if (candidates[displayName] < DONT_CARE_THRESHOLD) {
      continue;
    }
    arr.push({
      componentName: displayName,
      exclusiveTime: candidates[displayName].exclusive,
      inclusiveTime: candidates[displayName].inclusive
    });
  }

  if (sortInclusive) {
    arr.sort(function(a, b) {
      return b.inclusiveTime - a.inclusiveTime;
    });
  } else {
    arr.sort(function(a, b) {
      return b.exclusiveTime - a.exclusiveTime;
    });
  }

  return {componentClasses: arr, totalDOMTime: totalDOMTime};
}

var ReactDefaultPerf = {
  _allMeasurements: null, // last item in the list is the current one
  _injected: false,

  start: function() {
    if (!ReactDefaultPerf._injected) {
      ReactPerf.injection.injectMeasure(ReactDefaultPerf.measure);
    }

    ReactDefaultPerf._allMeasurements = [];
    ReactPerf.enableMeasure = true;
  },

  stop: function() {
    ReactPerf.enableMeasure = false;
  },

  getLastMeasurements: function() {
    return ReactDefaultPerf._allMeasurements;
  },

  printByExclusive: function(measurements) {
    ReactDefaultPerf.print(measurements, false);
  },

  printByInclusive: function(measurements) {
    ReactDefaultPerf.print(measurements, true);
  },

  print: function(measurements, sortInclusive) {
    measurements = measurements || ReactDefaultPerf._allMeasurements;
    var summary = getSummary(measurements, sortInclusive);
    console.table(summary.componentClasses.map(function(item) {
      return {
        'Component class name': item.componentName,
        'Inclusive time': item.inclusiveTime.toFixed(2) + ' ms',
        'Exclusive time': item.exclusiveTime.toFixed(2) + ' ms'
      };
    }));
    console.log('Total DOM time:', summary.totalDOMTime.toFixed(2) + ' ms');
  },

  _recordWrite: function(id, fnName, totalTime) {
    var writes =
      ReactDefaultPerf
        ._allMeasurements[ReactDefaultPerf._allMeasurements.length - 1]
        .writes;
    writes[id] = writes[id] || [];
    writes[id].push({
      type: fnName,
      time: totalTime
    });
  },

  measure: function(moduleName, fnName, func) {
    return function(...args) {
      var totalTime;
      var rv;
      var start;

      if (fnName === 'flushBatchedUpdates') {
        // A "measurement" is a set of metrics recorded for each flush. We want
        // to group the metrics for a given flush together so we can look at the
        // components that rendered and the DOM operations that actually
        // happened to determine the amount of "wasted work" performed.
        ReactDefaultPerf._allMeasurements.push({
          exclusive: {},
          inclusive: {},
          counts: {},
          writes: {},
          displayNames: {}
        });
        return func.apply(this, args);
      } else if (moduleName === 'ReactDOMIDOperations' ||
        moduleName === 'ReactComponentBrowserEnvironment') {
        start = performanceNow();
        rv = func.apply(this, args);
        totalTime = performanceNow() - start;

        if (fnName === 'mountImageIntoNode') {
          var mountID = ReactMount.getID(args[1]);
          ReactDefaultPerf._recordWrite(mountID, fnName, totalTime);
        } else if (fnName === 'dangerouslyProcessChildrenUpdates') {
          // special format
          args[0].forEach(function(update) {
            ReactDefaultPerf._recordWrite(update.parentID, fnName, totalTime);
          });
        } else {
          // basic format
          ReactDefaultPerf._recordWrite(args[0], fnName, totalTime);
        }
        return rv;
      } else if (fnName === 'updateComponent' ||
        fnName === '_renderValidatedComponent') {
        var isInclusive = fnName === 'updateComponent';
        var entry = ReactDefaultPerf._allMeasurements[
          ReactDefaultPerf._allMeasurements.length - 1
        ];
        if (isInclusive) {
          // Since both updateComponent() and _renderValidatedComponent() are
          // called for each render, only record the count for one of them.
          entry.counts[this._rootNodeID] = entry.counts[this._rootNodeID] || 0;
          entry.counts[this._rootNodeID] += 1;
        }
        start = performanceNow();
        rv = func.apply(this, args);
        totalTime = performanceNow() - start;

        var typeOfLog = isInclusive ? entry.inclusive : entry.exclusive;
        typeOfLog[this._rootNodeID] = typeOfLog[this._rootNodeID] || 0;
        typeOfLog[this._rootNodeID] += totalTime;

        entry.displayNames[this._rootNodeID] = this.constructor.displayName;

        return rv;
      } else {
        return func.apply(this, args);
      }
    };
  }
}

module.exports = ReactDefaultPerf;
