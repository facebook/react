/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

var _assign = require('object-assign');

var _extends = _assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var ReactDebugTool = require('./ReactDebugTool');
var lowPriorityWarning = require('./lowPriorityWarning');
var alreadyWarned = false;

function roundFloat(val) {
  var base = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;

  var n = Math.pow(10, base);
  return Math.floor(val * n) / n;
}

// Flow type definition of console.table is too strict right now, see
// https://github.com/facebook/flow/pull/2353 for updates
function consoleTable(table) {
  console.table(table);
}

function warnInProduction() {
  if (alreadyWarned) {
    return;
  }
  alreadyWarned = true;
  if (typeof console !== 'undefined') {
    console.error('ReactPerf is not supported in the production builds of React. ' + 'To collect measurements, please use the development build of React instead.');
  }
}

function getLastMeasurements() {
  if (!(process.env.NODE_ENV !== 'production')) {
    warnInProduction();
    return [];
  }

  return ReactDebugTool.getFlushHistory();
}

function getExclusive() {
  var flushHistory = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : getLastMeasurements();

  if (!(process.env.NODE_ENV !== 'production')) {
    warnInProduction();
    return [];
  }

  var aggregatedStats = {};
  var affectedIDs = {};

  function updateAggregatedStats(treeSnapshot, instanceID, timerType, applyUpdate) {
    var displayName = treeSnapshot[instanceID].displayName;

    var key = displayName;
    var stats = aggregatedStats[key];
    if (!stats) {
      affectedIDs[key] = {};
      stats = aggregatedStats[key] = {
        key: key,
        instanceCount: 0,
        counts: {},
        durations: {},
        totalDuration: 0
      };
    }
    if (!stats.durations[timerType]) {
      stats.durations[timerType] = 0;
    }
    if (!stats.counts[timerType]) {
      stats.counts[timerType] = 0;
    }
    affectedIDs[key][instanceID] = true;
    applyUpdate(stats);
  }

  flushHistory.forEach(function (flush) {
    var measurements = flush.measurements,
        treeSnapshot = flush.treeSnapshot;

    measurements.forEach(function (measurement) {
      var duration = measurement.duration,
          instanceID = measurement.instanceID,
          timerType = measurement.timerType;

      updateAggregatedStats(treeSnapshot, instanceID, timerType, function (stats) {
        stats.totalDuration += duration;
        stats.durations[timerType] += duration;
        stats.counts[timerType]++;
      });
    });
  });

  return Object.keys(aggregatedStats).map(function (key) {
    return _extends({}, aggregatedStats[key], {
      instanceCount: Object.keys(affectedIDs[key]).length
    });
  }).sort(function (a, b) {
    return b.totalDuration - a.totalDuration;
  });
}

function getInclusive() {
  var flushHistory = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : getLastMeasurements();

  if (!(process.env.NODE_ENV !== 'production')) {
    warnInProduction();
    return [];
  }

  var aggregatedStats = {};
  var affectedIDs = {};

  function updateAggregatedStats(treeSnapshot, instanceID, applyUpdate) {
    var _treeSnapshot$instanc = treeSnapshot[instanceID],
        displayName = _treeSnapshot$instanc.displayName,
        ownerID = _treeSnapshot$instanc.ownerID;

    var owner = treeSnapshot[ownerID];
    var key = (owner ? owner.displayName + ' > ' : '') + displayName;
    var stats = aggregatedStats[key];
    if (!stats) {
      affectedIDs[key] = {};
      stats = aggregatedStats[key] = {
        key: key,
        instanceCount: 0,
        inclusiveRenderDuration: 0,
        renderCount: 0
      };
    }
    affectedIDs[key][instanceID] = true;
    applyUpdate(stats);
  }

  var isCompositeByID = {};
  flushHistory.forEach(function (flush) {
    var measurements = flush.measurements;

    measurements.forEach(function (measurement) {
      var instanceID = measurement.instanceID,
          timerType = measurement.timerType;

      if (timerType !== 'render') {
        return;
      }
      isCompositeByID[instanceID] = true;
    });
  });

  flushHistory.forEach(function (flush) {
    var measurements = flush.measurements,
        treeSnapshot = flush.treeSnapshot;

    measurements.forEach(function (measurement) {
      var duration = measurement.duration,
          instanceID = measurement.instanceID,
          timerType = measurement.timerType;

      if (timerType !== 'render') {
        return;
      }
      updateAggregatedStats(treeSnapshot, instanceID, function (stats) {
        stats.renderCount++;
      });
      var nextParentID = instanceID;
      while (nextParentID) {
        // As we traverse parents, only count inclusive time towards composites.
        // We know something is a composite if its render() was called.
        if (isCompositeByID[nextParentID]) {
          updateAggregatedStats(treeSnapshot, nextParentID, function (stats) {
            stats.inclusiveRenderDuration += duration;
          });
        }
        nextParentID = treeSnapshot[nextParentID].parentID;
      }
    });
  });

  return Object.keys(aggregatedStats).map(function (key) {
    return _extends({}, aggregatedStats[key], {
      instanceCount: Object.keys(affectedIDs[key]).length
    });
  }).sort(function (a, b) {
    return b.inclusiveRenderDuration - a.inclusiveRenderDuration;
  });
}

