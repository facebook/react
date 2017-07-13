/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

describe('DOMPreventedEvents', () => {
  var DOMPreventedEvents;

  beforeEach(() => {
    jest.resetModules();
    DOMPreventedEvents = require('DOMPreventedEvents');
  });

  describe('shouldBePrevented', () => {
    it('should recognize events to be prevented', () => {
      expect(
        DOMPreventedEvents.shouldBePrevented('onClick', 'input', {
          disabled: true,
        }),
      ).toBe(true);
    });

    it('should recognize events to be not prevented', () => {
      expect(
        DOMPreventedEvents.shouldBePrevented('onBlur', 'input', {
          disabled: true,
        }),
      ).toBe(false);

      expect(
        DOMPreventedEvents.shouldBePrevented('onClick', 'div', {
          disabled: true,
        }),
      ).toBe(false);

      expect(DOMPreventedEvents.shouldBePrevented('onClick', 'input', {})).toBe(
        false,
      );
    });
  });
});
