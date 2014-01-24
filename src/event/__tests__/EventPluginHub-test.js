/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @emails react-core
 */

"use strict";

require('mock-modules')
  .dontMock('EventPluginHub')
  .mock('isEventSupported');

var keyOf = require('keyOf');
var mocks = require('mocks');

describe('EventPluginHub', function() {
  var EventPluginHub;
  var isEventSupported;

  beforeEach(function() {
    require('mock-modules').dumpCache();
    EventPluginHub = require('EventPluginHub');
    isEventSupported = require('isEventSupported');
    isEventSupported.mockReturnValue(false);
  });

  describe('event registration', function() {
    var id, key, listener;
    beforeEach(function() {
      id = '.reactRoot.[0].[0].[0]';
      key = keyOf({onClick: null});
      listener = mocks.getMockFunction();
    });
    it('should be enabled by default', function() {
      expect(EventPluginHub.isRegistrationEnabled()).toEqual(true);
    });
    describe('disabled', function() {
      beforeEach(function() {
        EventPluginHub.setRegistrationEnabled(false);
      });
      it('should not register listeners', function() {
        EventPluginHub.setRegistrationEnabled(false);
        EventPluginHub.putListener(id, key, listener);
        var registeredListener = EventPluginHub.getListener(id, key);
        expect(registeredListener).not.toEqual(listener);
      });
      it('should report', function() {
        expect(EventPluginHub.isRegistrationEnabled()).toEqual(false);
      });
    });
    describe('enabled', function() {
      beforeEach(function() {
        EventPluginHub.setRegistrationEnabled(true);
      });
      it('should register listeners', function() {
        EventPluginHub.putListener(id, key, listener);
        var registeredListener = EventPluginHub.getListener(id, key);
        expect(registeredListener).toEqual(listener);
      });
      it('should report', function() {
        expect(EventPluginHub.isRegistrationEnabled()).toEqual(true);
      });
    });
  });

  it('should warn about the `onScroll` issue on IE8', function() {
    spyOn(console, 'warn');
    EventPluginHub.putListener(1, 'onScroll', function(){});
    expect(console.warn.callCount).toBe(1);
    expect(console.warn.mostRecentCall.args[0]).toBe(
      'This browser doesn\'t support the `onScroll` event'
    );
  });

});
