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

var ReactPerf = require('ReactPerf');

var performanceNow = require('performanceNow');

// Don't try to save users less than 1.2ms (a number I made up)
var DONT_CARE_THRESHOLD = 1.2;

function getCleanComponents(measurement) {
  // For a given reconcile, look at which components did not actually
  // render anything to the DOM and return a mapping of their ID to
  // the amount of time it took to render the entire subtree.
  var cleanComponents = {};
  var dirtyLeafIDs = Object.keys(measurement.writes);
  for (var id in measurement.inclusive) {
    var isDirty = false;
    // For each component that rendered, see if a component that triggerd
    // a DOM op is in its subtree.
    for (var i = 0; i < dirtyLeafIDs.length; i++) {
      if (dirtyLeafIDs[i].indexOf(id) === 0) {
        isDirty = true;
        break;
      }
    }
    if (!isDirty) {
      cleanComponents[id] = measurement.inclusive[id];
    }
  }
  return cleanComponents;
}

function getSortedAdviceCandidates(measurements) {
  var candidates = {};

  // First aggregate all measurements by class name
  for (var i = 0; i < measurements.length; i++) {
    var cleanComponents = getCleanComponents(measurements[i]);
    for (var id in cleanComponents) {
      var key = measurements[i].displayNames[id] || '(unknown)';
      candidates[key] = (candidates[key] || 0) + cleanComponents[id];
    }
  }

  // Now make a sorted array with the results.
  var arr = [];
  for (key in candidates) {
    if (candidates[key] < DONT_CARE_THRESHOLD) {
      continue;
    }

    arr.push({
      componentName: key,
      time: candidates[key]
    });
  }

  arr.sort(function(a, b) {
    return b.time - a.time;
  });

  return arr;
}

function getSortedRenderMethods(measurements) {
  var candidates = {};
  for (var i = 0; i < measurements.length; i++) {
    var measurement = measurements[i];
    for (var id in measurement.exclusive) {
      var displayName = measurement.displayNames[id];
      candidates[displayName] = candidates[displayName] || 0;
      candidates[displayName] += measurement.exclusive[id];
    }
  }

  // Now make a sorted array with the results.
  var arr = [];
  for (var displayName in candidates) {
    if (candidates[displayName] < DONT_CARE_THRESHOLD) {
      continue;
    }
    arr.push({
      componentName: displayName,
      time: candidates[displayName]
    });
  }

  arr.sort(function(a, b) {
    return b.time - a.time;
  });

  return arr;
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

  end: function() {
    // Find the component with the highest exclusive time
    // that was not written to.
    ReactPerf.enableMeasure = false;
  },

  getLastMeasurements: function() {
    return ReactDefaultPerf._allMeasurements;
  },

  printAdvice: function(measurements) {
    measurements = measurements || ReactDefaultPerf._allMeasurements;
    var candidates = getSortedAdviceCandidates(measurements);
    if (candidates.length === 0) {
      console.log('I have no performance advice for you at this time.');
      return;
    }
    console.log('I have identified', candidates.length, 'places where you could add shouldComponentUpdate():');
    console.table(candidates.map(function(candidate) {
      return {
        'Component class name': candidate.componentName,
        'Time you could save': candidate.time.toFixed(2) + 'ms'
      };
    }));
    console.log(
      'tl;dr adding shouldComponentUpdate() to',
      candidates[0].componentName,
      'could save you up to',
      candidates[0].time.toFixed(2),
      'ms for the total interaction recorded.'
    );
    console.log('For more information see https://gist.github.com/petehunt/8595248');
  },

  printExpensiveRenderMethods: function(measurements) {
    // TODO: i'm not sure if this is the best way to help out the user.
    measurements = measurements || ReactDefaultPerf._allMeasurements;
    var renderMethods = getSortedRenderMethods(measurements);
    console.log('The top', renderMethods.length, 'render() methods are:');
    console.table(renderMethods.map(function(renderMethod) {
      return {
        'Component class name': renderMethod.componentName,
        'Time it took (exclusive)': renderMethod.time.toFixed(2) + 'ms'
      };
    }));
    console.log('This data may or may not be actionable. Try ReactDefaultPerf.printAdvice() first before trying to optimize render() methods.');
  },

  measure: function(objName, fnName, func) {
    return function(...args) {
      if (fnName === 'flushBatchedUpdates') {
        ReactDefaultPerf._allMeasurements.push({
          exclusive: {},
          inclusive: {},
          counts: {},
          writes: {},
          displayNames: {}
        });
        return func.apply(this, args);
      } else if (objName === 'ReactDOMIDOperations') {
        var start = performanceNow();
        var rv = func.apply(this, args);
        var totalTime = performanceNow() - start;
        var writes =
          ReactDefaultPerf._allMeasurements[ReactDefaultPerf._allMeasurements.length - 1]
          .writes;

        if (fnName === 'dangerouslyProcessChildrenUpdates') {
          // special format
          args[0].forEach(function(update) {
            writes[update.parentID] = writes[update.parentID] || [];
            writes[update.parentID].push({
              type: fnName,
              time: totalTime
            });
          });
        } else {
          // basic format
          writes[args[0]] = writes[args[0]] || [];
          writes[args[0]].push({
            type: fnName,
            time: totalTime
          });
        }
        return rv;
      } else if (fnName === 'updateComponent' || fnName === '_renderValidatedComponent') {
        var entry = ReactDefaultPerf._allMeasurements[ReactDefaultPerf._allMeasurements.length - 1];
        if (fnName === 'updateComponent') {
          // Don't double-count
          entry.counts[this._rootNodeID] = entry.counts[this._rootNodeID] || 0;
          entry.counts[this._rootNodeID] += 1;
        }
        var start = performanceNow();
        var rv = func.apply(this, args);
        var totalTime = performanceNow() - start;

        var typeOfLog = fnName === 'updateComponent' ? entry.inclusive : entry.exclusive;
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
