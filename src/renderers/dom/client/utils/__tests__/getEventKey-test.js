/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var getEventKey = require('getEventKey');

describe('getEventKey', function() {
  describe('when key is implemented in a browser', function() {
    describe('when key is not normalized', function() {
      it('returns a normalized value', function() {
        var nativeEvent = new KeyboardEvent('keypress', {key: 'Del'});

        expect(getEventKey(nativeEvent)).toBe('Delete');
      });
    });

    describe('when key is normalized', function() {
      it('returns a key', function() {
        var nativeEvent = new KeyboardEvent('keypress', {key: 'f'});

        expect(getEventKey(nativeEvent)).toBe('f');
      });
    });
  });

  describe('when key is not implemented in a browser', function() {
    describe('when event type is keypress', function() {
      describe('when charCode is 13', function() {
        it("returns 'Enter'", function() {
          var nativeEvent = new KeyboardEvent('keypress', {charCode: 13});

          expect(getEventKey(nativeEvent)).toBe('Enter');
        });
      });

      describe('when charCode is not 13', function() {
        it('returns a string from a charCode', function() {
          var nativeEvent = new KeyboardEvent('keypress', {charCode: 65});

          expect(getEventKey(nativeEvent)).toBe('A');
        });
      });
    });

    describe('when event type is keydown or keyup', function() {
      describe('when keyCode is recognized', function() {
        it('returns a translated key', function() {
          var nativeEvent = new KeyboardEvent('keydown', {keyCode: 45});

          expect(getEventKey(nativeEvent)).toBe('Insert');
        });
      });

      describe('when keyCode is not recognized', function() {
        it('returns Unidentified', function() {
          var nativeEvent = new KeyboardEvent('keydown', {keyCode: 1337});

          expect(getEventKey(nativeEvent)).toBe('Unidentified');
        });
      });
    });

    describe('when event type is unknown', function() {
      it('returns an empty string', function() {
        var nativeEvent = new KeyboardEvent('keysmack');

        expect(getEventKey(nativeEvent)).toBe('');
      });
    });
  });
});
