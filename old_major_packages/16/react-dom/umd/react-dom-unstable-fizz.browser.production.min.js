/** @license React v16.13.1
 * react-dom-unstable-fizz.browser.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';(function(f,d){"object"===typeof exports&&"undefined"!==typeof module?module.exports=d():"function"===typeof define&&define.amd?define(d):(f=f||self,f.ReactDOMFizzServer=d())})(this,function(){function f(b,c){var a="<"+b+">";"string"===typeof c.children&&(a+=c.children);return a+("</"+b+">")}function d(b){var c=b.destination,a=b.completedChunks;b.completedChunks=[];for(b=0;b<a.length;b++)c.enqueue(a[b]);c.close()}var h=new TextEncoder,k="function"===typeof Symbol&&Symbol.for?Symbol.for("react.element"):
60103,g={renderToReadableStream:function(b){var c;return new ReadableStream({start:function(a){a=c={destination:a,children:b,completedChunks:[],flowing:!1};a.flowing=!0;var e=a.children;a.children=null;if(!e||e.$$typeof===k){var g=e.type;e=e.props;"string"===typeof g&&(a.completedChunks.push(h.encode(f(g,e))),a.flowing&&d(a))}},pull:function(a){a=c;a.flowing=!1;d(a)},cancel:function(a){}})}};return g.default||g});
