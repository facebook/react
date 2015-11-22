/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SyntheticDragEvent
 * @typechecks static-only
 */

'use strict';

var SyntheticMouseEvent = require('SyntheticMouseEvent');

/**
 * @interface DragEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var DragEventInterface = {
  dataTransfer: null,
};

var SyntheticDataTransfer = function(nativeDataTransfer) {
  this.nativeDataTransfer = nativeDataTransfer;
};

SyntheticDataTransfer.prototype.clearData = function(format) {
  return this.nativeDataTransfer.clearData(format);
};

SyntheticDataTransfer.prototype.getData = function(format) {
  return this.nativeDataTransfer.getData(format);
};

SyntheticDataTransfer.prototype.setData = function(format, data) {
  return this.nativeDataTransfer.setData(format, data);
};

SyntheticDataTransfer.prototype.setDragImage = function(img, xOffset, yOffset) {
  return this.nativeDataTransfer.setDragImage(img, xOffset, yOffset);
};

Object.defineProperty(SyntheticDataTransfer.prototype, 'dropEffect', {
  get: function() {
    return this.nativeDataTransfer.dropEffect;
  },

  set: function(value) {
    this.nativeDataTransfer.dropEffect = value;
  },
});

Object.defineProperty(SyntheticDataTransfer.prototype, 'effectAllowed', {
  get: function() {
    return this.nativeDataTransfer.effectAllowed;
  },

  set: function(value) {
    this.nativeDataTransfer.effectAllowed = value;
  },
});

Object.defineProperty(SyntheticDataTransfer.prototype, 'files', {
  enumerable: true,

  get: function() {
    return this.nativeDataTransfer.files;
  },
});

Object.defineProperty(SyntheticDataTransfer.prototype, 'items', {
  get: function() {
    return this.nativeDataTransfer.items;
  },
});

Object.defineProperty(SyntheticDataTransfer.prototype, 'types', {
  enumerable: true,

  get: function() {
    if ('DOMStringList' in window && this.nativeDataTransfer.types instanceof DOMStringList) {
      return Array.prototype.slice.call(this.nativeDataTransfer.types, 0);
    } else {
      return this.nativeDataTransfer.types;
    }
  },
});

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticDragEvent(dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget) {
  SyntheticMouseEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget);

  this.dataTransfer = new SyntheticDataTransfer(nativeEvent.dataTransfer);
}

SyntheticMouseEvent.augmentClass(SyntheticDragEvent, DragEventInterface);

module.exports = SyntheticDragEvent;
