/**
 * @providesModule BrowserEnv
 */

"use strict";

/**
 * A place to share/cache browser/chrome level computations.
 */
var BrowserEnv = {
  currentScrollLeft: 0,
  currentScrollTop: 0,
  browserInfo: null,
  refreshAuthoritativeScrollValues: function() {
    BrowserEnv.currentScrollLeft =
      document.body.scrollLeft + document.documentElement.scrollLeft;
    BrowserEnv.currentScrollTop =
      document.body.scrollTop + document.documentElement.scrollTop;
  }
};

module.exports = BrowserEnv;
