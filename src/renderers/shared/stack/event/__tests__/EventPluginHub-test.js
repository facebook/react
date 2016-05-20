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

jest
  .unmock('EventPluginHub')
  .mock('isEventSupported');

describe('EventPluginHub', function() {
  var EventPluginHub;
  var isEventSupported;

  beforeEach(function() {
    jest.resetModuleRegistry();
    EventPluginHub = require('EventPluginHub');
    isEventSupported = require('isEventSupported');
    isEventSupported.mockReturnValueOnce(false);
  });

  it('should prevent non-function listeners', function() {
    expect(function() {
      EventPluginHub.putListener(1, 'onClick', 'not a function');
    }).toThrowError(
      'Expected onClick listener to be a function, instead got type string'
    );
  });
});
