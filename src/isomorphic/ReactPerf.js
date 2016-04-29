/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactPerf
 */

'use strict';

var ReactDebugTool = require('ReactDebugTool');
var warning = require('warning');

function roundFloat(val, base = 2) {
  var n = Math.pow(10, base);
  return Math.floor(val * n) / n;
}

function getFlushHistory() {
  return ReactDebugTool.getFlushHistory();
}

function getExclusive(flushHistory = getFlushHistory()) {
  var aggregatedStats = {};
  var affectedIDs = {};

  function updateAggregatedStats(treeSnapshot, instanceID, applyUpdate) {
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

    affectedIDs[key][instanceID] = true;
    applyUpdate(stats);
  }

  flushHistory.forEach(flush => {
    var {measurements, treeSnapshot} = flush;
    measurements.forEach(measurement => {
      var {duration, instanceID, timerType} = measurement;
      updateAggregatedStats(treeSnapshot, instanceID, stats => {
        stats.totalDuration += duration;

        if (!stats.durations[timerType]) {
          stats.durations[timerType] = 0;
        }
        stats.durations[timerType] += duration;

        if (!stats.counts[timerType]) {
          stats.counts[timerType] = 0;
        }
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

function getInclusive(flushHistory = getFlushHistory(), wastedOnly) {
  var aggregatedStats = {};
  var affectedIDs = {};

  function updateAggregatedStats(treeSnapshot, instanceID, applyUpdate) {
    var {displayName, ownerID} = treeSnapshot[instanceID];

    var owner = treeSnapshot[ownerID];
    var key = `${owner ? owner.displayName + ' >' : ''} ${displayName}`;
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

  var hasRenderedByID = {};
  flushHistory.forEach(flush => {
    var {measurements} = flush;
    measurements.forEach(measurement => {
      var {instanceID, timerType} = measurement;
      if (timerType !== 'render') {
        return;
      }
      hasRenderedByID[instanceID] = true;
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
        if (hasRenderedByID[nextParentID]) {
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

function getWasted(flushHistory = getFlushHistory()) {
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
    var dirtyInstanceIDs = {};

    operations.forEach(operation => {
      var {instanceID} = operation;

      var nextParentID = instanceID;
      while (nextParentID) {
        dirtyInstanceIDs[nextParentID] = true;
        nextParentID = treeSnapshot[nextParentID].parentID;
      }
    });

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
      var { updateCount } = treeSnapshot[instanceID];
      if (dirtyInstanceIDs[instanceID] || updateCount === 0) {
        return;
      }
      updateAggregatedStats(treeSnapshot, instanceID, stats => {
        stats.renderCount++;
      });
      var nextParentID = instanceID;
      while (nextParentID) {
        if (!renderedCompositeIDs[nextParentID]) {
          break;
        }
        updateAggregatedStats(treeSnapshot, nextParentID, stats => {
          stats.inclusiveRenderDuration += duration;
        });
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

function getOperations(flushHistory = getFlushHistory()) {
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

function printExclusive(flushHistory) {
  var stats = getExclusive(flushHistory);
  var table = stats.map(item => {
    var {key, instanceCount, totalDuration} = item;
    var renderCount = item.counts.render || 0;
    var renderDuration = item.durations.render || 0;
    return {
      'Component': key,
      'Total time (ms)': roundFloat(totalDuration),
      'Instance count': instanceCount,
      'Total render time (ms)': roundFloat(renderDuration),
      'Average render time (ms)': renderCount ?
        roundFloat(renderDuration / renderCount) :
        undefined,
      'Render count': renderCount,
      'Total lifecycle time (ms)': roundFloat(totalDuration - renderDuration),
    };
  });
  console.table(table);
}

function printInclusive(flushHistory) {
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
  console.table(table);
}

function printWasted(flushHistory) {
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
  console.table(table);
}

function printOperations(flushHistory) {
  var stats = getOperations(flushHistory);
  var table = stats.map(stat => ({
    'Owner > Node': stat.key,
    'Operation': stat.type,
    'Payload': typeof stat.payload === 'object' ?
      JSON.stringify(stat.payload) :
      stat.payload,
    'Flush index': stat.flushIndex,
    'Owner Component ID': stat.ownerID,
    'DOM Component ID': stat.instanceID,
  }));
  console.table(table);
}

var warnedAboutPrintDOM = false;
function printDOM(measurements) {
  warning(
    warnedAboutPrintDOM,
    '`ReactPerf.printDOM(...)` is deprecated. Use ' +
    '`ReactPerf.printOperations(...)` instead.'
  );
  warnedAboutPrintDOM = true;
  return printOperations(measurements);
}

var warnedAboutGetMeasurementsSummaryMap = false;
function getMeasurementsSummaryMap(measurements) {
  warning(
    warnedAboutGetMeasurementsSummaryMap,
    '`ReactPerf.getMeasurementsSummaryMap(...)` is deprecated. Use ' +
    '`ReactPerf.getWasted(...)` instead.'
  );
  warnedAboutGetMeasurementsSummaryMap = true;
  return getWasted(measurements);
}

function start() {
  ReactDebugTool.beginProfiling();
}

function stop() {
  ReactDebugTool.endProfiling();
}

var ReactPerfAnalysis = {
  getLastMeasurements: getFlushHistory,
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
  // Deprecated:
  printDOM,
  getMeasurementsSummaryMap,
};

module.exports = ReactPerfAnalysis;
