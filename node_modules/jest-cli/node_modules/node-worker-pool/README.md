# node-worker-pool [![Build Status](https://travis-ci.org/jeffmo/node-worker-pool.svg?branch=master)](https://travis-ci.org/jeffmo/node-worker-pool)

node-worker-pool is a library for managing a pool of child workers in node.

It's primarily useful for scenarios where you have lots of highly parallelizable
tasks you want to perform. It works exclusively via message-passing, so there is
no need to share memory.

Specifically, node-worker-pool allows you to define your own worker executable
that is capable of communicating over stdin/stdout (via a fairly simple protocol
for which I have yet to propertly document :p).

## Getting started

* Write a worker executable file
* Construct a WorkerPool object that points at the aforementioend worker
  executable
* Send messages to the WorkerPool object and wait for responses

#### Writing a worker executable file

You technically don't have to write this file in node, but for the time being
there are only node helper libraries for abstracting away the communciation
protocols. Here is an example worker:

__worker.js__
```js
var workerUtils = require('node-worker-pool/nodeWorkerUtils');

/**
 * Executed once when the worker pool first starts
 * (before any messages are received)
 */
var initData;
function onInitialize(data) {
  initData = data;
}

/**
 * Executed each time a message is received from the worker pool.
 * Returns the response to the message (response must always be an object)
 */
function onMessage(data) {
  return {
    initData: initData,
    receivedData: data
  };
}

if (require.main === module) {
  try {
    workerUtils.startWorker(onInitialize, onMessage);
  } catch (e) {
    workerUtils.respondWithError(e);
  }
}
```

__workerPool.js__
```js
if (require.main === module) {
  var workerPool = new WorkerPool(
    8,                // number of workers
    process.execPath, // path to the node binary
    './worker.js',    // path to the worker script
    {
      // The initData object that is passed to each worker exactly once before
      // any messages get sent. Workers receive this object via their
      // onInitialize callback.
      initData: {someUsefulConstant: 42}
    }
  );

  workerPool.sendMessage({message: 'hai!'}).then(function(response) {
    console.log(response); // Prints the response object from the worker
  });

  workerPool.shutDown().then(function() {
    console.log('All worker processes have now been killed');
  });
}
```
