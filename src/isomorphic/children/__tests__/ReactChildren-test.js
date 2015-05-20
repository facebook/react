/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

describe('ReactChildren', function() {
  var ReactChildren;
  var React;
  var ReactFragment;

  beforeEach(function() {
    ReactChildren = require('ReactChildren');
    React = require('React');
    ReactFragment = require('ReactFragment');
  });

  function nthChild(mappedChildren, n) {
    var result = null;
    ReactChildren.forEach(mappedChildren, function(child, index) {
      if (index === n) {
        result = child;
      }
    });
    return result;
  }

  function keyOfNthChild(mappedChildren, n) {
    return Object.keys(ReactFragment.extract(mappedChildren))[n];
  }

  it('should support identity for simple', function() {
    var callback = jasmine.createSpy().andCallFake(function(kid, index) {
      return kid;
    });

    var simpleKid = <span key="simple" />;

    // First pass children into a component to fully simulate what happens when
    // using structures that arrive from transforms.

    var instance = <div>{simpleKid}</div>;
    ReactChildren.forEach(instance.props.children, callback);
    expect(callback).toHaveBeenCalledWith(simpleKid, 0);
    callback.reset();
    var mappedChildren = ReactChildren.map(instance.props.children, callback);
    expect(callback).toHaveBeenCalledWith(simpleKid, 0);
    expect(nthChild(mappedChildren, 0)).toBe(simpleKid);
  });

  it('should treat single arrayless child as being in array', function() {
    var callback = jasmine.createSpy().andCallFake(function(kid, index) {
      return kid;
    });

    var simpleKid = <span />;
    var instance = <div>{simpleKid}</div>;
    ReactChildren.forEach(instance.props.children, callback);
    expect(callback).toHaveBeenCalledWith(simpleKid, 0);
    callback.reset();
    var mappedChildren = ReactChildren.map(instance.props.children, callback);
    expect(callback).toHaveBeenCalledWith(simpleKid, 0);
    expect(nthChild(mappedChildren, 0)).toBe(simpleKid);
  });

  it('should treat single child in array as expected', function() {
    var callback = jasmine.createSpy().andCallFake(function(kid, index) {
      return kid;
    });

    var simpleKid = <span key="simple" />;
    var instance = <div>{[simpleKid]}</div>;
    ReactChildren.forEach(instance.props.children, callback);
    expect(callback).toHaveBeenCalledWith(simpleKid, 0);
    callback.reset();
    var mappedChildren = ReactChildren.map(instance.props.children, callback);
    expect(callback).toHaveBeenCalledWith(simpleKid, 0);
    expect(nthChild(mappedChildren, 0)).toBe(simpleKid);

  });

  it('should pass key to returned component', function() {
    var mapFn = function(kid, index) {
      return <div>{kid}</div>;
    };

    var simpleKid = <span key="simple" />;

    var instance = <div>{simpleKid}</div>;
    var mappedChildren = ReactChildren.map(instance.props.children, mapFn);

    expect(ReactChildren.count(mappedChildren)).toBe(1);
    expect(nthChild(mappedChildren, 0)).not.toBe(simpleKid);
    expect(nthChild(mappedChildren, 0).props.children).toBe(simpleKid);
    expect(keyOfNthChild(mappedChildren, 0)).toBe('.$simple');
  });

  it('should invoke callback with the right context', function() {
    var lastContext;
    var callback = function(kid, index) {
      lastContext = this;
      return this;
    };

    // TODO: Use an object to test, after non-object fragments has fully landed.
    var scopeTester = 'scope tester';

    var simpleKid = <span key="simple" />;
    var instance = <div>{simpleKid}</div>;
    ReactChildren.forEach(instance.props.children, callback, scopeTester);
    expect(lastContext).toBe(scopeTester);

    var mappedChildren =
      ReactChildren.map(instance.props.children, callback, scopeTester);

    expect(ReactChildren.count(mappedChildren)).toBe(1);
    expect(nthChild(mappedChildren, 0)).toBe(scopeTester);
  });

  it('should be called for each child', function() {
    var zero = <div key="keyZero" />;
    var one = null;
    var two = <div key="keyTwo" />;
    var three = null;
    var four = <div key="keyFour" />;

    var zeroMapped = <div key="giraffe" />;  // Key should be joined to obj key
    var oneMapped = null;  // Key should be added even if we don't supply it!
    var twoMapped = <div />;  // Key should be added even if not supplied!
    var threeMapped = <span />; // Map from null to something.
    var fourMapped = <div key="keyFour" />;

    var callback = jasmine.createSpy().andCallFake(function(kid, index) {
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

    ReactChildren.forEach(instance.props.children, callback);
    expect(callback).toHaveBeenCalledWith(zero, 0);
    expect(callback).toHaveBeenCalledWith(one, 1);
    expect(callback).toHaveBeenCalledWith(two, 2);
    expect(callback).toHaveBeenCalledWith(three, 3);
    expect(callback).toHaveBeenCalledWith(four, 4);
    callback.reset();

    var mappedChildren =
      ReactChildren.map(instance.props.children, callback);
    expect(callback.calls.length).toBe(5);
    expect(ReactChildren.count(mappedChildren)).toBe(5);
    // Keys default to indices.
    expect([
      keyOfNthChild(mappedChildren, 0),
      keyOfNthChild(mappedChildren, 1),
      keyOfNthChild(mappedChildren, 2),
      keyOfNthChild(mappedChildren, 3),
      keyOfNthChild(mappedChildren, 4),
    ]).toEqual(
      ['.$keyZero', '.1', '.$keyTwo', '.3', '.$keyFour']
    );

    expect(callback).toHaveBeenCalledWith(zero, 0);
    expect(nthChild(mappedChildren, 0)).toBe(zeroMapped);

    expect(callback).toHaveBeenCalledWith(one, 1);
    expect(nthChild(mappedChildren, 1)).toBe(oneMapped);

    expect(callback).toHaveBeenCalledWith(two, 2);
    expect(nthChild(mappedChildren, 2)).toBe(twoMapped);

    expect(callback).toHaveBeenCalledWith(three, 3);
    expect(nthChild(mappedChildren, 3)).toBe(threeMapped);

    expect(callback).toHaveBeenCalledWith(four, 4);
    expect(nthChild(mappedChildren, 4)).toBe(fourMapped);
  });


  it('should be called for each child in nested structure', function() {
    var zero = <div key="keyZero" />;
    var one = null;
    var two = <div key="keyTwo" />;
    var three = null;
    var four = <div key="keyFour" />;
    var five = <div key="keyFiveInner" />;
    // five is placed into a JS object with a key that is joined to the
    // component key attribute.
    // Precedence is as follows:
    // 1. If grouped in an Object, the object key combined with `key` prop
    // 2. If grouped in an Array, the `key` prop, falling back to array index

    var zeroMapped = <div key="giraffe" />;  // Key should be overridden
    var oneMapped = null;  // Key should be added even if we don't supply it!
    var twoMapped = <div />;  // Key should be added even if not supplied!
    var threeMapped = <span />; // Map from null to something.
    var fourMapped = <div key="keyFour" />;
    var fiveMapped = <div />;

    var callback = jasmine.createSpy().andCallFake(function(kid, index) {
      return index === 0 ? zeroMapped :
        index === 1 ? oneMapped :
        index === 2 ? twoMapped :
        index === 3 ? threeMapped :
        index === 4 ? fourMapped : fiveMapped;
    });

    var instance = (
      <div>{
        [
          ReactFragment.create({
            firstHalfKey: [zero, one, two],
            secondHalfKey: [three, four],
            keyFive: five,
          }),
        ]
      }</div>
    );

    ReactChildren.forEach(instance.props.children, callback);
    expect(callback).toHaveBeenCalledWith(zero, 0);
    expect(callback).toHaveBeenCalledWith(one, 1);
    expect(callback).toHaveBeenCalledWith(two, 2);
    expect(callback).toHaveBeenCalledWith(three, 3);
    expect(callback).toHaveBeenCalledWith(four, 4);
    expect(callback).toHaveBeenCalledWith(five, 5);
    callback.reset();

    var mappedChildren = ReactChildren.map(instance.props.children, callback);
    expect(callback.calls.length).toBe(6);
    expect(ReactChildren.count(mappedChildren)).toBe(6);
    // Keys default to indices.
    expect([
      keyOfNthChild(mappedChildren, 0),
      keyOfNthChild(mappedChildren, 1),
      keyOfNthChild(mappedChildren, 2),
      keyOfNthChild(mappedChildren, 3),
      keyOfNthChild(mappedChildren, 4),
      keyOfNthChild(mappedChildren, 5),
    ]).toEqual([
      '.0:$firstHalfKey:0:$keyZero',
      '.0:$firstHalfKey:0:1',
      '.0:$firstHalfKey:0:$keyTwo',
      '.0:$secondHalfKey:0:0',
      '.0:$secondHalfKey:0:$keyFour',
      '.0:$keyFive:$keyFiveInner',
    ]);

    expect(callback).toHaveBeenCalledWith(zero, 0);
    expect(nthChild(mappedChildren, 0)).toBe(zeroMapped);

    expect(callback).toHaveBeenCalledWith(one, 1);
    expect(nthChild(mappedChildren, 1)).toBe(oneMapped);

    expect(callback).toHaveBeenCalledWith(two, 2);
    expect(nthChild(mappedChildren, 2)).toBe(twoMapped);

    expect(callback).toHaveBeenCalledWith(three, 3);
    expect(nthChild(mappedChildren, 3)).toBe(threeMapped);

    expect(callback).toHaveBeenCalledWith(four, 4);
    expect(nthChild(mappedChildren, 4)).toBe(fourMapped);

    expect(callback).toHaveBeenCalledWith(five, 5);
    expect(nthChild(mappedChildren, 5)).toBe(fiveMapped);
  });

  it('should retain key across two mappings', function() {
    var zeroForceKey = <div key="keyZero" />;
    var oneForceKey = <div key="keyOne" />;

    // Key should be joined to object key
    var zeroForceKeyMapped = <div key="giraffe" />;
    // Key should be added even if we don't supply it!
    var oneForceKeyMapped = <div />;

    var mapFn = function(kid, index) {
      return index === 0 ? zeroForceKeyMapped : oneForceKeyMapped;
    };

    var forcedKeys = (
      <div>
        {zeroForceKey}
        {oneForceKey}
      </div>
    );

    var expectedForcedKeys = ['.$keyZero', '.$keyOne'];
    var mappedChildrenForcedKeys =
      ReactChildren.map(forcedKeys.props.children, mapFn);
    var mappedForcedKeys = Object.keys(mappedChildrenForcedKeys);
    expect(mappedForcedKeys).toEqual(expectedForcedKeys);

    var expectedRemappedForcedKeys = [
      '.$=1$keyZero:$giraffe',
      '.$=1$keyOne:0',
    ];
    var remappedChildrenForcedKeys =
      ReactChildren.map(mappedChildrenForcedKeys, mapFn);
    expect(
      Object.keys(remappedChildrenForcedKeys)
    ).toEqual(expectedRemappedForcedKeys);

  });

  it('should not throw if key provided is a dupe with array key', function() {
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
      ReactChildren.map(instance.props.children, mapFn);
    }).not.toThrow();
  });

  it('should warn if key provided is a dupe with explicit key', function() {
    var zero = <div key="something"/>;
    var one = <span key="something" />;

    var mapFn = function(component) {
      return component;
    };
    var instance = (
      <div>{zero}{one}</div>
    );

    spyOn(console, 'error');
    var mapped = ReactChildren.map(instance.props.children, mapFn);

    expect(console.error.calls.length).toEqual(1);
    expect(nthChild(mapped, 0)).toBe(zero);
    expect(keyOfNthChild(mapped, 0)).toBe('.$something');
  });

  it('should return 0 for null children', function() {
    var numberOfChildren = ReactChildren.count(null);
    expect(numberOfChildren).toBe(0);
  });

  it('should return 0 for undefined children', function() {
    var numberOfChildren = ReactChildren.count(undefined);
    expect(numberOfChildren).toBe(0);
  });

  it('should return 1 for single child', function() {
    var simpleKid = <span key="simple" />;
    var instance = <div>{simpleKid}</div>;
    var numberOfChildren = ReactChildren.count(instance.props.children);
    expect(numberOfChildren).toBe(1);
  });

  it('should count the number of children in flat structure', function() {
    var zero = <div key="keyZero" />;
    var one = null;
    var two = <div key="keyTwo" />;
    var three = null;
    var four = <div key="keyFour" />;

    var instance = (
      <div>
        {zero}
        {one}
        {two}
        {three}
        {four}
      </div>
    );
    var numberOfChildren = ReactChildren.count(instance.props.children);
    expect(numberOfChildren).toBe(5);
  });

  it('should count the number of children in nested structure', function() {
    var zero = <div key="keyZero" />;
    var one = null;
    var two = <div key="keyTwo" />;
    var three = null;
    var four = <div key="keyFour" />;
    var five = <div key="keyFiveInner" />;
    // five is placed into a JS object with a key that is joined to the
    // component key attribute.
    // Precedence is as follows:
    // 1. If grouped in an Object, the object key combined with `key` prop
    // 2. If grouped in an Array, the `key` prop, falling back to array index

    var instance = (
      <div>{
        [
          ReactFragment.create({
            firstHalfKey: [zero, one, two],
            secondHalfKey: [three, four],
            keyFive: five,
          }),
        ]
      }</div>
    );
    var numberOfChildren = ReactChildren.count(instance.props.children);
    expect(numberOfChildren).toBe(6);
  });

  it('should warn if a fragment is used without the wrapper', function() {
    spyOn(console, 'error');
    var child = React.createElement('span');
    ReactChildren.forEach({a: child, b: child}, function(c) {
      expect(c).toBe(child);
    });
    expect(console.error.calls.length).toBe(1);
    expect(console.error.calls[0].args[0]).toContain('use of a keyed object');
  });

  it('should warn if a fragment is accessed', function() {
    spyOn(console, 'error');
    var child = React.createElement('span');
    var frag = ReactChildren.map([child, child], function(c) {
      return c;
    });
    for (var key in frag) {
      void frag[key];
      break;
    }
    expect(console.error.calls.length).toBe(1);
    expect(console.error.calls[0].args[0]).toContain('is an opaque type');

    var frag2 = ReactChildren.map([child, child], function(c) {
      return c;
    });
    for (var key2 in frag2) {
      frag2[key2] = 123;
      break;
    }
    expect(console.error.calls.length).toBe(2);
    expect(console.error.calls[1].args[0]).toContain('is an immutable opaque');
  });

});