function getWasted() {
  var flushHistory = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : getLastMeasurements();

  if (!(process.env.NODE_ENV !== 'production')) {
    warnInProduction();
    return [];
  }

  var aggregatedStats = {};
  var affectedIDs = {};

  function updateAggregatedStats(treeSnapshot, instanceID, applyUpdate) {
    var _treeSnapshot$instanc2 = treeSnapshot[instanceID],
        displayName = _treeSnapshot$instanc2.displayName,
        ownerID = _treeSnapshot$instanc2.ownerID;

    var owner = treeSnapshot[ownerID];
    var key = (owner ? owner.displayName + ' > ' : '') + displayName;
    var stats = aggregatedStats[key];
    if (!stats) {
      affectedIDs[key] = {};
      stats = aggregatedStats[key] = {
        key: key,
        instanceCount: 0,
        inclusiveRenderDuration: 0,
        renderCount: 0
      };
    }
    affectedIDs[key][instanceID] = true;
    applyUpdate(stats);
  }

  flushHistory.forEach(function (flush) {
    var measurements = flush.measurements,
        treeSnapshot = flush.treeSnapshot,
        operations = flush.operations;

    var isDefinitelyNotWastedByID = {};

    // Find host components associated with an operation in this batch.
    // Mark all components in their parent tree as definitely not wasted.
    operations.forEach(function (operation) {
      var instanceID = operation.instanceID;

      var nextParentID = instanceID;
      while (nextParentID) {
        isDefinitelyNotWastedByID[nextParentID] = true;
        nextParentID = treeSnapshot[nextParentID].parentID;
      }
    });

    // Find composite components that rendered in this batch.
    // These are potential candidates for being wasted renders.
    var renderedCompositeIDs = {};
    measurements.forEach(function (measurement) {
      var instanceID = measurement.instanceID,
          timerType = measurement.timerType;

      if (timerType !== 'render') {
        return;
      }
      renderedCompositeIDs[instanceID] = true;
    });

    measurements.forEach(function (measurement) {
      var duration = measurement.duration,
          instanceID = measurement.instanceID,
          timerType = measurement.timerType;

      if (timerType !== 'render') {
        return;
      }

      // If there was a DOM update below this component, or it has just been
      // mounted, its render() is not considered wasted.
      var updateCount = treeSnapshot[instanceID].updateCount;

      if (isDefinitelyNotWastedByID[instanceID] || updateCount === 0) {
        return;
      }

      // We consider this render() wasted.
      updateAggregatedStats(treeSnapshot, instanceID, function (stats) {
        stats.renderCount++;
      });

      var nextParentID = instanceID;
      while (nextParentID) {
        // Any parents rendered during this batch are considered wasted
        // unless we previously marked them as dirty.
        var isWasted = renderedCompositeIDs[nextParentID] && !isDefinitelyNotWastedByID[nextParentID];
        if (isWasted) {
          updateAggregatedStats(treeSnapshot, nextParentID, function (stats) {
            stats.inclusiveRenderDuration += duration;
          });
        }
        nextParentID = treeSnapshot[nextParentID].parentID;
      }
    });
  });

  return Object.keys(aggregatedStats).map(function (key) {
    return _extends({}, aggregatedStats[key], {
      instanceCount: Object.keys(affectedIDs[key]).length
    });
  }).sort(function (a, b) {
    return b.inclusiveRenderDuration - a.inclusiveRenderDuration;
  });
}

function getOperations() {
  var flushHistory = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : getLastMeasurements();

  if (!(process.env.NODE_ENV !== 'production')) {
    warnInProduction();
    return [];
  }

  var stats = [];
  flushHistory.forEach(function (flush, flushIndex) {
    var operations = flush.operations,
        treeSnapshot = flush.treeSnapshot;

    operations.forEach(function (operation) {
      var instanceID = operation.instanceID,
          type = operation.type,
          payload = operation.payload;
      var _treeSnapshot$instanc3 = treeSnapshot[instanceID],
          displayName = _treeSnapshot$instanc3.displayName,
          ownerID = _treeSnapshot$instanc3.ownerID;

      var owner = treeSnapshot[ownerID];
      var key = (owner ? owner.displayName + ' > ' : '') + displayName;

      stats.push({
        flushIndex: flushIndex,
        instanceID: instanceID,
        key: key,
        type: type,
        ownerID: ownerID,
        payload: payload
      });
    });
  });
  return stats;
}

