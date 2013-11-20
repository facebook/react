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

var EnterLeaveEventPlugin = require('EnterLeaveEventPlugin');
var keyOf = require('keyOf');

describe('EnterLeavePlugin', function() {
  it('should have dependencies for mouseEnter', function() {
    expect(EnterLeaveEventPlugin.eventTypes).toBeDefined();
    expect(EnterLeaveEventPlugin.eventTypes.mouseEnter).toBeDefined();
    expect(EnterLeaveEventPlugin.eventTypes.mouseEnter.dependencies).toContain(keyOf({onMouseOut: null}));
    expect(EnterLeaveEventPlugin.eventTypes.mouseEnter.dependencies).toContain(keyOf({onMouseOver: null}));
    expect(EnterLeaveEventPlugin.eventTypes.mouseEnter.dependencies.length).toBe(2);
  });
  it('should have dependencies for mouseLeave', function() {
    expect(EnterLeaveEventPlugin.eventTypes).toBeDefined();
    expect(EnterLeaveEventPlugin.eventTypes.mouseLeave).toBeDefined();
    expect(EnterLeaveEventPlugin.eventTypes.mouseLeave.dependencies).toContain(keyOf({onMouseOut: null}));
    expect(EnterLeaveEventPlugin.eventTypes.mouseLeave.dependencies).toContain(keyOf({onMouseOver: null}));
    expect(EnterLeaveEventPlugin.eventTypes.mouseLeave.dependencies.length).toBe(2);
  });
});