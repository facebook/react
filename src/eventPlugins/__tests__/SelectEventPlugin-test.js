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

var SelectEventPlugin = require('SelectEventPlugin');
var keyOf = require('keyOf');

describe('SelectEventPlugin', function() {
  it('should have dependencies', function() {
    expect(SelectEventPlugin.eventTypes).toBeDefined();
    expect(SelectEventPlugin.eventTypes.select).toBeDefined();
    expect(SelectEventPlugin.eventTypes.select.dependencies).toContain(keyOf({onBlur: null}));
    expect(SelectEventPlugin.eventTypes.select.dependencies).toContain(keyOf({onFocus: null}));
    expect(SelectEventPlugin.eventTypes.select.dependencies).toContain(keyOf({onMouseUp: null}));
    expect(SelectEventPlugin.eventTypes.select.dependencies).toContain(keyOf({onMouseDown: null}));
    expect(SelectEventPlugin.eventTypes.select.dependencies).toContain(keyOf({onSelectionChange: null}));
    expect(SelectEventPlugin.eventTypes.select.dependencies).toContain(keyOf({onKeyDown: null}));
    expect(SelectEventPlugin.eventTypes.select.dependencies.length).toBe(6);
  });
});