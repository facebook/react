/**
 * @providesModule CSSProperty
 */

"use strict";

/**
 * CSS properties which accept numbers but are not in units of "px".
 */
var isUnitlessNumber = {
  fillOpacity: true,
  fontWeight: true,
  opacity: true,
  orphans: true,
  zIndex: true,
  zoom: true
};

var CSSProperty = {
  isUnitlessNumber: isUnitlessNumber
};

module.exports = CSSProperty;
