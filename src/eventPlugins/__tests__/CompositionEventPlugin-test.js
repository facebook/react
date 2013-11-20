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

var CompositionEventPlugin = require('CompositionEventPlugin');
var keyOf = require('keyOf');

describe('CompositionEventPlugin', function() {
  it('should have dependencies for compositionEnd', function() {
    expect(CompositionEventPlugin.eventTypes).toBeDefined();
    expect(CompositionEventPlugin.eventTypes.compositionEnd).toBeDefined();
    expect(CompositionEventPlugin.eventTypes.compositionEnd.dependencies).toContain(keyOf({onKeyDown: null}));
    expect(CompositionEventPlugin.eventTypes.compositionEnd.dependencies).toContain(keyOf({onKeyUp: null}));
    expect(CompositionEventPlugin.eventTypes.compositionEnd.dependencies).toContain(keyOf({onKeyPress: null}));
    expect(CompositionEventPlugin.eventTypes.compositionEnd.dependencies).toContain(keyOf({onMouseDown: null}));
    expect(CompositionEventPlugin.eventTypes.compositionEnd.dependencies).toContain(keyOf({onBlur: null}));
    expect(CompositionEventPlugin.eventTypes.compositionEnd.dependencies).toContain(keyOf({onCompositionEnd: null}));
    expect(CompositionEventPlugin.eventTypes.compositionEnd.dependencies.length).toBe(6);
  });
  it('should have dependencies for compositionStart', function() {
    expect(CompositionEventPlugin.eventTypes).toBeDefined();
    expect(CompositionEventPlugin.eventTypes.compositionStart).toBeDefined();
    expect(CompositionEventPlugin.eventTypes.compositionStart.dependencies).toContain(keyOf({onKeyDown: null}));
    expect(CompositionEventPlugin.eventTypes.compositionStart.dependencies).toContain(keyOf({onKeyUp: null}));
    expect(CompositionEventPlugin.eventTypes.compositionStart.dependencies).toContain(keyOf({onKeyPress: null}));
    expect(CompositionEventPlugin.eventTypes.compositionStart.dependencies).toContain(keyOf({onMouseDown: null}));
    expect(CompositionEventPlugin.eventTypes.compositionStart.dependencies).toContain(keyOf({onBlur: null}));
    expect(CompositionEventPlugin.eventTypes.compositionStart.dependencies).toContain(keyOf({onCompositionStart: null}));
    expect(CompositionEventPlugin.eventTypes.compositionStart.dependencies.length).toBe(6);
  });
  it('should have dependencies for compositionUpdate', function() {
    expect(CompositionEventPlugin.eventTypes).toBeDefined();
    expect(CompositionEventPlugin.eventTypes.compositionUpdate).toBeDefined();
    expect(CompositionEventPlugin.eventTypes.compositionUpdate.dependencies).toContain(keyOf({onKeyDown: null}));
    expect(CompositionEventPlugin.eventTypes.compositionUpdate.dependencies).toContain(keyOf({onKeyUp: null}));
    expect(CompositionEventPlugin.eventTypes.compositionUpdate.dependencies).toContain(keyOf({onKeyPress: null}));
    expect(CompositionEventPlugin.eventTypes.compositionUpdate.dependencies).toContain(keyOf({onMouseDown: null}));
    expect(CompositionEventPlugin.eventTypes.compositionUpdate.dependencies).toContain(keyOf({onBlur: null}));
    expect(CompositionEventPlugin.eventTypes.compositionUpdate.dependencies).toContain(keyOf({onCompositionUpdate: null}));
    expect(CompositionEventPlugin.eventTypes.compositionUpdate.dependencies.length).toBe(6);
  });
});