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

var ChangeEventPlugin = require('ChangeEventPlugin');
var keyOf = require('keyOf');

describe('ChangeEventPlugin', function() {
  it('should have dependencies', function() {
    expect(ChangeEventPlugin.eventTypes).toBeDefined();
    expect(ChangeEventPlugin.eventTypes.change).toBeDefined();
    expect(ChangeEventPlugin.eventTypes.change.dependencies).toContain(keyOf({onInput: null}));
    expect(ChangeEventPlugin.eventTypes.change.dependencies).toContain(keyOf({onKeyUp: null}));
    expect(ChangeEventPlugin.eventTypes.change.dependencies).toContain(keyOf({onKeyDown: null}));
    expect(ChangeEventPlugin.eventTypes.change.dependencies).toContain(keyOf({onFocus: null}));
    expect(ChangeEventPlugin.eventTypes.change.dependencies).toContain(keyOf({onBlur: null}));
    expect(ChangeEventPlugin.eventTypes.change.dependencies.length).toBe(5);
  });
});