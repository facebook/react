/*
 * Copyright (C) 2007-2015 Diego Perini
 * All rights reserved.
 *
 * Caching/memoization module for NWMatcher
 *
 * Added capabilities:
 *
 * - Mutation Events are feature tested and used safely
 * - handle caching different document types HTML/XML/SVG
 * - store result sets for different selectors / contexts
 * - simultaneously control mutation on multiple documents
 *
 */

(function(global) {

  // export the public API for CommonJS implementations,
  // for headless JS engines or for standard web browsers
  var Dom =
    // as CommonJS/NodeJS module
    typeof exports == 'object' ? exports :
    // create or extend NW namespace
    ((global.NW || (global.NW = global.Object())) &&
    (global.NW.Dom || (global.NW.Dom = global.Object()))),

  Contexts = global.Object(),
  Results = global.Object(),

  isEnabled = false,
  isExpired = true,
  isPaused = false,

  context = global.document,
  root = context.documentElement,

  // last time cache initialization was called
  lastCalled = 0,

  // minimum time allowed between calls to the cache initialization
  minCacheRest = 15, //ms

  mutationTest =
    function(type, callback) {
      var isSupported = false,
      root = document.documentElement,
      div = document.createElement('div'),
      handler = function() { isSupported = true; };
      root.insertBefore(div, root.firstChild);
      div.addEventListener(type, handler, true);
      if (callback && callback.call) callback(div);
      div.removeEventListener(type, handler, true);
      root.removeChild(div);
      return isSupported;
    },

  // check for Mutation Events, DOMAttrModified should be
  // enough to ensure DOMNodeInserted/DOMNodeRemoved exist
  HACKED_MUTATION_EVENTS = false,

  NATIVE_MUTATION_EVENTS = root.addEventListener ?
    mutationTest('DOMAttrModified', function(e) { e.setAttribute('id', 'nw'); }) : false,

  loadResults =
    function(selector, from, doc, root) {
      if (isEnabled && !isPaused) {
        if (!isExpired) {
          if (Results[selector] && Contexts[selector] === from) {
            return Results[selector];
          }
        } else {
          // pause caching while we are getting
          // hammered by dom mutations (jdalton)
          now = (new global.Date).getTime();
          if ((now - lastCalled) < minCacheRest) {
            isPaused = isExpired = true;
            global.setTimeout(function() { isPaused = false; }, minCacheRest);
          } else setCache(true, doc);
          lastCalled = now;
        }
      }
      return undefined;
    },

  saveResults =
    function(selector, from, doc, data) {
      Contexts[selector] = from;
      Results[selector] = data;
      return;
    },

  /*-------------------------------- CACHING ---------------------------------*/

  // invoked by mutation events to expire cached parts
  mutationWrapper =
    function(event) {
      var d = event.target.ownerDocument || event.target;
      stopMutation(d);
      expireCache(d);
    },

  // append mutation events
  startMutation =
    function(d) {
      if (!d.isCaching && d.addEventListener) {
        // FireFox/Opera/Safari/KHTML have support for Mutation Events
        d.addEventListener('DOMAttrModified', mutationWrapper, true);
        d.addEventListener('DOMNodeInserted', mutationWrapper, true);
        d.addEventListener('DOMNodeRemoved',  mutationWrapper, true);
        d.isCaching = true;
      }
    },

  // remove mutation events
  stopMutation =
    function(d) {
      if (d.isCaching && d.removeEventListener) {
        d.removeEventListener('DOMAttrModified', mutationWrapper, true);
        d.removeEventListener('DOMNodeInserted', mutationWrapper, true);
        d.removeEventListener('DOMNodeRemoved',  mutationWrapper, true);
        d.isCaching = false;
      }
    },

  // enable/disable context caching system
  // @d optional document context (iframe, xml document)
  // script loading context will be used as default context
  setCache =
    function(enable, d) {
      if (!!enable) {
        isExpired = false;
        startMutation(d);
      } else {
        isExpired = true;
        stopMutation(d);
      }
      isEnabled = !!enable;
    },

  // expire complete cache
  // can be invoked by Mutation Events or
  // programmatically by other code/scripts
  // document context is mandatory no checks
  expireCache =
    function(d) {
      isExpired = true;
      Contexts = global.Object();
      Results = global.Object();
    };

  if (!NATIVE_MUTATION_EVENTS && root.addEventListener && Element && Element.prototype) {
    if (mutationTest('DOMNodeInserted', function(e) { e.appendChild(document.createElement('div')); }) &&
        mutationTest('DOMNodeRemoved', function(e) { e.removeChild(e.appendChild(document.createElement('div'))); })) {
      HACKED_MUTATION_EVENTS = true;
      Element.prototype._setAttribute = Element.prototype.setAttribute;
      Element.prototype.setAttribute =
        function(name, val) {
          this._setAttribute(name, val);
          mutationWrapper({
            target: this,
            type: 'DOMAttrModified',
            attrName: name,
            attrValue: val });
        };
    }
  }

  isEnabled = NATIVE_MUTATION_EVENTS || HACKED_MUTATION_EVENTS;

  /*------------------------------- PUBLIC API -------------------------------*/

  // save results into cache
  Dom.saveResults = saveResults;

  // load results from cache
  Dom.loadResults = loadResults;

  // expire DOM tree cache
  Dom.expireCache = expireCache;

  // enable/disable cache
  Dom.setCache = setCache;

})(this);
