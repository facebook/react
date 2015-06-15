/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

/**
 * This file contains various hacks and tweaks that were necessary at some
 * point to get jsdom to behave correctly.
 *
 * TODO(benjamn) Periodically purge unnecessary stuff from this file
 * and/or create upstream pull requests for obvious bugs.
 */

// If this require starts failing in the future, it might be because
// cssstyle has matured enough that the hacks below are no longer
// necessary, so don't panic.
try {
  var cssPropertyParsers = require('cssstyle/lib/parsers');
} catch (err) {
  // This error probably just means cssstyle is not installed yet, because
  // we're still in the process of upgrading jsdom. Don't worry about it
  // until jsdom has been updated to the latest version (v0.8.x).
}

if (cssPropertyParsers) {
  // The shorthandParser function should never return a string, but it
  // does when given an empty string. Here we detect that case and make it
  // return an empty object instead, to work around bugs in later code
  // that assume the result of shorthandParser is always an object.
  var shorthandParser = cssPropertyParsers.shorthandParser;
  cssPropertyParsers.shorthandParser = function() {
    var result = shorthandParser.apply(this, arguments);
    return result === '' ? {} : result;
  };

  // Current versions of the cssstyle parseInteger function can't actually
  // handle string inputs.
  var badInt = cssPropertyParsers.parseInteger('5');
  if (badInt !== '5') {
    cssPropertyParsers.parseInteger = function parseInteger(val) {
      return String(parseInt(val, 10));
    };
  }

  // Current versions of the cssstyle parseNumber function can't actually
  // handle string inputs.
  var badNum = cssPropertyParsers.parseNumber('0.5');
  if (badNum !== '0.5') {
    cssPropertyParsers.parseNumber = function parseNumber(val) {
      return String(parseFloat(val, 10));
    };
  }
}

// We can't require jsdom/lib/jsdom/browser/utils directly, because it
// requires jsdom, which requires utils circularly, so the utils module
// won't be fully populated when its (non-existent) NOT_IMPLEMENTED
// property is imported elsewhere. Instead, the only thing that seems to
// work is to override the utils module in require.cache, so that we never
// have to evaluate the original module.
try {
  var utilsId = require.resolve('jsdom/lib/jsdom/browser/utils');
} catch (err) {
  // Leave utilsId undefined if require.resolve couldn't resolve it.
}

if (utilsId) {
  require.cache[utilsId] = {
    id: utilsId,
    exports: {
      NOT_IMPLEMENTED: function(target, nameForErrorMessage) {
        var message = 'NOT IMPLEMENTED' + (
          nameForErrorMessage ? ': ' + nameForErrorMessage : ''
        );

        return function() {
          if (!jsdom.debugMode) {
            // These two lines have been changed from the original
            // NOT_IMPLEMENTED function to be more defensive about the
            // presence/absence of .raise and raise.call.
            var raise = (target && target.raise) || (this && this.raise);
            if (raise && raise.call) {
              raise.call(this, 'error', message);
            } else {
              // In case there was no suitable raise function to use, we
              // still want to throw a meaningful Error (another
              // improvement over the original NOT_IMPLEMENTED).
              throw new Error(message);
            }
          }
        };
      }
    }
  };
}

var jsdom = require('jsdom');
var define = require('jsdom/lib/jsdom/level2/html').define;
var elements = jsdom.defaultLevel;

function _getTimeRangeDummy() {
  return {
    length: 0,
    start: function() { return 0; },
    end: function() { return 0; }
  };
}