function printExclusive(flushHistory) {
  if (!(process.env.NODE_ENV !== 'production')) {
    warnInProduction();
    return;
  }

  var stats = getExclusive(flushHistory);
  var table = stats.map(function (item) {
    var key = item.key,
        instanceCount = item.instanceCount,
        totalDuration = item.totalDuration;

    var renderCount = item.counts.render || 0;
    var renderDuration = item.durations.render || 0;
    return {
      Component: key,
      'Total time (ms)': roundFloat(totalDuration),
      'Instance count': instanceCount,
      'Total render time (ms)': roundFloat(renderDuration),
      'Average render time (ms)': renderCount ? roundFloat(renderDuration / renderCount) : undefined,
      'Render count': renderCount,
      'Total lifecycle time (ms)': roundFloat(totalDuration - renderDuration)
    };
  });
  consoleTable(table);
}

function printInclusive(flushHistory) {
  if (!(process.env.NODE_ENV !== 'production')) {
    warnInProduction();
    return;
  }

  var stats = getInclusive(flushHistory);
  var table = stats.map(function (item) {
    var key = item.key,
        instanceCount = item.instanceCount,
        inclusiveRenderDuration = item.inclusiveRenderDuration,
        renderCount = item.renderCount;

    return {
      'Owner > Component': key,
      'Inclusive render time (ms)': roundFloat(inclusiveRenderDuration),
      'Instance count': instanceCount,
      'Render count': renderCount
    };
  });
  consoleTable(table);
}

function printWasted(flushHistory) {
  if (!(process.env.NODE_ENV !== 'production')) {
    warnInProduction();
    return;
  }

  var stats = getWasted(flushHistory);
  var table = stats.map(function (item) {
    var key = item.key,
        instanceCount = item.instanceCount,
        inclusiveRenderDuration = item.inclusiveRenderDuration,
        renderCount = item.renderCount;

    return {
      'Owner > Component': key,
      'Inclusive wasted time (ms)': roundFloat(inclusiveRenderDuration),
      'Instance count': instanceCount,
      'Render count': renderCount
    };
  });
  consoleTable(table);
}

function printOperations(flushHistory) {
  if (!(process.env.NODE_ENV !== 'production')) {
    warnInProduction();
    return;
  }

  var stats = getOperations(flushHistory);
  var table = stats.map(function (stat) {
    return {
      'Owner > Node': stat.key,
      Operation: stat.type,
      Payload: typeof stat.payload === 'object' ? JSON.stringify(stat.payload) : stat.payload,
      'Flush index': stat.flushIndex,
      'Owner Component ID': stat.ownerID,
      'DOM Component ID': stat.instanceID
    };
  });
  consoleTable(table);
}

var warnedAboutPrintDOM = false;
function printDOM(measurements) {
  lowPriorityWarning(warnedAboutPrintDOM, '`ReactPerf.printDOM(...)` is deprecated. Use ' + '`ReactPerf.printOperations(...)` instead.');
  warnedAboutPrintDOM = true;
  return printOperations(measurements);
}

var warnedAboutGetMeasurementsSummaryMap = false;
function getMeasurementsSummaryMap(measurements) {
  lowPriorityWarning(warnedAboutGetMeasurementsSummaryMap, '`ReactPerf.getMeasurementsSummaryMap(...)` is deprecated. Use ' + '`ReactPerf.getWasted(...)` instead.');
  warnedAboutGetMeasurementsSummaryMap = true;
  return getWasted(measurements);
}

function start() {
  if (!(process.env.NODE_ENV !== 'production')) {
    warnInProduction();
    return;
  }

  ReactDebugTool.beginProfiling();
}

function stop() {
  if (!(process.env.NODE_ENV !== 'production')) {
    warnInProduction();
    return;
  }

  ReactDebugTool.endProfiling();
}

function isRunning() {
  if (!(process.env.NODE_ENV !== 'production')) {
    warnInProduction();
    return false;
  }

  return ReactDebugTool.isProfiling();
}

var ReactPerfAnalysis = {
  getLastMeasurements: getLastMeasurements,
  getExclusive: getExclusive,
  getInclusive: getInclusive,
  getWasted: getWasted,
  getOperations: getOperations,
  printExclusive: printExclusive,
  printInclusive: printInclusive,
  printWasted: printWasted,
  printOperations: printOperations,
  start: start,
  stop: stop,
  isRunning: isRunning,
  // Deprecated:
  printDOM: printDOM,
  getMeasurementsSummaryMap: getMeasurementsSummaryMap
};

module.exports = ReactPerfAnalysis;