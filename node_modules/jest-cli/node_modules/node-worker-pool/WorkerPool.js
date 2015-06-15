"use strict";

var Q = require('q');
var Worker = require('./Worker');

function WorkerPool(numWorkers, workerPath, workerArgs, options) {
  options = options || {};

  this._numWorkers = numWorkers;
  this._workerArgs = workerArgs;
  this._workerPath = workerPath;
  this._opts = options;

  this._availableWorkers = [];
  this._allWorkers = [];
  this._isDestroyed = false;
  this._allPendingResponses = [];
  this._queuedMessages = [];
  this._queuedWorkerSpecificMessages = {};
  this._workerPendingResponses = {};

  if (!options.lazyBoot) {
    this._eagerBootAllWorkers();
  }
};

WorkerPool.prototype._bootNewWorker = function() {
  var workerID = this._allWorkers.length;
  var worker = new Worker(this._workerPath, this._workerArgs, {
    initData: this._opts.initData,
    printChildResponses: !!this._opts.printChildResponses,
    workerName: workerID
  });
  this._allWorkers.push(worker);
  this._availableWorkers.push(workerID);
};

WorkerPool.prototype._eagerBootAllWorkers = function() {
  while (this._allWorkers.length < this._numWorkers) {
    this._bootNewWorker();
  }
};

WorkerPool.prototype._sendMessageToWorker = function(workerID, msg) {
  var worker = this._allWorkers[workerID];
  var pendingResponse = worker.sendMessage(msg).finally(function(response) {
    if (this._queuedWorkerSpecificMessages.hasOwnProperty(workerID)
        && this._queuedWorkerSpecificMessages[workerID].length > 0) {
      var queuedMsg = this._queuedWorkerSpecificMessages[workerID].shift();
      this._sendMessageToWorker(workerID, queuedMsg.msg)
        .catch(function(err) {
          queuedMsg.deferred.reject(err);
        })
        .done(function(response) {
          queuedMsg.deferred.resolve(response);
        });
    } else if (this._queuedMessages.length > 0) {
      var queuedMsg = this._queuedMessages.shift();
      this._sendMessageToWorker(workerID, queuedMsg.msg)
        .catch(function(err) {
          queuedMsg.deferred.reject(err);
        })
        .done(function(response) {
          queuedMsg.deferred.resolve(response);
        })
    } else {
      this._availableWorkers.push(workerID);
      delete this._workerPendingResponses[workerID];
    }
  }.bind(this));
  return this._workerPendingResponses[workerID] = pendingResponse;
};

WorkerPool.prototype.sendMessage = function(msg) {
  if (this._isDestroyed) {
    throw new Error(
      'Attempted to send a message after the worker pool has alread been ' +
      '(or is in the process of) shutting down!'
    );
  }

  if (this._opts.lazyBoot && this._allWorkers.length < this._numWorkers) {
    this._bootNewWorker();
  }

  var responsePromise;
  if (this._availableWorkers.length > 0) {
     responsePromise = this._sendMessageToWorker(
      this._availableWorkers.shift(),
      msg
    );
  } else {
    var queuedMsgID = this._queuedMessages.length;
    var deferred = Q.defer();
    this._queuedMessages.push({
      deferred: deferred,
      msg: msg
    });
    responsePromise = deferred.promise;
  }

  this._allPendingResponses.push(responsePromise);
  return responsePromise;
};

WorkerPool.prototype.sendMessageToAllWorkers = function(msg) {
  if (this._isDestroyed) {
    throw new Error(
      'Attempted to send a message after the worker pool has alread been ' +
      '(or is in the process of) shutting down!'
    );
  }

  // Queue the message up for all currently busy workers
  var busyWorkerResponses = [];
  for (var workerID in this._workerPendingResponses) {
    var deferred = Q.defer();
    if (!this._queuedWorkerSpecificMessages.hasOwnProperty(workerID)) {
      this._queuedWorkerSpecificMessages[workerID] = [];
    }
    this._queuedWorkerSpecificMessages[workerID].push({
      deferred: deferred,
      msg: msg
    });
    busyWorkerResponses.push(deferred.promise);
  }

  // Send out the message to all workers that aren't currently busy
  var availableWorkerResponses = this._availableWorkers.map(function(workerID) {
    return this._sendMessageToWorker(workerID, msg);
  }, this);
  this._availableWorkers = [];

  return Q.all(availableWorkerResponses.concat(busyWorkerResponses));
};

WorkerPool.prototype.destroy = function() {
  var allWorkers = this._allWorkers;

  this._isDestroyed = true;
  return Q.allSettled(this._allPendingResponses)
    .then(function() {
      return Q.all(allWorkers.map(function(worker) {
        return worker.destroy();
      }));
    });
};

module.exports = WorkerPool;
