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
  .dontMock('CallbackRegistry')
  .mock('isEventSupported');

describe('CallbackRegistry', function() {
  var CallbackRegistry;
  var isEventSupported;

  beforeEach(function() {
    require('mock-modules').dumpCache();
    CallbackRegistry = require('CallbackRegistry');
    isEventSupported = require('isEventSupported');
    isEventSupported.mockReturnValue(false);
  });

  it('should warn about the `onScroll` issue on IE8', function() {
    spyOn(console, 'warn');
    CallbackRegistry.putListener(1, 'onScroll', function(){});
    expect(console.warn.callCount).toBe(1);
    expect(console.warn.mostRecentCall.args[0]).toBe(
      'This browser doesn\'t support the `onScroll` event'
    );
  });

});
