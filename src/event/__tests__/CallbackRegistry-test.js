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

describe('CallbackRegistry', function() {
  var CallbackRegistry;

  beforeEach(function() {
    CallbackRegistry = require('CallbackRegistry');
  });

  it('should bind to a function', function(){
    var noop = function(){};
    expect(function(){
      CallbackRegistry.putListener('test', 'onClick', noop);
    }).not.toThrow();
  });

  it('should throw when binding to a non-function', function(){
    expect(function(){
      CallbackRegistry.putListener('test', 'onClick', {});
    }).toThrow();
  });
});