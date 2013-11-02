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

var Advice = require('Advice');
var mocks = require('mocks');

describe('Advice', function() {
  var base, callback;

  beforeEach(function() {
    base = mocks.getMockFunction();
    callback = mocks.getMockFunction();
  });
  
  describe('wrappedBefore', function() {
    it('should invoke callback before base', function() {
      var stack = [];
      
      base.mockImplementation(function() {
        stack.push(base);
      });
      callback.mockImplementation(function() {
        stack.push(callback);
      });

      Advice.before(base, callback)();
      expect(stack[0]).toBe(callback);
      expect(stack[1]).toBe(base);
    });

    it('should pass `this` and `arguments` to base and callback', function() {
      var args = ['Tom', 'Dick', 'Harry'];
      var context = {};

      Advice.before(base, callback).apply(context, args);
      expect(base.mock.calls[0]).toEqual(args);
      expect(base.mock.instances[0]).toBe(context);
      expect(callback.mock.calls[0]).toEqual(args);
      expect(callback.mock.instances[0]).toBe(context);
    });

    it('should return whatever base returns', function() {
      var result = {};
      base.mockDefaultReturnValue(result);
      expect(Advice.before(base, callback)()).toBe(base());
    });
  });

  describe('wrappedAfter', function() {
    it('should invoke callback after base', function() {
      var stack = [];
      
      base.mockImplementation(function() {
        stack.push(base);
      });
      callback.mockImplementation(function() {
        stack.push(callback);
      });

      Advice.after(base, callback)();
      expect(stack[0]).toBe(base);
      expect(stack[1]).toBe(callback);
    });

    it('should pass `this` and `arguments` to base and callback', function() {
      var args = ['Tom', 'Dick', 'Harry'];
      var context = {};

      Advice.after(base, callback).apply(context, args);
      expect(base.mock.calls[0]).toEqual(args);
      expect(base.mock.instances[0]).toBe(context);
      expect(callback.mock.calls[0]).toEqual(args);
      expect(callback.mock.instances[0]).toBe(context);
    });

    it('should return whatever base returns', function() {
      var result = {};
      base.mockDefaultReturnValue(result);
      expect(Advice.after(base, callback)()).toBe(base());
    });
  });

  describe('wrappedAround', function() {
    it('should invoke callback with base as first argument', function() {
      var stack = [];
      callback.mockImplementation(function(first) {
        stack.push(first);
        first('pizza');
      });
      Advice.around(base, callback)();
      expect(base.mock.calls[0]).toEqual(['pizza']);
    });

    it('should bind base to context', function() {
      var context = {};
      callback.mockImplementation(function(first) {
        first.call(null);
      });
      Advice.around(base, callback).call(context);
      expect(base.mock.instances[0]).toBe(context);
    });

    it('should invoke callback with `arguments` unshifted but same `this`',
       function() {
      var args = ['Tom', 'Dick', 'Harry'];
      var context1 = {};
      var context2 = {};
      Advice.around(base, callback).apply(context1, args);
      Advice.around(base, callback).apply(context2, args);
      expect(callback.mock.calls[0].slice(1)).toEqual(args);
      expect(callback.mock.calls[1].slice(1)).toEqual(args);
      expect(callback.mock.instances[0]).toBe(context1);
      expect(callback.mock.instances[1]).toBe(context2);
    });

    it('should return whatever the callback returns', function() {
      var result = {};
      base.mockDefaultReturnValue(null);
      callback.mockDefaultReturnValue(result);
      expect(Advice.around(base, callback)()).toBe(result);
    });
  });

  describe('wrappedFilter', function() {
    it('should work as normal if callback returns truthy', function() {
      var result = {};
      base.mockDefaultReturnValue(result);
      callback.mockDefaultReturnValue(1);
      expect(Advice.filter(base, callback)()).toBe(result);
      expect(base.mock.calls.length).toEqual(1);
    });

    it('should disable base if callback returns falsy', function() {
      base.mockDefaultReturnValue(null);
      callback.mockDefaultReturnValue(0);
      expect(Advice.filter(base, callback)()).toBeUndefined();
      expect(base.mock.calls.length).toEqual(0);
    });
  });
});
