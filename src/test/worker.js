/* jshint worker: true */
"use strict";

// The UMD wrapper tries to store on `global` if `window` isn't available
var global = {};
importScripts("phantomjs-shims.js");

try {
  importScripts("react.js");
} catch (e) {
  postMessage(JSON.stringify({
    type: 'error',
    message: e.message,
    stack: e.stack
  }));
}

postMessage(JSON.stringify({
  type: 'done'
}));
