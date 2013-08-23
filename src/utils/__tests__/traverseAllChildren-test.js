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
 * @jsx React.DOM
 */

"use strict";

describe('traverseAllChildren', function() {
  var traverseAllChildren;
  var React;
  beforeEach(function() {
    traverseAllChildren = require('traverseAllChildren');
    React = require('React');
  });


  it('should support identity for simple', function() {
    var traverseContext = [];
    var traverseFn =
      jasmine.createSpy().andCallFake(function (context, kid, key, index) {
        context.push(true);
      });

    var simpleKid = <span key="simple" />;

    // Jasmine doesn't provide a way to test that the fn was invoked with scope.
    var instance = <div>{simpleKid}</div>;
    traverseAllChildren(instance.props.children, traverseFn, traverseContext);
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      simpleKid,
      '{simple}',
      0
    );
    expect(traverseContext.length).toEqual(1);
  });

  it('should treat single arrayless child as being in array', function() {
    var traverseContext = [];
    var traverseFn =
      jasmine.createSpy().andCallFake(function (context, kid, key, index) {
        context.push(true);
      });

    var simpleKid = <span />;
    var instance = <div>{simpleKid}</div>;
    traverseAllChildren(instance.props.children, traverseFn, traverseContext);
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      simpleKid,
      '[0]',
      0
    );
    expect(traverseContext.length).toEqual(1);
  });

  it('should treat single child in array as expected', function() {
    var traverseContext = [];
    var traverseFn =
      jasmine.createSpy().andCallFake(function (context, kid, key, index) {
        context.push(true);
      });

    var simpleKid = <span />;
    var instance = <div>{[simpleKid]}</div>;
    traverseAllChildren(instance.props.children, traverseFn, traverseContext);
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      simpleKid,
      '[0]',
      0
    );
    expect(traverseContext.length).toEqual(1);
  });

  it('should be called for each child', function() {
    var zero = <div key="keyZero" />;
    var one = null;
    var two = <div key="keyTwo" />;
    var three = null;
    var four = <div key="keyFour" />;

    var traverseContext = [];
    var traverseFn =
      jasmine.createSpy().andCallFake(function (context, kid, key, index) {
        context.push(true);
      });

    var instance = (
      <div>
        {zero}
        {one}
        {two}
        {three}
        {four}
      </div>
    );

    traverseAllChildren(instance.props.children, traverseFn, traverseContext);
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      zero,
      '{keyZero}',
      0
    );
    expect(traverseFn).toHaveBeenCalledWith(traverseContext, one, '[1]', 1);
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      two,
      '{keyTwo}',
      2
    );
    expect(traverseFn).toHaveBeenCalledWith(traverseContext, three, '[3]', 3);
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      four,
      '{keyFour}',
      4
    );
  });

  // Todo: test that nums/strings are converted to ReactComponents.

  it('should be called for each child in nested structure', function() {
    var zero = <div key="keyZero" />;
    var one = null;
    var two = <div key="keyTwo" />;
    var three = null;
    var four = <div key="keyFour" />;
    var five = <div key="keyFiveCompletelyIgnored" />;
    // Name precedence is as follows:
    // 1. JavaScript Object key if in a JavaScript object:
    // 2. If grouped in an Array, the `key` attribute.
    // 3. The array index if in a JavaScript Array.


    var traverseContext = [];
    var traverseFn =
      jasmine.createSpy().andCallFake(function (context, kid, key, index) {
        context.push(true);
      });

    var instance = (
      <div>{
        [{
          firstHalfKey: [zero, one, two],
          secondHalfKey: [three, four],
          keyFive: five
        }]
      }</div>
    );

    traverseAllChildren(instance.props.children, traverseFn, traverseContext);
    expect(traverseFn.calls.length).toBe(6);
    expect(traverseContext.length).toEqual(6);
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      zero,
      '[0]{firstHalfKey}{keyZero}',
      0
    );

    expect(traverseFn)
      .toHaveBeenCalledWith(traverseContext, one, '[0]{firstHalfKey}[1]', 1);

    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      two,
      '[0]{firstHalfKey}{keyTwo}',
      2
    );

    expect(traverseFn)
      .toHaveBeenCalledWith(traverseContext, three, '[0]{secondHalfKey}[0]', 3);

    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      four,
      '[0]{secondHalfKey}{keyFour}',
      4
    );

    expect(traverseFn)
      .toHaveBeenCalledWith(traverseContext, five, '[0]{keyFive}', 5);
  });

  it('should retain key across two mappings', function() {
    var zeroForceKey = <div key="keyZero" />;
    var oneForceKey = <div key="keyOne" />;
    var traverseContext = [];
    var traverseFn =
      jasmine.createSpy().andCallFake(function (context, kid, key, index) {
        context.push(true);
      });

    var forcedKeys = (
      <div>
        {zeroForceKey}
        {oneForceKey}
      </div>
    );

    traverseAllChildren(forcedKeys.props.children, traverseFn, traverseContext);
    expect(traverseContext.length).toEqual(2);
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      zeroForceKey,
      '{keyZero}',
      0
    );
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      oneForceKey,
      '{keyOne}',
      1
    );
  });

});
