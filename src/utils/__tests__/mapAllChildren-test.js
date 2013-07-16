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

describe('mapAllChildren', function() {
  var mapAllChildren;
  var React;

  beforeEach(function() {
    mapAllChildren = require('mapAllChildren');
    React = require('React');
  });


  it('should support identity for simple', function() {
    var mapFn = jasmine.createSpy().andCallFake(function (kid, key, index) {
      return kid;
    });

    var simpleKid = <span key="simple" />;

    // First pass children into a component to fully simulate what happens when
    // using structures that arrive from transforms.

    var instance = <div>{simpleKid}</div>;
    var mappedChildren = mapAllChildren(instance.props.children, mapFn);
    expect(mapFn).toHaveBeenCalledWith(simpleKid, '[simple]', 0);
    expect(mappedChildren[Object.keys(mappedChildren)[0]]).toBe(simpleKid);
  });

  it('should treat single arrayless child as being in array', function() {
    var mapFn = jasmine.createSpy().andCallFake(function (kid, key, index) {
      return kid;
    });

    var simpleKid = <span />;
    var instance = <div>{simpleKid}</div>;
    var mappedChildren = mapAllChildren(instance.props.children, mapFn);
    expect(mapFn).toHaveBeenCalledWith(simpleKid, '[0]', 0);
    expect(mappedChildren[Object.keys(mappedChildren)[0]]).toBe(simpleKid);
  });

  it('should treat single child in array as expected', function() {
    var mapFn = jasmine.createSpy().andCallFake(function (kid, key, index) {
      return kid;
    });

    var simpleKid = <span />;
    var instance = <div>{[simpleKid]}</div>;
    var mappedChildren = mapAllChildren(instance.props.children, mapFn);
    expect(mapFn).toHaveBeenCalledWith(simpleKid, '[0]', 0);
    expect(mappedChildren[Object.keys(mappedChildren)[0]]).toBe(simpleKid);
  });

  it('should pass key to returned component', function() {
    var mapFn = function (kid, key, index) {
      return <div>{kid}</div>;
    };

    var simpleKid = <span key="simple" />;

    var instance = <div>{simpleKid}</div>;
    var mappedChildren = mapAllChildren(instance.props.children, mapFn);

    var mappedKeys = Object.keys(mappedChildren);
    expect(mappedKeys.length).toBe(1);
    expect(mappedChildren[mappedKeys[0]]).not.toBe(simpleKid);
    expect(mappedChildren[mappedKeys[0]].props.children).toBe(simpleKid);
    expect(mappedKeys[0]).toBe('[simple]');
  });

  it('should invoke callback with the right context', function() {
    var mapFn = function (kid, key, index) {
      return this;
    };

    var scopeTester = {};

    var simpleKid = <span key="simple" />;
    var instance = <div>{simpleKid}</div>;
    var mappedChildren =
      mapAllChildren(instance.props.children, mapFn, scopeTester);

    var mappedKeys = Object.keys(mappedChildren);
    expect(mappedKeys.length).toBe(1);
    expect(mappedChildren[mappedKeys[0]]).toBe(scopeTester);
  });

  it('should be called for each child', function() {
    var zero = <div key="keyZero" />;
    var one = null;
    var two = <div key="keyTwo" />;
    var three = null;
    var four = <div key="keyFour" />;

    var zeroMapped = <div key="giraffe" />;  // Key should be overridden
    var oneMapped = null;  // Key should be added even if we don't supply it!
    var twoMapped = <div />;  // Key should be added even if not supplied!
    var threeMapped = <span />; // Map from null to something.
    var fourMapped = <div key="keyFour" />;

    var mapFn = jasmine.createSpy().andCallFake(function (kid, key, index) {
      return index === 0 ? zeroMapped :
        index === 1 ? oneMapped :
        index === 2 ? twoMapped :
        index === 3 ? threeMapped : fourMapped;
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

    var mappedChildren = mapAllChildren(instance.props.children, mapFn);
    var mappedKeys = Object.keys(mappedChildren);
    expect(mapFn.calls.length).toBe(5);
    expect(mappedKeys.length).toBe(5);
    // Keys default to indices.
    expect(mappedKeys).toEqual(
      ['[keyZero]', '[1]', '[keyTwo]', '[3]', '[keyFour]']
    );

    expect(mapFn).toHaveBeenCalledWith(zero, '[keyZero]', 0);
    expect(mappedChildren[mappedKeys[0]]).toBe(zeroMapped);

    expect(mapFn).toHaveBeenCalledWith(one, '[1]', 1);
    expect(mappedChildren[mappedKeys[1]]).toBe(oneMapped);

    expect(mapFn).toHaveBeenCalledWith(two, '[keyTwo]', 2);
    expect(mappedChildren[mappedKeys[2]]).toBe(twoMapped);

    expect(mapFn).toHaveBeenCalledWith(three, '[3]', 3);
    expect(mappedChildren[mappedKeys[3]]).toBe(threeMapped);

    expect(mapFn).toHaveBeenCalledWith(four, '[keyFour]', 4);
    expect(mappedChildren[mappedKeys[4]]).toBe(fourMapped);
  });


  it('should be called for each child in nested structure', function() {
    var zero = <div key="keyZero" />;
    var one = null;
    var two = <div key="keyTwo" />;
    var three = null;
    var four = <div key="keyFour" />;
    var five = <div key="keyFiveCompletelyIgnored" />;
    // five is placed into a JS object with a key that takes precedence over the
    // component key attribute.
    // Precedence is as follows:
    // 1. JavaScript Object key if in a JavaScript object:
    // 2. If grouped in an Array, the `key` attribute.
    // 3. The array index if in a JavaScript Array.

    var zeroMapped = <div key="giraffe" />;  // Key should be overridden
    var oneMapped = null;  // Key should be added even if we don't supply it!
    var twoMapped = <div />;  // Key should be added even if not supplied!
    var threeMapped = <span />; // Map from null to something.
    var fourMapped = <div key="keyFour" />;
    var fiveMapped = <div />;

    var mapFn = jasmine.createSpy().andCallFake(function (kid, key, index) {
      return index === 0 ? zeroMapped :
        index === 1 ? oneMapped :
        index === 2 ? twoMapped :
        index === 3 ? threeMapped :
        index === 4 ? fourMapped : fiveMapped;
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

    var mappedChildren = mapAllChildren(instance.props.children, mapFn);
    var mappedKeys = Object.keys(mappedChildren);
    expect(mapFn.calls.length).toBe(6);
    expect(mappedKeys.length).toBe(6);
    // Keys default to indices.
    expect(mappedKeys).toEqual([
      '[0]{firstHalfKey}[keyZero]',
      '[0]{firstHalfKey}[1]',
      '[0]{firstHalfKey}[keyTwo]',
      '[0]{secondHalfKey}[0]',
      '[0]{secondHalfKey}[keyFour]',
      '[0]{keyFive}'
    ]);

    expect(mapFn).toHaveBeenCalledWith(zero, '[0]{firstHalfKey}[keyZero]', 0);
    expect(mappedChildren[mappedKeys[0]]).toBe(zeroMapped);

    expect(mapFn).toHaveBeenCalledWith(one, '[0]{firstHalfKey}[1]', 1);
    expect(mappedChildren[mappedKeys[1]]).toBe(oneMapped);

    expect(mapFn).toHaveBeenCalledWith(two, '[0]{firstHalfKey}[keyTwo]', 2);
    expect(mappedChildren[mappedKeys[2]]).toBe(twoMapped);

    expect(mapFn).toHaveBeenCalledWith(three, '[0]{secondHalfKey}[0]', 3);
    expect(mappedChildren[mappedKeys[3]]).toBe(threeMapped);

    expect(mapFn).toHaveBeenCalledWith(four, '[0]{secondHalfKey}[keyFour]', 4);
    expect(mappedChildren[mappedKeys[4]]).toBe(fourMapped);

    expect(mapFn).toHaveBeenCalledWith(five, '[0]{keyFive}', 5);
    expect(mappedChildren[mappedKeys[5]]).toBe(fiveMapped);
  });

  it('should retain key across two mappings', function() {
    var zeroForceKey = <div key="keyZero" />;
    var oneForceKey = <div key="keyOne" />;

    // Key should be overridden
    var zeroForceKeyMapped = <div key="giraffe" />;
    // Key should be added even if we don't supply it!
    var oneForceKeyMapped = <div />;

    var mapFn = function(kid, key, index) {
      return index === 0 ? zeroForceKeyMapped : oneForceKeyMapped;
    };

    var forcedKeys = (
      <div>
        {zeroForceKey}
        {oneForceKey}
      </div>
    );

    var expectedForcedKeys = ['[keyZero]', '[keyOne]'];
    var mappedChildrenForcedKeys =
      mapAllChildren(forcedKeys.props.children, mapFn);
    var mappedForcedKeys = Object.keys(mappedChildrenForcedKeys);
    expect(mappedForcedKeys).toEqual(expectedForcedKeys);

    var expectedRemappedForcedKeys = ['{[keyZero]}', '{[keyOne]}'];
    var remappedChildrenForcedKeys =
      mapAllChildren(mappedChildrenForcedKeys, mapFn);
    expect(
      Object.keys(remappedChildrenForcedKeys)
    ).toEqual(expectedRemappedForcedKeys);

  });

  it('should throw if key provided is a dupe with array key', function() {
    var zero = <div />;
    var one = <div key="0" />;

    var mapFn = function() {
      return null;
    };

    var instance = (
      <div>
        {zero}
        {one}
      </div>
    );

    expect(function() {
      mapAllChildren(instance.props.children, mapFn);
    }).toThrow();
  });

  it('should throw if key provided is a dupe with explicit key', function() {
    var zero = <div key="something"/>;
    var one = <div key="something" />;

    var mapFn = function() {return null;};
    var instance = (
      <div>{zero}{one}</div>
    );

    expect(function() {
      mapAllChildren(instance.props.children, mapFn);
    }).toThrow();
  });
});
