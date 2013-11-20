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

var keyOf;
var EventPluginUtils;
var TapEventPlugin;

beforeEach(function() {
  require('mock-modules').dumpCache();

  keyOf = require('keyOf');
  EventPluginUtils = require('EventPluginUtils');
});

describe('TapEventPlugin', function() {
  it('should have default dependencies', function() {
    TapEventPlugin = require('TapEventPlugin');
    expect(TapEventPlugin.eventTypes).toBeDefined();
    expect(TapEventPlugin.eventTypes.touchTap).toBeDefined();
    expect(TapEventPlugin.eventTypes.touchTap.dependencies).toContain(keyOf({onMouseDown: null}));
    expect(TapEventPlugin.eventTypes.touchTap.dependencies).toContain(keyOf({onMouseMove: null}));
    expect(TapEventPlugin.eventTypes.touchTap.dependencies).toContain(keyOf({onMouseUp: null}));
    expect(TapEventPlugin.eventTypes.touchTap.dependencies.length).toBe(3);
  });
  it('should also have touch dependencies when EventPluginUtils.supportTouch is true', function() {
    EventPluginUtils.supportTouch = true;
    TapEventPlugin = require('TapEventPlugin');
    expect(TapEventPlugin.eventTypes).toBeDefined();
    expect(TapEventPlugin.eventTypes.touchTap).toBeDefined();
    expect(TapEventPlugin.eventTypes.touchTap.dependencies).toContain(keyOf({onTouchStart: null}));
    expect(TapEventPlugin.eventTypes.touchTap.dependencies).toContain(keyOf({onTouchMove: null}));
    expect(TapEventPlugin.eventTypes.touchTap.dependencies).toContain(keyOf({onTouchEnd: null}));
    expect(TapEventPlugin.eventTypes.touchTap.dependencies).toContain(keyOf({onTouchCancel: null}));
    expect(TapEventPlugin.eventTypes.touchTap.dependencies).toContain(keyOf({onMouseDown: null}));
    expect(TapEventPlugin.eventTypes.touchTap.dependencies).toContain(keyOf({onMouseMove: null}));
    expect(TapEventPlugin.eventTypes.touchTap.dependencies).toContain(keyOf({onMouseUp: null}));
    expect(TapEventPlugin.eventTypes.touchTap.dependencies.length).toBe(7);
  });
});