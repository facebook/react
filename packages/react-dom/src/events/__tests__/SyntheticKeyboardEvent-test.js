/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var SyntheticKeyboardEvent;
var getEventCharCode;

describe('SyntheticKeyboardEvent', () => {
  var createEvent;

  beforeEach(() => {
    // Mock getEventCharCode for proper unit testing
    jest.mock('../getEventCharCode');
    getEventCharCode = require('../getEventCharCode');

    // TODO: can we express this test with only public API?
    SyntheticKeyboardEvent = require('../SyntheticKeyboardEvent');
    createEvent = function(nativeEvent) {
      var target = require('../getEventTarget')(nativeEvent);
      return SyntheticKeyboardEvent.getPooled({}, '', nativeEvent, target);
    };
  });

  describe('KeyboardEvent interface', () => {
    describe('charCode', () => {
      describe('when event is `keypress`', () => {
        it('returns whatever getEventCharCode returns', () => {
          getEventCharCode.mockReturnValue(100500);
          var keyboardEvent = createEvent({type: 'keypress', charCode: 50});

          expect(keyboardEvent.charCode).toBe(100500);
        });
      });

      describe('when event is not `keypress`', () => {
        it('returns 0', () => {
          var keyboardEvent = createEvent({type: 'keyup', charCode: 50});
          expect(keyboardEvent.charCode).toBe(0);
        });
      });
    });

    describe('keyCode', () => {
      describe('when event is `keydown` or `keyup`', () => {
        it('returns a passed keyCode', () => {
          var keyboardEvent = createEvent({type: 'keyup', keyCode: 40});
          expect(keyboardEvent.keyCode).toBe(40);
        });
      });

      describe('when event is `keypress`', () => {
        it('returns 0', () => {
          var keyboardEvent = createEvent({type: 'keypress', charCode: 40});
          expect(keyboardEvent.keyCode).toBe(0);
        });
      });
    });

    describe('which', () => {
      describe('when event is `keypress`', () => {
        it('returns whatever getEventCharCode returns', () => {
          getEventCharCode.mockReturnValue(9001);
          var keyboardEvent = createEvent({type: 'keypress', charCode: 50});

          expect(keyboardEvent.which).toBe(9001);
        });
      });

      describe('when event is `keydown` or `keyup`', () => {
        it('returns a passed keyCode', () => {
          var keyboardEvent = createEvent({type: 'keyup', keyCode: 40});
          expect(keyboardEvent.which).toBe(40);
        });
      });

      describe('when event type is unknown', () => {
        it('returns 0', () => {
          var keyboardEvent = createEvent({type: 'keysmack', keyCode: 40});
          expect(keyboardEvent.which).toBe(0);
        });
      });
    });
  });

  describe('EventInterface', () => {
    it('normalizes properties from the Event interface', () => {
      var target = document.createElement('div');
      var syntheticEvent = createEvent({srcElement: target});

      expect(syntheticEvent.target).toBe(target);
      expect(syntheticEvent.type).toBe(undefined);
    });

    it('is able to `preventDefault` and `stopPropagation`', () => {
      var nativeEvent = {};
      var syntheticEvent = createEvent(nativeEvent);

      expect(syntheticEvent.isDefaultPrevented()).toBe(false);
      syntheticEvent.preventDefault();
      expect(syntheticEvent.isDefaultPrevented()).toBe(true);

      expect(syntheticEvent.isPropagationStopped()).toBe(false);
      syntheticEvent.stopPropagation();
      expect(syntheticEvent.isPropagationStopped()).toBe(true);
    });

    it('is able to `persist`', () => {
      var syntheticEvent = createEvent({});

      expect(syntheticEvent.isPersistent()).toBe(false);
      syntheticEvent.persist();
      expect(syntheticEvent.isPersistent()).toBe(true);
    });
  });
});
