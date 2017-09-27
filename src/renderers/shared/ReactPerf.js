/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactPerf
 * @flow
 */

'use strict';

var ReactDebugTool = require('ReactDebugTool');
var lowPriorityWarning = require('lowPriorityWarning');
var alreadyWarned = false;

import type {FlushHistory} from 'ReactDebugTool';

function roundFloat(val, base = 2) {
  var n = Math.pow(10, base);
  return Math.floor(val * n) / n;
}

// Flow type definition of console.table is too strict right now, see
// https://github.com/facebook/flow/pull/2353 for updates
function consoleTable(table: Array<{[key: string]: any}>): void {
  console.table((table: any));
}

function warnInProduction() {
  if (alreadyWarned) {
    return;
  }
  alreadyWarned = true;
  if (typeof console !== 'undefined') {
    console.error(
      'ReactPerf is not supported in the production builds of React. ' +
        'To collect measurements, please use the development build of React instead.',
    );
  }
}

function getLastMeasurements() {
  if (!__DEV__) {
    warnInProduction();
    return [];
  }

  return ReactDebugTool.getFlushHistory();
}

function getExclusive(flushHistory = getLastMeasurements()) {
  if (!__DEV__) {
    warnInProduction();
    return [];
  }

  var aggregatedStats = {};
  var affectedIDs = {};

  function updateAggregatedStats(
    treeSnapshot,
    instanceID,
    timerType,
    applyUpdate,
  ) {
    var {displayName} = treeSnapshot[instanceID];
    var key = displayName;
    var stats = aggregatedStats[key];
    if (!stats) {
      affectedIDs[key] = {};
      stats = aggregatedStats[key] = {
        key,
        instanceCount: 0,
        counts: {},
        durations: {},
        totalDuration: 0,
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

  flushHistory.forEach(flush => {
    var {measurements, treeSnapshot} = flush;
    measurements.forEach(measurement => {
      var {duration, instanceID, timerType} = measurement;
      updateAggregatedStats(treeSnapshot, instanceID, timerType, stats => {
        stats.totalDuration += duration;
        stats.durations[timerType] += duration;
        stats.counts[timerType]++;
      });
    });
  });

  return Object.keys(aggregatedStats)
    .map(key => ({
      ...aggregatedStats[key],
      instanceCount: Object.keys(affectedIDs[key]).length,
    }))
    .sort((a, b) => b.totalDuration - a.totalDuration);
}

function getInclusive(flushHistory = getLastMeasurements()) {
  if (!__DEV__) {
    warnInProduction();
    return [];
  }

  var aggregatedStats = {};
  var affectedIDs = {};

  function updateAggregatedStats(treeSnapshot, instanceID, applyUpdate) {
    var {displayName, ownerID} = treeSnapshot[instanceID];
    var owner = treeSnapshot[ownerID];
    var key = (owner ? owner.displayName + ' > ' : '') + displayName;
    var stats = aggregatedStats[key];
    if (!stats) {
      affectedIDs[key] = {};
      stats = aggregatedStats[key] = {
        key,
        instanceCount: 0,
        inclusiveRenderDuration: 0,
        renderCount: 0,
      };
    }
    affectedIDs[key][instanceID] = true;
    applyUpdate(stats);
  }

  var isCompositeByID = {};
  flushHistory.forEach(flush => {
    var {measurements} = flush;
    measurements.forEach(measurement => {
      var {instanceID, timerType} = measurement;
      if (timerType !== 'render') {
        return;
      }
      isCompositeByID[instanceID] = true;
    });
  });

  flushHistory.forEach(flush => {
    var {measurements, treeSnapshot} = flush;
    measurements.forEach(measurement => {
      var {duration, instanceID, timerType} = measurement;
      if (timerType !== 'render') {
        return;
      }
      updateAggregatedStats(treeSnapshot, instanceID, stats => {
        stats.renderCount++;
      });
      var nextParentID = instanceID;
      while (nextParentID) {
        // As we traverse parents, only count inclusive time towards composites.
        // We know something is a composite if its render() was called.
        if (isCompositeByID[nextParentID]) {
          updateAggregatedStats(treeSnapshot, nextParentID, stats => {
            stats.inclusiveRenderDuration += duration;
          });
        }
        nextParentID = treeSnapshot[nextParentID].parentID;
      }
    });
  });

  return Object.keys(aggregatedStats)
    .map(key => ({
      ...aggregatedStats[key],
      instanceCount: Object.keys(affectedIDs[key]).length,
    }))
    .sort((a, b) => b.inclusiveRenderDuration - a.inclusiveRenderDuration);
}

function getWasted(flushHistory = getLastMeasurements()) {
  if (!__DEV__) {
    warnInProduction();
    return [];
  }

  var aggregatedStats = {};
  var affectedIDs = {};

  function updateAggregatedStats(treeSnapshot, instanceID, applyUpdate) {
    var {displayName, ownerID} = treeSnapshot[instanceID];
    var owner = treeSnapshot[ownerID];
    var key = (owner ? owner.displayName + ' > ' : '') + displayName;
    var stats = aggregatedStats[key];
    if (!stats) {
      affectedIDs[key] = {};
      stats = aggregatedStats[key] = {
        key,
        instanceCount: 0,
        inclusiveRenderDuration: 0,
        renderCount: 0,
      };
    }
    affectedIDs[key][instanceID] = true;
    applyUpdate(stats);
  }

  flushHistory.forEach(flush => {
    var {measurements, treeSnapshot, operations} = flush;
    var isDefinitelyNotWastedByID = {};

    // Find host components associated with an operation in this batch.
    // Mark all components in their parent tree as definitely not wasted.
    operations.forEach(operation => {
      var {instanceID} = operation;
      var nextParentID = instanceID;
      while (nextParentID) {
        isDefinitelyNotWastedByID[nextParentID] = true;
        nextParentID = treeSnapshot[nextParentID].parentID;
      }
    });

    // Find composite components that rendered in this batch.
    // These are potential candidates for being wasted renders.
    var renderedCompositeIDs = {};
    measurements.forEach(measurement => {
      var {instanceID, timerType} = measurement;
      if (timerType !== 'render') {
        return;
      }
      renderedCompositeIDs[instanceID] = true;
    });

    measurements.forEach(measurement => {
      var {duration, instanceID, timerType} = measurement;
      if (timerType !== 'render') {
        return;
      }

      // If there was a DOM update below this component, or it has just been
      // mounted, its render() is not considered wasted.
      var {updateCount} = treeSnapshot[instanceID];
      if (isDefinitelyNotWastedByID[instanceID] || updateCount === 0) {
        return;
      }

      // We consider this render() wasted.
      updateAggregatedStats(treeSnapshot, instanceID, stats => {
        stats.renderCount++;
      });

      var nextParentID = instanceID;
      while (nextParentID) {
        // Any parents rendered during this batch are considered wasted
        // unless we previously marked them as dirty.
        var isWasted =
          renderedCompositeIDs[nextParentID] &&
          !isDefinitelyNotWastedByID[nextParentID];
        if (isWasted) {
          updateAggregatedStats(treeSnapshot, nextParentID, stats => {
            stats.inclusiveRenderDuration += duration;
          });
        }
        nextParentID = treeSnapshot[nextParentID].parentID;
      }
    });
  });

  return Object.keys(aggregatedStats)
    .map(key => ({
      ...aggregatedStats[key],
      instanceCount: Object.keys(affectedIDs[key]).length,
    }))
    .sort((a, b) => b.inclusiveRenderDuration - a.inclusiveRenderDuration);
}

function getOperations(flushHistory = getLastMeasurements()) {
  if (!__DEV__) {
    warnInProduction();
    return [];
  }

  var stats = [];
  flushHistory.forEach((flush, flushIndex) => {
    var {operations, treeSnapshot} = flush;
    operations.forEach(operation => {
      var {instanceID, type, payload} = operation;
      var {displayName, ownerID} = treeSnapshot[instanceID];
      var owner = treeSnapshot[ownerID];
      var key = (owner ? owner.displayName + ' > ' : '') + displayName;

      stats.push({
        flushIndex,
        instanceID,
        key,
        type,
        ownerID,
        payload,
      });
    });
  });
  return stats;
}

function printExclusive(flushHistory?: FlushHistory) {
  if (!__DEV__) {
    warnInProduction();
    return;
  }

  var stats = getExclusive(flushHistory);
  var table = stats.map(item => {
    var {key, instanceCount, totalDuration} = item;
    var renderCount = item.counts.render || 0;
    var renderDuration = item.durations.render || 0;
    return {
      Component: key,
      'Total time (ms)': roundFloat(totalDuration),
      'Instance count': instanceCount,
      'Total render time (ms)': roundFloat(renderDuration),
      'Average render time (ms)': renderCount
        ? roundFloat(renderDuration / renderCount)
        : undefined,
      'Render count': renderCount,
      'Total lifecycle time (ms)': roundFloat(totalDuration - renderDuration),
    };
  });
  consoleTable(table);
}

function printInclusive(flushHistory?: FlushHistory) {
  if (!__DEV__) {
    warnInProduction();
    return;
  }

  var stats = getInclusive(flushHistory);
  var table = stats.map(item => {
    var {key, instanceCount, inclusiveRenderDuration, renderCount} = item;
    return {
      'Owner > Component': key,
      'Inclusive render time (ms)': roundFloat(inclusiveRenderDuration),
      'Instance count': instanceCount,
      'Render count': renderCount,
    };
  });
  consoleTable(table);
}

function printWasted(flushHistory?: FlushHistory) {
  if (!__DEV__) {
    warnInProduction();
    return;
  }

  var stats = getWasted(flushHistory);
  var table = stats.map(item => {
    var {key, instanceCount, inclusiveRenderDuration, renderCount} = item;
    return {
      'Owner > Component': key,
      'Inclusive wasted time (ms)': roundFloat(inclusiveRenderDuration),
      'Instance count': instanceCount,
      'Render count': renderCount,
    };
  });
  consoleTable(table);
}

function printOperations(flushHistory?: FlushHistory) {
  if (!__DEV__) {
    warnInProduction();
    return;
  }

  var stats = getOperations(flushHistory);
  var table = stats.map(stat => ({
    'Owner > Node': stat.key,
    Operation: stat.type,
    Payload: typeof stat.payload === 'object'
      ? JSON.stringify(stat.payload)
      : stat.payload,
    'Flush index': stat.flushIndex,
    'Owner Component ID': stat.ownerID,
    'DOM Component ID': stat.instanceID,
  }));
  consoleTable(table);
}

var warnedAboutPrintDOM = false;
function printDOM(measurements: FlushHistory) {
  lowPriorityWarning(
    warnedAboutPrintDOM,
    '`ReactPerf.printDOM(...)` is deprecated. Use ' +
      '`ReactPerf.printOperations(...)` instead.',
  );
  warnedAboutPrintDOM = true;
  return printOperations(measurements);
}

var warnedAboutGetMeasurementsSummaryMap = false;
function getMeasurementsSummaryMap(measurements: FlushHistory) {
  lowPriorityWarning(
    warnedAboutGetMeasurementsSummaryMap,
    '`ReactPerf.getMeasurementsSummaryMap(...)` is deprecated. Use ' +
      '`ReactPerf.getWasted(...)` instead.',
  );
  warnedAboutGetMeasurementsSummaryMap = true;
  return getWasted(measurements);
}

function start() {
  if (!__DEV__) {
    warnInProduction();
    return;
  }

  ReactDebugTool.beginProfiling();
}

function stop() {
  if (!__DEV__) {
    warnInProduction();
    return;
  }

  ReactDebugTool.endProfiling();
}

function isRunning() {
  if (!__DEV__) {
    warnInProduction();
    return false;
  }

  return ReactDebugTool.isProfiling();
}

var ReactPerfAnalysis = {
  getLastMeasurements,
  getExclusive,
  getInclusive,
  getWasted,
  getOperations,
  printExclusive,
  printInclusive,
  printWasted,
  printOperations,
  start,
  stop,
  isRunning,
  // Deprecated:
  printDOM,
  getMeasurementsSummaryMap,
};

module.exports = ReactPerfAnalysis;