if (elements && !elements.HTMLMediaElement) {

  define('HTMLMediaElement', {
    _init: function() {
      this._muted = this.defaultMuted;
      this._volume = 1.0;
      this.readyState = 0;
    },
    proto: {
      // Implemented accoring to W3C Draft 22 August 2012
      set defaultPlaybackRate(v) {
        if (v === 0.0) {
          throw new elements.DOMException(elements.NOT_SUPPORTED_ERR);
        }
        if (this._defaultPlaybackRate !== v) {
          this._defaultPlaybackRate = v;
          this._dispatchRateChange();
        }
      },
      _dispatchRateChange: function() {
        var ev = this._ownerDocument.createEvent('HTMLEvents');
        ev.initEvent('ratechange', false, false);
        this.dispatchEvent(ev);
      },
      get defaultPlaybackRate() {
        if (this._defaultPlaybackRate === undefined) {
          return 1.0;
        }
        return this._defaultPlaybackRate;
      },
      get playbackRate() {
        if (this._playbackRate === undefined) {
          return 1.0;
        }
        return this._playbackRate;
      },
      set playbackRate(v) {
        if (v !== this._playbackRate) {
          this._playbackRate = v;
          this._dispatchRateChange();
        }
      },
      get muted() {
        return this._muted;
      },
      _dispatchVolumeChange: function() {
        var ev = this._ownerDocument.createEvent('HTMLEvents');
        ev.initEvent('volumechange', false, false);
        this.dispatchEvent(ev);
      },
      set muted(v) {
        if (v !== this._muted) {
          this._muted = v;
          this._dispatchVolumeChange();
        }
      },
      get defaultMuted() {
        return this.getAttribute('muted') !== null;
      },
      set defaultMuted(v) {
        if (v) {
          this.setAttribute('muted', v);
        } else {
          this.removeAttribute('muted');
        }
      },
      get volume() {
        return this._volume;
      },
      set volume(v) {
        if (v < 0 || v > 1) {
          throw new elements.DOMException(elements.INDEX_SIZE_ERR);
        }
        if (this._volume !== v) {
          this._volume = v;
          this._dispatchVolumeChange();
        }
      },

      // Not (yet) implemented according to spec
      // Should return sane default values
      currentSrc: '',
      buffered: _getTimeRangeDummy(),
      networkState: 0,
      load: function() {
      },
      canPlayType: function() {
        return false;
      },
      seeking: false,
      duration: 0,
      startDate: NaN,
      paused: true,
      played: _getTimeRangeDummy(),
      seekable: _getTimeRangeDummy(),
      ended: false,
      play: function() {
      },
      pause: function() {
      },
      audioTracks: [],
      videoTracks: [],
      textTracks: [],
      addTextTrack: function() {
      }
    },
    attributes: [
      { prop: 'autoplay', type: 'boolean' },
      { prop: 'controls', type: 'boolean' },
      'crossOrigin',
      'currentTime',
      'preload',
      { prop: 'loop', type: 'boolean' },
      'mediaGroup',
    ]
  });
}

if (elements && !elements.HTMLVideoElement) {
  define('HTMLVideoElement', {
    tagName: 'VIDEO',
    parentClass: elements.HTMLMediaElement,
    attributes: [
      { prop: 'height', type: 'long' },
      'poster',
      { prop: 'videoHeight', type: 'long' },
      { prop: 'videoWidth', type: 'long' },
      { prop: 'width', type: 'long' }
    ]
  });
}

if (elements && elements.HTMLInputElement) {
  var proto = elements.HTMLInputElement.prototype;
  var desc = Object.getOwnPropertyDescriptor(proto, 'checked');
  if (desc) {
    // Reimplement the .checked setter to require that two radio buttons
    // have the same .form in order for their .checked values to be
    // mutually exclusive. Except for the lines commented below, this code
    // was borrowed directly from the jsdom implementation:
    // https://github.com/tmpvar/jsdom/blob/0cf670d6eb/lib/jsdom/level2/html.js#L975-L990
    desc.set = function(checked) {
      this._initDefaultChecked();

      // Accept empty strings as truthy values for the .checked attribute.
      if (checked || (checked === '')) {
        this.setAttribute('checked', 'checked');

        if (this.type === 'radio') {
          var elements = this._ownerDocument.getElementsByName(this.name);

          for (var i = 0; i < elements.length; i++) {
            var other = elements[i];
            if (other !== this &&
                other.tagName === 'INPUT' &&
                other.type === 'radio' &&
                // This is the condition that is missing from the default
                // implementation of the .checked setter.
                other.form === this.form) {
              other.checked = false;
            }
          }
        }

      } else {
        this.removeAttribute('checked');
      }
    };

    Object.defineProperty(proto, 'checked', desc);
  }
}

// Make sure we unselect all but the first selected option when a <select>
// element has its "multiple" attribute set to false.
if (elements && elements.HTMLSelectElement) {
  var proto = elements.HTMLSelectElement.prototype;
  var oldAttrModified = proto._attrModified;
  proto._attrModified = function(name, value) {
    if (name === 'multiple' && !value) {
      var leaveNextOptionSelected = true;
      this.options._toArray().forEach(function(option) {
        if (option.selected) {
          if (leaveNextOptionSelected) {
            leaveNextOptionSelected = false;
          } else {
            option.selected = false;
          }
        }
      });
    }

    return oldAttrModified.apply(this, arguments);
  };
}

// Require this module if you want to require('jsdom'), to ensure the
// above compatibility measures have been implemented.
module.exports = jsdom;
