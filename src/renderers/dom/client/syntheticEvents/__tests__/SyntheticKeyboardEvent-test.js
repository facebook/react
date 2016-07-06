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

var SyntheticKeyboardEvent;
var getEventCharCode;

describe('SyntheticKeyboardEvent', function() {
  var createEvent;

  beforeEach(function() {
    // Mock getEventCharCode for proper unit testing
    jest.mock('getEventCharCode');
    getEventCharCode = require('getEventCharCode');

    SyntheticKeyboardEvent = require('SyntheticKeyboardEvent');
    createEvent = function(nativeEvent) {
      var target = require('getEventTarget')(nativeEvent);
      return SyntheticKeyboardEvent.getPooled({}, '', nativeEvent, target);
    };
  });

  describe('KeyboardEvent interface', function() {
    describe('charCode', function() {
      describe('when event is `keypress`', function() {
        it('returns whatever getEventCharCode returns', function() {
          getEventCharCode.mockReturnValue(100500);
          var keyboardEvent = createEvent({type: 'keypress', charCode: 50});

          expect(keyboardEvent.charCode).toBe(100500);
        });
      });

      describe('when event is not `keypress`', function() {
        it('returns 0', function() {
          var keyboardEvent = createEvent({type: 'keyup', charCode: 50});
          expect(keyboardEvent.charCode).toBe(0);
        });
      });
    });

    describe('keyCode', function() {
      describe('when event is `keydown` or `keyup`', function() {
        it('returns a passed keyCode', function() {
          var keyboardEvent = createEvent({type: 'keyup', keyCode: 40});
          expect(keyboardEvent.keyCode).toBe(40);
        });
      });

      describe('when event is `keypress`', function() {
        it('returns 0', function() {
          var keyboardEvent = createEvent({type: 'keypress', charCode: 40});
          expect(keyboardEvent.keyCode).toBe(0);
        });
      });
    });

    describe('which', function() {
      describe('when event is `keypress`', function() {
        it('returns whatever getEventCharCode returns', function() {
          getEventCharCode.mockReturnValue(9001);
          var keyboardEvent = createEvent({type: 'keypress', charCode: 50});

          expect(keyboardEvent.which).toBe(9001);
        });
      });

      describe('when event is `keydown` or `keyup`', function() {
        it('returns a passed keyCode', function() {
          var keyboardEvent = createEvent({type: 'keyup', keyCode: 40});
          expect(keyboardEvent.which).toBe(40);
        });
      });

      describe('when event type is unknown', function() {
        it('returns 0', function() {
          var keyboardEvent = createEvent({type: 'keysmack', keyCode: 40});
          expect(keyboardEvent.which).toBe(0);
        });
      });
    });
  });

  describe('EventInterface', function() {
    it('normalizes properties from the Event interface', function() {
      var target = document.createElement('div');
      var syntheticEvent = createEvent({srcElement: target});

      expect(syntheticEvent.target).toBe(target);
      expect(syntheticEvent.type).toBe(undefined);
    });

    it('is able to `preventDefault` and `stopPropagation`', function() {
      var nativeEvent = {};
      var syntheticEvent = createEvent(nativeEvent);

      expect(syntheticEvent.isDefaultPrevented()).toBe(false);
      syntheticEvent.preventDefault();
      expect(syntheticEvent.isDefaultPrevented()).toBe(true);

      expect(syntheticEvent.isPropagationStopped()).toBe(false);
      syntheticEvent.stopPropagation();
      expect(syntheticEvent.isPropagationStopped()).toBe(true);
    });

    it('is able to `persist`', function() {
      var syntheticEvent = createEvent({});

      expect(syntheticEvent.isPersistent()).toBe(false);
      syntheticEvent.persist();
      expect(syntheticEvent.isPersistent()).toBe(true);
    });
  });
});
