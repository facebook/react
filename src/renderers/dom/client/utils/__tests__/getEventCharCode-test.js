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

var getEventCharCode = require('getEventCharCode');

describe('getEventCharCode', function() {
  describe('when charCode is present in nativeEvent', function() {
    describe('when charCode is 0 and keyCode is 13', function() {
      it('returns 13', function() {
        var nativeEvent = new KeyboardEvent(
          'keypress', {charCode: 0, keyCode: 13}
        );

        expect(getEventCharCode(nativeEvent)).toBe(13);
      });
    });

    describe('when charCode is not 0 and/or keyCode is not 13', function() {
      describe('when charCode is 32 or bigger', function() {
        it('returns charCode', function() {
          var nativeEvent = new KeyboardEvent('keypress', {charCode: 32});

          expect(getEventCharCode(nativeEvent)).toBe(32);
        });
      });

      describe('when charCode is smaller than 32', function() {
        describe('when charCode is 13', function() {
          it('returns 13', function() {
            var nativeEvent = new KeyboardEvent('keypress', {charCode: 13});

            expect(getEventCharCode(nativeEvent)).toBe(13);
          });
        });

        describe('when charCode is not 13', function() {
          it('returns 0', function() {
            var nativeEvent = new KeyboardEvent('keypress', {charCode: 31});

            expect(getEventCharCode(nativeEvent)).toBe(0);
          });
        });
      });
    });
  });

  /**
    nativeEvent is represented as a plain object here to ease testing, because
    KeyboardEvent's 'charCode' event key cannot be deleted to simulate a missing
    charCode key.
  */
  describe('when charCode is not present in nativeEvent', function() {
    describe('when keyCode is 32 or bigger', function() {
      it('returns keyCode', function() {
        var nativeEvent = {'keyCode': 32};

        expect(getEventCharCode(nativeEvent)).toBe(32);
      });
    });

    describe('when keyCode is smaller than 32', function() {
      describe('when keyCode is 13', function() {
        it('returns 13', function() {
          var nativeEvent = {'keyCode': 13};

          expect(getEventCharCode(nativeEvent)).toBe(13);
        });
      });

      describe('when keyCode is not 13', function() {
        it('returns 0', function() {
          var nativeEvent = {'keyCode': 31};

          expect(getEventCharCode(nativeEvent)).toBe(0);
        });
      });
    });
  });
});
