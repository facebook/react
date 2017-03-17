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
  var React;
  var ReactFragment;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactFragment = require('ReactFragment');
  });

  it('should support identity for simple', () => {
    var context = {};
    var callback = jasmine.createSpy().and.callFake(function(kid, index) {
      expect(this).toBe(context);
      return kid;
    });

    var simpleKid = <span key="simple" />;

    // First pass children into a component to fully simulate what happens when
    // using structures that arrive from transforms.

    var instance = <div>{simpleKid}</div>;
    React.Children.forEach(instance.props.children, callback, context);
    expect(callback).toHaveBeenCalledWith(simpleKid, 0);
    callback.calls.reset();
    var mappedChildren = React.Children.map(
      instance.props.children,
      callback,
      context,
    );
    expect(callback).toHaveBeenCalledWith(simpleKid, 0);
    expect(mappedChildren[0]).toEqual(<span key=".$simple" />);
  });

  it('should treat single arrayless child as being in array', () => {
    var context = {};
    var callback = jasmine.createSpy().and.callFake(function(kid, index) {
      expect(this).toBe(context);
      return kid;
    });

    var simpleKid = <span />;
    var instance = <div>{simpleKid}</div>;
    React.Children.forEach(instance.props.children, callback, context);
    expect(callback).toHaveBeenCalledWith(simpleKid, 0);
    callback.calls.reset();
    var mappedChildren = React.Children.map(
      instance.props.children,
      callback,
      context,
    );
    expect(callback).toHaveBeenCalledWith(simpleKid, 0);
    expect(mappedChildren[0]).toEqual(<span key=".0" />);
  });

  it('should treat single child in array as expected', () => {
    var context = {};
    var callback = jasmine.createSpy().and.callFake(function(kid, index) {
      expect(this).toBe(context);
      return kid;
    });

    var simpleKid = <span key="simple" />;
    var instance = <div>{[simpleKid]}</div>;
    React.Children.forEach(instance.props.children, callback, context);
    expect(callback).toHaveBeenCalledWith(simpleKid, 0);
    callback.calls.reset();
    var mappedChildren = React.Children.map(
      instance.props.children,
      callback,
      context,
    );
    expect(callback).toHaveBeenCalledWith(simpleKid, 0);
    expect(mappedChildren[0]).toEqual(<span key=".$simple" />);
  });

  it('should be called for each child', () => {
    var zero = <div key="keyZero" />;
    var one = null;
    var two = <div key="keyTwo" />;
    var three = null;
    var four = <div key="keyFour" />;
    var context = {};

    var callback = jasmine.createSpy().and.callFake(function(kid) {
      expect(this).toBe(context);
      return kid;
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

    function assertCalls() {
      expect(callback).toHaveBeenCalledWith(zero, 0);
      expect(callback).toHaveBeenCalledWith(one, 1);
      expect(callback).toHaveBeenCalledWith(two, 2);
      expect(callback).toHaveBeenCalledWith(three, 3);
      expect(callback).toHaveBeenCalledWith(four, 4);
      callback.calls.reset();
    }

    React.Children.forEach(instance.props.children, callback, context);
    assertCalls();

    var mappedChildren = React.Children.map(
      instance.props.children,
      callback,
      context,
    );
    assertCalls();
    expect(mappedChildren).toEqual([
      <div key=".$keyZero" />,
      <div key=".$keyTwo" />,
      <div key=".$keyFour" />,
    ]);
  });

  it('should traverse children of different kinds', () => {
    var div = <div key="divNode" />;
    var span = <span key="spanNode" />;
    var a = <a key="aNode" />;

    var context = {};
    var callback = jasmine.createSpy().and.callFake(function(kid) {
      expect(this).toBe(context);
      return kid;
    });

    var instance = (
      <div>
        {div}
        {[ReactFragment.create({span})]}
        {ReactFragment.create({a: a})}
        {'string'}
        {1234}
        {true}
        {false}
        {null}
        {undefined}
      </div>
    );

    function assertCalls() {
      expect(callback.calls.count()).toBe(9);
      expect(callback).toHaveBeenCalledWith(div, 0);
      expect(callback).toHaveBeenCalledWith(<span key="span/.$spanNode" />, 1);
      expect(callback).toHaveBeenCalledWith(<a key="a/.$aNode" />, 2);
      expect(callback).toHaveBeenCalledWith('string', 3);
      expect(callback).toHaveBeenCalledWith(1234, 4);
      expect(callback).toHaveBeenCalledWith(null, 5);
      expect(callback).toHaveBeenCalledWith(null, 6);
      expect(callback).toHaveBeenCalledWith(null, 7);
      expect(callback).toHaveBeenCalledWith(null, 8);
      callback.calls.reset();
    }

    React.Children.forEach(instance.props.children, callback, context);
    assertCalls();

    var mappedChildren = React.Children.map(
      instance.props.children,
      callback,
      context,
    );
    assertCalls();
    expect(mappedChildren).toEqual([
      <div key=".$divNode" />,
      <span key=".1:0:$span/.$spanNode" />,
      <a key=".2:$a/.$aNode" />,
      'string',
      1234,
    ]);
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

    var context = {};
    var callback = jasmine.createSpy().and.callFake(function(kid) {
      return kid;
    });

    var instance = (
      <div>
        {[
          ReactFragment.create({
            firstHalfKey: [zero, one, two],
            secondHalfKey: [three, four],
            keyFive: five,
          }),
        ]}
      </div>
    );

    function assertCalls() {
      expect(callback.calls.count()).toBe(4);
      expect(callback).toHaveBeenCalledWith(
        <div key="firstHalfKey/.$keyZero" />,
        0,
      );
      expect(callback).toHaveBeenCalledWith(
        <div key="firstHalfKey/.$keyTwo" />,
        1,
      );
      expect(callback).toHaveBeenCalledWith(
        <div key="secondHalfKey/.$keyFour" />,
        2,
      );
      expect(callback).toHaveBeenCalledWith(
        <div key="keyFive/.$keyFiveInner" />,
        3,
      );
      callback.calls.reset();
    }

    React.Children.forEach(instance.props.children, callback, context);
    assertCalls();

    var mappedChildren = React.Children.map(
      instance.props.children,
      callback,
      context,
    );
    assertCalls();
    expect(mappedChildren).toEqual([
      <div key=".0:$firstHalfKey/.$keyZero" />,
      <div key=".0:$firstHalfKey/.$keyTwo" />,
      <div key=".0:$secondHalfKey/.$keyFour" />,
      <div key=".0:$keyFive/.$keyFiveInner" />,
    ]);
  });

  it('should retain key across two mappings', () => {
    var zeroForceKey = <div key="keyZero" />;
    var oneForceKey = <div key="keyOne" />;
    var context = {};
    var callback = jasmine.createSpy().and.callFake(function(kid) {
      expect(this).toBe(context);
      return kid;
    });

    var forcedKeys = (
      <div>
        {zeroForceKey}
        {oneForceKey}
      </div>
    );

    function assertCalls() {
      expect(callback).toHaveBeenCalledWith(zeroForceKey, 0);
      expect(callback).toHaveBeenCalledWith(oneForceKey, 1);
      callback.calls.reset();
    }

    React.Children.forEach(forcedKeys.props.children, callback, context);
    assertCalls();

    var mappedChildren = React.Children.map(
      forcedKeys.props.children,
      callback,
      context,
    );
    assertCalls();
    expect(mappedChildren).toEqual([
      <div key=".$keyZero" />,
      <div key=".$keyOne" />,
    ]);
  });

  it('should be called for each child in an iterable without keys', () => {
    spyOn(console, 'error');
    var threeDivIterable = {
      '@@iterator': function() {
        var i = 0;
        return {
          next: function() {
            if (i++ < 3) {
              return {value: <div />, done: false};
            } else {
              return {value: undefined, done: true};
            }
          },
        };
      },
    };

    var context = {};
    var callback = jasmine.createSpy().and.callFake(function(kid) {
      expect(this).toBe(context);
      return kid;
    });

    var instance = (
      <div>
        {threeDivIterable}
      </div>
    );

    function assertCalls() {
      expect(callback.calls.count()).toBe(3);
      expect(callback).toHaveBeenCalledWith(<div />, 0);
      expect(callback).toHaveBeenCalledWith(<div />, 1);
      expect(callback).toHaveBeenCalledWith(<div />, 2);
      callback.calls.reset();
    }

    React.Children.forEach(instance.props.children, callback, context);
    assertCalls();
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'Warning: Each child in an array or iterator should have a unique "key" prop.',
    );
    console.error.calls.reset();

    var mappedChildren = React.Children.map(
      instance.props.children,
      callback,
      context,
    );
    assertCalls();
    expectDev(console.error.calls.count()).toBe(0);
    expect(mappedChildren).toEqual([
      <div key=".0" />,
      <div key=".1" />,
      <div key=".2" />,
    ]);
  });

  it('should be called for each child in an iterable with keys', () => {
    var threeDivIterable = {
      '@@iterator': function() {
        var i = 0;
        return {
          next: function() {
            if (i++ < 3) {
              return {value: <div key={'#' + i} />, done: false};
            } else {
              return {value: undefined, done: true};
            }
          },
        };
      },
    };

    var context = {};
    var callback = jasmine.createSpy().and.callFake(function(kid) {
      expect(this).toBe(context);
      return kid;
    });

    var instance = (
      <div>
        {threeDivIterable}
      </div>
    );

    function assertCalls() {
      expect(callback.calls.count()).toBe(3);
      expect(callback).toHaveBeenCalledWith(<div key="#1" />, 0);
      expect(callback).toHaveBeenCalledWith(<div key="#2" />, 1);
      expect(callback).toHaveBeenCalledWith(<div key="#3" />, 2);
      callback.calls.reset();
    }

    React.Children.forEach(instance.props.children, callback, context);
    assertCalls();

    var mappedChildren = React.Children.map(
      instance.props.children,
      callback,
      context,
    );
    assertCalls();
    expect(mappedChildren).toEqual([
      <div key=".$#1" />,
      <div key=".$#2" />,
      <div key=".$#3" />,
    ]);
  });

  it('should not enumerate enumerable numbers (#4776)', () => {
    /*eslint-disable no-extend-native */
    Number.prototype['@@iterator'] = function() {
      throw new Error('number iterator called');
    };
    /*eslint-enable no-extend-native */

    try {
      var instance = (
        <div>
          {5}
          {12}
          {13}
        </div>
      );

      var context = {};
      var callback = jasmine.createSpy().and.callFake(function(kid) {
        expect(this).toBe(context);
        return kid;
      });

      var assertCalls = function() {
        expect(callback.calls.count()).toBe(3);
        expect(callback).toHaveBeenCalledWith(5, 0);
        expect(callback).toHaveBeenCalledWith(12, 1);
        expect(callback).toHaveBeenCalledWith(13, 2);
        callback.calls.reset();
      };

      React.Children.forEach(instance.props.children, callback, context);
      assertCalls();

      var mappedChildren = React.Children.map(
        instance.props.children,
        callback,
        context,
      );
      assertCalls();
      expect(mappedChildren).toEqual([5, 12, 13]);
    } finally {
      delete Number.prototype['@@iterator'];
    }
  });

  it('should allow extension of native prototypes', () => {
    /*eslint-disable no-extend-native */
    String.prototype.key = 'react';
    Number.prototype.key = 'rocks';
    /*eslint-enable no-extend-native */

    var instance = (
      <div>
        {'a'}
        {13}
      </div>
    );

    var context = {};
    var callback = jasmine.createSpy().and.callFake(function(kid) {
      expect(this).toBe(context);
      return kid;
    });

    function assertCalls() {
      expect(callback.calls.count()).toBe(2, 0);
      expect(callback).toHaveBeenCalledWith('a', 0);
      expect(callback).toHaveBeenCalledWith(13, 1);
      callback.calls.reset();
    }

    React.Children.forEach(instance.props.children, callback, context);
    assertCalls();

    var mappedChildren = React.Children.map(
      instance.props.children,
      callback,
      context,
    );
    assertCalls();
    expect(mappedChildren).toEqual(['a', 13]);

    delete String.prototype.key;
    delete Number.prototype.key;
  });

  it('should pass key to returned component', () => {
    var mapFn = function(kid, index) {
      return <div>{kid}</div>;
    };

    var simpleKid = <span key="simple" />;

    var instance = <div>{simpleKid}</div>;
    var mappedChildren = React.Children.map(instance.props.children, mapFn);

    expect(React.Children.count(mappedChildren)).toBe(1);
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
    React.Children.forEach(instance.props.children, callback, scopeTester);
    expect(lastContext).toBe(scopeTester);

    var mappedChildren = React.Children.map(
      instance.props.children,
      callback,
      scopeTester,
    );

    expect(React.Children.count(mappedChildren)).toBe(1);
    expect(mappedChildren[0]).toBe(scopeTester);
  });

  it('should be called for each child', () => {
    var zero = <div key="keyZero" />;
    var one = null;
    var two = <div key="keyTwo" />;
    var three = null;
    var four = <div key="keyFour" />;

    var mapped = [
      <div key="giraffe" />, // Key should be joined to obj key
      null, // Key should be added even if we don't supply it!
      <div />, // Key should be added even if not supplied!
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

    React.Children.forEach(instance.props.children, callback);
    expect(callback).toHaveBeenCalledWith(zero, 0);
    expect(callback).toHaveBeenCalledWith(one, 1);
    expect(callback).toHaveBeenCalledWith(two, 2);
    expect(callback).toHaveBeenCalledWith(three, 3);
    expect(callback).toHaveBeenCalledWith(four, 4);
    callback.calls.reset();

    var mappedChildren = React.Children.map(instance.props.children, callback);
    expect(callback.calls.count()).toBe(5);
    expect(React.Children.count(mappedChildren)).toBe(4);
    // Keys default to indices.
    expect([
      mappedChildren[0].key,
      mappedChildren[1].key,
      mappedChildren[2].key,
      mappedChildren[3].key,
    ]).toEqual(['giraffe/.$keyZero', '.$keyTwo', '.3', '.$keyFour']);

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

    var zeroMapped = <div key="giraffe" />; // Key should be overridden
    var twoMapped = <div />; // Key should be added even if not supplied!
    var fourMapped = <div key="keyFour" />;
    var fiveMapped = <div />;

    var callback = jasmine.createSpy().and.callFake(function(kid, index) {
      return index === 0
        ? zeroMapped
        : index === 1 ? twoMapped : index === 2 ? fourMapped : fiveMapped;
    });

    var frag = ReactFragment.create({
      firstHalfKey: [zero, one, two],
      secondHalfKey: [three, four],
      keyFive: five,
    });
    var instance = <div>{[frag]}</div>;

    expect([frag[0].key, frag[1].key, frag[2].key, frag[3].key]).toEqual([
      'firstHalfKey/.$keyZero',
      'firstHalfKey/.$keyTwo',
      'secondHalfKey/.$keyFour',
      'keyFive/.$keyFiveInner',
    ]);

    React.Children.forEach(instance.props.children, callback);
    expect(callback.calls.count()).toBe(4);
    expect(callback).toHaveBeenCalledWith(frag[0], 0);
    expect(callback).toHaveBeenCalledWith(frag[1], 1);
    expect(callback).toHaveBeenCalledWith(frag[2], 2);
    expect(callback).toHaveBeenCalledWith(frag[3], 3);
    callback.calls.reset();

    var mappedChildren = React.Children.map(instance.props.children, callback);
    expect(callback.calls.count()).toBe(4);
    expect(callback).toHaveBeenCalledWith(frag[0], 0);
    expect(callback).toHaveBeenCalledWith(frag[1], 1);
    expect(callback).toHaveBeenCalledWith(frag[2], 2);
    expect(callback).toHaveBeenCalledWith(frag[3], 3);

    expect(React.Children.count(mappedChildren)).toBe(4);
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

    expect(mappedChildren[0]).toEqual(
      <div key="giraffe/.0:$firstHalfKey/.$keyZero" />,
    );
    expect(mappedChildren[1]).toEqual(<div key=".0:$firstHalfKey/.$keyTwo" />);
    expect(mappedChildren[2]).toEqual(
      <div key="keyFour/.0:$secondHalfKey/.$keyFour" />,
    );
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
    var mappedChildrenForcedKeys = React.Children.map(
      forcedKeys.props.children,
      mapFn,
    );
    var mappedForcedKeys = mappedChildrenForcedKeys.map(c => c.key);
    expect(mappedForcedKeys).toEqual(expectedForcedKeys);

    var expectedRemappedForcedKeys = [
      'giraffe/.$giraffe/.$keyZero',
      '.$.$keyOne',
    ];
    var remappedChildrenForcedKeys = React.Children.map(
      mappedChildrenForcedKeys,
      mapFn,
    );
    expect(remappedChildrenForcedKeys.map(c => c.key)).toEqual(
      expectedRemappedForcedKeys,
    );
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
      React.Children.map(instance.props.children, mapFn);
    }).not.toThrow();
  });

  it('should use the same key for a cloned element', () => {
    var instance = (
      <div>
        <div />
      </div>
    );

    var mapped = React.Children.map(
      instance.props.children,
      element => element,
    );

    var mappedWithClone = React.Children.map(instance.props.children, element =>
      React.cloneElement(element));

    expect(mapped[0].key).toBe(mappedWithClone[0].key);
  });

  it('should use the same key for a cloned element with key', () => {
    var instance = (
      <div>
        <div key="unique" />
      </div>
    );

    var mapped = React.Children.map(
      instance.props.children,
      element => element,
    );

    var mappedWithClone = React.Children.map(instance.props.children, element =>
      React.cloneElement(element, {key: 'unique'}));

    expect(mapped[0].key).toBe(mappedWithClone[0].key);
  });

  it('should return 0 for null children', () => {
    var numberOfChildren = React.Children.count(null);
    expect(numberOfChildren).toBe(0);
  });

  it('should return 0 for undefined children', () => {
    var numberOfChildren = React.Children.count(undefined);
    expect(numberOfChildren).toBe(0);
  });

  it('should return 1 for single child', () => {
    var simpleKid = <span key="simple" />;
    var instance = <div>{simpleKid}</div>;
    var numberOfChildren = React.Children.count(instance.props.children);
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
    var numberOfChildren = React.Children.count(instance.props.children);
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
      <div>
        {[
          ReactFragment.create({
            firstHalfKey: [zero, one, two],
            secondHalfKey: [three, four],
            keyFive: five,
          }),
          null,
        ]}
      </div>
    );
    var numberOfChildren = React.Children.count(instance.props.children);
    expect(numberOfChildren).toBe(5);
  });

  it('should flatten children to an array', () => {
    expect(React.Children.toArray(undefined)).toEqual([]);
    expect(React.Children.toArray(null)).toEqual([]);

    expect(React.Children.toArray(<div />).length).toBe(1);
    expect(React.Children.toArray([<div />]).length).toBe(1);
    expect(React.Children.toArray(<div />)[0].key).toBe(
      React.Children.toArray([<div />])[0].key,
    );

    var flattened = React.Children.toArray([
      [<div key="apple" />, <div key="banana" />, <div key="camel" />],
      [<div key="banana" />, <div key="camel" />, <div key="deli" />],
    ]);
    expect(flattened.length).toBe(6);
    expect(flattened[1].key).toContain('banana');
    expect(flattened[3].key).toContain('banana');
    expect(flattened[1].key).not.toBe(flattened[3].key);

    var reversed = React.Children.toArray([
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
    expect(React.Children.toArray([1, 'two', null, undefined, true])).toEqual([
      1,
      'two',
    ]);
  });

  it('should throw on object', () => {
    expect(function() {
      React.Children.forEach({a: 1, b: 2}, function() {}, null);
    }).toThrowError(
      'Objects are not valid as a React child (found: object with keys ' +
        '{a, b}). If you meant to render a collection of children, use an ' +
        'array instead or wrap the object using createFragment(object) from ' +
        'the React add-ons.',
    );
  });

  it('should throw on regex', () => {
    // Really, we care about dates (#4840) but those have nondeterministic
    // serialization (timezones) so let's test a regex instead:
    expect(function() {
      React.Children.forEach(/abc/, function() {}, null);
    }).toThrowError(
      'Objects are not valid as a React child (found: /abc/). If you meant ' +
        'to render a collection of children, use an array instead or wrap the ' +
        'object using createFragment(object) from the React add-ons.',
    );
  });
});
