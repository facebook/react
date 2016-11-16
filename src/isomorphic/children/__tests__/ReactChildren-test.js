/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

describe('ReactChildren', () => {
  var ReactChildren;
  var React;
  var ReactFragment;

  beforeEach(() => {
    ReactChildren = require('ReactChildren');
    React = require('React');
    ReactFragment = require('ReactFragment');
  });

  it('should support identity for simple', () => {
    var callback = jasmine.createSpy().and.callFake(function(kid, index) {
      return kid;
    });

    var simpleKid = <span key="simple" />;

    // First pass children into a component to fully simulate what happens when
    // using structures that arrive from transforms.

    var instance = <div>{simpleKid}</div>;
    ReactChildren.forEach(instance.props.children, callback);
    expect(callback).toHaveBeenCalledWith(simpleKid, 0);
    callback.calls.reset();
    var mappedChildren = ReactChildren.map(instance.props.children, callback);
    expect(callback).toHaveBeenCalledWith(simpleKid, 0);
    expect(mappedChildren[0]).toEqual(<span key=".$simple" />);
  });

  it('should treat single arrayless child as being in array', () => {
    var callback = jasmine.createSpy().and.callFake(function(kid, index) {
      return kid;
    });

    var simpleKid = <span />;
    var instance = <div>{simpleKid}</div>;
    ReactChildren.forEach(instance.props.children, callback);
    expect(callback).toHaveBeenCalledWith(simpleKid, 0);
    callback.calls.reset();
    var mappedChildren = ReactChildren.map(instance.props.children, callback);
    expect(callback).toHaveBeenCalledWith(simpleKid, 0);
    expect(mappedChildren[0]).toEqual(<span key=".0" />);
  });

  it('should treat single child in array as expected', () => {
    var callback = jasmine.createSpy().and.callFake(function(kid, index) {
      return kid;
    });

    var simpleKid = <span key="simple" />;
    var instance = <div>{[simpleKid]}</div>;
    ReactChildren.forEach(instance.props.children, callback);
    expect(callback).toHaveBeenCalledWith(simpleKid, 0);
    callback.calls.reset();
    var mappedChildren = ReactChildren.map(instance.props.children, callback);
    expect(callback).toHaveBeenCalledWith(simpleKid, 0);
    expect(mappedChildren[0]).toEqual(<span key=".$simple" />);

  });

  it('should pass key to returned component', () => {
    var mapFn = function(kid, index) {
      return <div>{kid}</div>;
    };

    var simpleKid = <span key="simple" />;

    var instance = <div>{simpleKid}</div>;
    var mappedChildren = ReactChildren.map(instance.props.children, mapFn);

    expect(ReactChildren.count(mappedChildren)).toBe(1);
    expect(mappedChildren[0]).not.toBe(simpleKid);
    expect(mappedChildren[0].props.children).toBe(simpleKid);
    expect(mappedChildren[0].key).toBe('.$simple');
  });

  it('should invoke callback with the right context', () => {
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
    expect(mappedChildren[0]).toBe(scopeTester);
  });

  it('should be called for each child', () => {
    var zero = <div key="keyZero" />;
    var one = null;
    var two = <div key="keyTwo" />;
    var three = null;
    var four = <div key="keyFour" />;

    var mapped = [
      <div key="giraffe" />,  // Key should be joined to obj key
      null,  // Key should be added even if we don't supply it!
      <div />,  // Key should be added even if not supplied!
      <span />, // Map from null to something.
      <div key="keyFour" />,
    ];
    var callback = jasmine.createSpy().and.callFake(function(kid, index) {
      return mapped[index];
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
    callback.calls.reset();

    var mappedChildren =
      ReactChildren.map(instance.props.children, callback);
    expect(callback.calls.count()).toBe(5);
    expect(ReactChildren.count(mappedChildren)).toBe(4);
    // Keys default to indices.
    expect([
      mappedChildren[0].key,
      mappedChildren[1].key,
      mappedChildren[2].key,
      mappedChildren[3].key,
    ]).toEqual(
      ['giraffe/.$keyZero', '.$keyTwo', '.3', '.$keyFour']
    );

    expect(callback).toHaveBeenCalledWith(zero, 0);
    expect(callback).toHaveBeenCalledWith(one, 1);
    expect(callback).toHaveBeenCalledWith(two, 2);
    expect(callback).toHaveBeenCalledWith(three, 3);
    expect(callback).toHaveBeenCalledWith(four, 4);

    expect(mappedChildren[0]).toEqual(<div key="giraffe/.$keyZero" />);
    expect(mappedChildren[1]).toEqual(<div key=".$keyTwo" />);
    expect(mappedChildren[2]).toEqual(<span key=".3" />);
    expect(mappedChildren[3]).toEqual(<div key=".$keyFour" />);
  });

  it('should be called for each child in nested structure', () => {
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
    var twoMapped = <div />;  // Key should be added even if not supplied!
    var fourMapped = <div key="keyFour" />;
    var fiveMapped = <div />;

    var callback = jasmine.createSpy().and.callFake(function(kid, index) {
      return index === 0 ? zeroMapped :
        index === 1 ? twoMapped :
        index === 2 ? fourMapped : fiveMapped;
    });

    var frag = ReactFragment.create({
      firstHalfKey: [zero, one, two],
      secondHalfKey: [three, four],
      keyFive: five,
    });
    var instance = <div>{[frag]}</div>;

    expect([
      frag[0].key,
      frag[1].key,
      frag[2].key,
      frag[3].key,
    ]).toEqual([
      'firstHalfKey/.$keyZero',
      'firstHalfKey/.$keyTwo',
      'secondHalfKey/.$keyFour',
      'keyFive/.$keyFiveInner',
    ]);

    ReactChildren.forEach(instance.props.children, callback);
    expect(callback.calls.count()).toBe(4);
    expect(callback).toHaveBeenCalledWith(frag[0], 0);
    expect(callback).toHaveBeenCalledWith(frag[1], 1);
    expect(callback).toHaveBeenCalledWith(frag[2], 2);
    expect(callback).toHaveBeenCalledWith(frag[3], 3);
    callback.calls.reset();

    var mappedChildren = ReactChildren.map(instance.props.children, callback);
    expect(callback.calls.count()).toBe(4);
    expect(callback).toHaveBeenCalledWith(frag[0], 0);
    expect(callback).toHaveBeenCalledWith(frag[1], 1);
    expect(callback).toHaveBeenCalledWith(frag[2], 2);
    expect(callback).toHaveBeenCalledWith(frag[3], 3);

    expect(ReactChildren.count(mappedChildren)).toBe(4);
    // Keys default to indices.
    expect([
      mappedChildren[0].key,
      mappedChildren[1].key,
      mappedChildren[2].key,
      mappedChildren[3].key,
    ]).toEqual([
      'giraffe/.0:$firstHalfKey/.$keyZero',
      '.0:$firstHalfKey/.$keyTwo',
      'keyFour/.0:$secondHalfKey/.$keyFour',
      '.0:$keyFive/.$keyFiveInner',
    ]);

    expect(mappedChildren[0]).toEqual(<div key="giraffe/.0:$firstHalfKey/.$keyZero" />);
    expect(mappedChildren[1]).toEqual(<div key=".0:$firstHalfKey/.$keyTwo" />);
    expect(mappedChildren[2]).toEqual(<div key="keyFour/.0:$secondHalfKey/.$keyFour" />);
    expect(mappedChildren[3]).toEqual(<div key=".0:$keyFive/.$keyFiveInner" />);
  });

  it('should retain key across two mappings', () => {
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

    var expectedForcedKeys = ['giraffe/.$keyZero', '.$keyOne'];
    var mappedChildrenForcedKeys =
      ReactChildren.map(forcedKeys.props.children, mapFn);
    var mappedForcedKeys = mappedChildrenForcedKeys.map((c) => c.key);
    expect(mappedForcedKeys).toEqual(expectedForcedKeys);

    var expectedRemappedForcedKeys = [
      'giraffe/.$giraffe/.$keyZero',
      '.$.$keyOne',
    ];
    var remappedChildrenForcedKeys =
      ReactChildren.map(mappedChildrenForcedKeys, mapFn);
    expect(
      remappedChildrenForcedKeys.map((c) => c.key)
    ).toEqual(expectedRemappedForcedKeys);

  });

  it('should not throw if key provided is a dupe with array key', () => {
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

  it('should use the same key for a cloned element', () => {
    var instance = (
      <div>
        <div />
      </div>
    );

    var mapped = ReactChildren.map(
      instance.props.children,
      element => element,
    );

    var mappedWithClone = ReactChildren.map(
      instance.props.children,
      element => React.cloneElement(element),
    );

    expect(mapped[0].key).toBe(mappedWithClone[0].key);
  });

  it('should use the same key for a cloned element with key', () => {
    var instance = (
      <div>
        <div key="unique" />
      </div>
    );

    var mapped = ReactChildren.map(
      instance.props.children,
      element => element,
    );

    var mappedWithClone = ReactChildren.map(
      instance.props.children,
      element => React.cloneElement(element, {key: 'unique'}),
    );

    expect(mapped[0].key).toBe(mappedWithClone[0].key);
  });

  it('should return 0 for null children', () => {
    var numberOfChildren = ReactChildren.count(null);
    expect(numberOfChildren).toBe(0);
  });

  it('should return 0 for undefined children', () => {
    var numberOfChildren = ReactChildren.count(undefined);
    expect(numberOfChildren).toBe(0);
  });

  it('should return 1 for single child', () => {
    var simpleKid = <span key="simple" />;
    var instance = <div>{simpleKid}</div>;
    var numberOfChildren = ReactChildren.count(instance.props.children);
    expect(numberOfChildren).toBe(1);
  });

  it('should count the number of children in flat structure', () => {
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

  it('should count the number of children in nested structure', () => {
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
      <div>{[
        ReactFragment.create({
          firstHalfKey: [zero, one, two],
          secondHalfKey: [three, four],
          keyFive: five,
        }),
        null,
      ]}</div>
    );
    var numberOfChildren = ReactChildren.count(instance.props.children);
    expect(numberOfChildren).toBe(5);
  });

  it('should flatten children to an array', () => {
    expect(ReactChildren.toArray(undefined)).toEqual([]);
    expect(ReactChildren.toArray(null)).toEqual([]);

    expect(ReactChildren.toArray(<div />).length).toBe(1);
    expect(ReactChildren.toArray([<div />]).length).toBe(1);
    expect(
      ReactChildren.toArray(<div />)[0].key
    ).toBe(
      ReactChildren.toArray([<div />])[0].key
    );

    var flattened = ReactChildren.toArray([
      [<div key="apple" />, <div key="banana" />, <div key="camel" />],
      [<div key="banana" />, <div key="camel" />, <div key="deli" />],
    ]);
    expect(flattened.length).toBe(6);
    expect(flattened[1].key).toContain('banana');
    expect(flattened[3].key).toContain('banana');
    expect(flattened[1].key).not.toBe(flattened[3].key);

    var reversed = ReactChildren.toArray([
      [<div key="camel" />, <div key="banana" />, <div key="apple" />],
      [<div key="deli" />, <div key="camel" />, <div key="banana" />],
    ]);
    expect(flattened[0].key).toBe(reversed[2].key);
    expect(flattened[1].key).toBe(reversed[1].key);
    expect(flattened[2].key).toBe(reversed[0].key);
    expect(flattened[3].key).toBe(reversed[5].key);
    expect(flattened[4].key).toBe(reversed[4].key);
    expect(flattened[5].key).toBe(reversed[3].key);

    // null/undefined/bool are all omitted
    expect(ReactChildren.toArray([1, 'two', null, undefined, true])).toEqual(
      [1, 'two']
    );
  });

});
