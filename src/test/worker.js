/* jshint worker: true */
"use strict";

if (typeof console == 'undefined') {
  this.console = {
    error: function(e){
      postMessage(JSON.stringify({
        type: 'error',
        message: e.message,
        stack: e.stack
      }));
    },
    log: function(message){
      postMessage(JSON.stringify({
        type: 'log',
        message: message
      }));
    }
  }
}

console.log('worker BEGIN');

// The UMD wrapper tries to store on `global` if `window` isn't available
var global = {};
importScripts("phantomjs-shims.js");

try {
  importScripts("../../build/react.js");
} catch (e) {
  console.error(e);
}

postMessage(JSON.stringify({
  type: 'done'
}));

console.log('worker END');
