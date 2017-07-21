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

// TODO: can we express this test with only public API?
var getEventCharCode = require('getEventCharCode');

describe('getEventCharCode', () => {
  describe('when charCode is present in nativeEvent', () => {
    describe('when charCode is 0 and keyCode is 13', () => {
      it('returns 13', () => {
        var nativeEvent = new KeyboardEvent('keypress', {
          charCode: 0,
          keyCode: 13,
        });

        expect(getEventCharCode(nativeEvent)).toBe(13);
      });
    });

    describe('when charCode is not 0 and/or keyCode is not 13', () => {
      describe('when charCode is 32 or bigger', () => {
        it('returns charCode', () => {
          var nativeEvent = new KeyboardEvent('keypress', {charCode: 32});

          expect(getEventCharCode(nativeEvent)).toBe(32);
        });
      });

      describe('when charCode is smaller than 32', () => {
        describe('when charCode is 13', () => {
          it('returns 13', () => {
            var nativeEvent = new KeyboardEvent('keypress', {charCode: 13});

            expect(getEventCharCode(nativeEvent)).toBe(13);
          });
        });

        describe('when charCode is not 13', () => {
          it('returns 0', () => {
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
  describe('when charCode is not present in nativeEvent', () => {
    describe('when keyCode is 32 or bigger', () => {
      it('returns keyCode', () => {
        var nativeEvent = {keyCode: 32};

        expect(getEventCharCode(nativeEvent)).toBe(32);
      });
    });

    describe('when keyCode is smaller than 32', () => {
      describe('when keyCode is 13', () => {
        it('returns 13', () => {
          var nativeEvent = {keyCode: 13};

          expect(getEventCharCode(nativeEvent)).toBe(13);
        });
      });

      describe('when keyCode is not 13', () => {
        it('returns 0', () => {
          var nativeEvent = {keyCode: 31};

          expect(getEventCharCode(nativeEvent)).toBe(0);
        });
      });
    });
  });
});
