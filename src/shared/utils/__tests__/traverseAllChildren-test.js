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

describe('traverseAllChildren', () => {
  var traverseAllChildren;
  var React;
  var ReactFragment;
  var ReactTestUtils;

  beforeEach(() => {
    jest.resetModuleRegistry();
    traverseAllChildren = require('traverseAllChildren');
    React = require('React');
    ReactFragment = require('ReactFragment');
    ReactTestUtils = require('ReactTestUtils');
  });

  function frag(obj) {
    return ReactFragment.create(obj);
  }

  it('should support identity for simple', () => {
    var traverseContext = [];
    var traverseFn = jasmine
      .createSpy()
      .and.callFake(function(context, kid, key, index) {
        context.push(true);
      });

    var simpleKid = <span key="simple" />;

    // Jasmine doesn't provide a way to test that the fn was invoked with scope.
    var instance = <div>{simpleKid}</div>;
    traverseAllChildren(instance.props.children, traverseFn, traverseContext);
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      simpleKid,
      '.$simple',
    );
    expect(traverseContext.length).toEqual(1);
  });

  it('should treat single arrayless child as being in array', () => {
    var traverseContext = [];
    var traverseFn = jasmine
      .createSpy()
      .and.callFake(function(context, kid, key, index) {
        context.push(true);
      });

    var simpleKid = <span />;
    var instance = <div>{simpleKid}</div>;
    traverseAllChildren(instance.props.children, traverseFn, traverseContext);
    expect(traverseFn).toHaveBeenCalledWith(traverseContext, simpleKid, '.0');
    expect(traverseContext.length).toEqual(1);
  });

  it('should treat single child in array as expected', () => {
    spyOn(console, 'error');
    var traverseContext = [];
    var traverseFn = jasmine
      .createSpy()
      .and.callFake(function(context, kid, key, index) {
        context.push(true);
      });

    var simpleKid = <span />;
    var instance = <div>{[simpleKid]}</div>;
    traverseAllChildren(instance.props.children, traverseFn, traverseContext);
    expect(traverseFn).toHaveBeenCalledWith(traverseContext, simpleKid, '.0');
    expect(traverseContext.length).toEqual(1);
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'Warning: Each child in an array or iterator should have a unique "key" prop.',
    );
  });

  it('should be called for each child', () => {
    var zero = <div key="keyZero" />;
    var one = null;
    var two = <div key="keyTwo" />;
    var three = null;
    var four = <div key="keyFour" />;

    var traverseContext = [];
    var traverseFn = jasmine
      .createSpy()
      .and.callFake(function(context, kid, key, index) {
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
    expect(traverseFn).toHaveBeenCalledWith(traverseContext, zero, '.$keyZero');
    expect(traverseFn).toHaveBeenCalledWith(traverseContext, one, '.1');
    expect(traverseFn).toHaveBeenCalledWith(traverseContext, two, '.$keyTwo');
    expect(traverseFn).toHaveBeenCalledWith(traverseContext, three, '.3');
    expect(traverseFn).toHaveBeenCalledWith(traverseContext, four, '.$keyFour');
  });

  it('should traverse children of different kinds', () => {
    var div = <div key="divNode" />;
    var span = <span key="spanNode" />;
    var a = <a key="aNode" />;

    var traverseContext = [];
    var traverseFn = jasmine
      .createSpy()
      .and.callFake(function(context, kid, key, index) {
        context.push(true);
      });

    var instance = (
      <div>
        {div}
        {[frag({span})]}
        {frag({a: a})}
        {'string'}
        {1234}
        {true}
        {false}
        {null}
        {undefined}
      </div>
    );

    traverseAllChildren(instance.props.children, traverseFn, traverseContext);

    expect(traverseFn.calls.count()).toBe(9);
    expect(traverseContext.length).toEqual(9);

    expect(traverseFn).toHaveBeenCalledWith(traverseContext, div, '.$divNode');
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      <span key="span/.$spanNode" />,
      '.1:0:$span/.$spanNode',
    );
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      <a key="a/.$aNode" />,
      '.2:$a/.$aNode',
    );
    expect(traverseFn).toHaveBeenCalledWith(traverseContext, 'string', '.3');
    expect(traverseFn).toHaveBeenCalledWith(traverseContext, 1234, '.4');
    expect(traverseFn).toHaveBeenCalledWith(traverseContext, null, '.5');
    expect(traverseFn).toHaveBeenCalledWith(traverseContext, null, '.6');
    expect(traverseFn).toHaveBeenCalledWith(traverseContext, null, '.7');
    expect(traverseFn).toHaveBeenCalledWith(traverseContext, null, '.8');
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

    var traverseContext = [];
    var traverseFn = jasmine
      .createSpy()
      .and.callFake(function(context, kid, key, index) {
        context.push(true);
      });

    var instance = (
      <div>
        {[
          frag({
            firstHalfKey: [zero, one, two],
            secondHalfKey: [three, four],
            keyFive: five,
          }),
        ]}
      </div>
    );

    traverseAllChildren(instance.props.children, traverseFn, traverseContext);
    expect(traverseFn.calls.count()).toBe(4);
    expect(traverseContext.length).toEqual(4);
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      <div key="firstHalfKey/.$keyZero" />,
      '.0:$firstHalfKey/.$keyZero',
    );

    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      <div key="firstHalfKey/.$keyTwo" />,
      '.0:$firstHalfKey/.$keyTwo',
    );

    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      <div key="secondHalfKey/.$keyFour" />,
      '.0:$secondHalfKey/.$keyFour',
    );

    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      <div key="keyFive/.$keyFiveInner" />,
      '.0:$keyFive/.$keyFiveInner',
    );
  });

  it('should retain key across two mappings', () => {
    var zeroForceKey = <div key="keyZero" />;
    var oneForceKey = <div key="keyOne" />;
    var traverseContext = [];
    var traverseFn = jasmine
      .createSpy()
      .and.callFake(function(context, kid, key, index) {
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
      '.$keyZero',
    );
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      oneForceKey,
      '.$keyOne',
    );
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

    var traverseContext = [];
    var traverseFn = jasmine
      .createSpy()
      .and.callFake(function(context, kid, key, index) {
        context.push(kid);
      });

    var instance = (
      <div>
        {threeDivIterable}
      </div>
    );

    traverseAllChildren(instance.props.children, traverseFn, traverseContext);
    expect(traverseFn.calls.count()).toBe(3);

    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      traverseContext[0],
      '.0',
    );
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      traverseContext[1],
      '.1',
    );
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      traverseContext[2],
      '.2',
    );

    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'Warning: Each child in an array or iterator should have a unique "key" prop.',
    );
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

    var traverseContext = [];
    var traverseFn = jasmine
      .createSpy()
      .and.callFake(function(context, kid, key, index) {
        context.push(kid);
      });

    var instance = (
      <div>
        {threeDivIterable}
      </div>
    );

    traverseAllChildren(instance.props.children, traverseFn, traverseContext);
    expect(traverseFn.calls.count()).toBe(3);

    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      traverseContext[0],
      '.$#1',
    );
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      traverseContext[1],
      '.$#2',
    );
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      traverseContext[2],
      '.$#3',
    );
  });

  it('should use keys from entry iterables', () => {
    spyOn(console, 'error');

    var threeDivEntryIterable = {
      '@@iterator': function() {
        var i = 0;
        return {
          next: function() {
            if (i++ < 3) {
              return {value: ['#' + i, <div />], done: false};
            } else {
              return {value: undefined, done: true};
            }
          },
        };
      },
    };
    threeDivEntryIterable.entries = threeDivEntryIterable['@@iterator'];

    var traverseContext = [];
    var traverseFn = jasmine
      .createSpy()
      .and.callFake(function(context, kid, key, index) {
        context.push(kid);
      });

    var instance = (
      <div>
        {threeDivEntryIterable}
      </div>
    );

    traverseAllChildren(instance.props.children, traverseFn, traverseContext);
    expect(traverseFn.calls.count()).toBe(3);

    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      traverseContext[0],
      '.$#1:0',
    );
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      traverseContext[1],
      '.$#2:0',
    );
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      traverseContext[2],
      '.$#3:0',
    );

    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'Warning: Using Maps as children is not yet fully supported. It is an ' +
        'experimental feature that might be removed. Convert it to a sequence ' +
        '/ iterable of keyed ReactElements instead.',
    );
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

      var traverseFn = jasmine.createSpy();

      traverseAllChildren(instance.props.children, traverseFn, null);
      expect(traverseFn.calls.count()).toBe(3);

      expect(traverseFn).toHaveBeenCalledWith(null, 5, '.0');
      expect(traverseFn).toHaveBeenCalledWith(null, 12, '.1');
      expect(traverseFn).toHaveBeenCalledWith(null, 13, '.2');
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

    var traverseFn = jasmine.createSpy();

    traverseAllChildren(instance.props.children, traverseFn, null);
    expect(traverseFn.calls.count()).toBe(2);

    expect(traverseFn).toHaveBeenCalledWith(null, 'a', '.0');
    expect(traverseFn).toHaveBeenCalledWith(null, 13, '.1');

    delete String.prototype.key;
    delete Number.prototype.key;
  });

  it('should throw on object', () => {
    expect(function() {
      traverseAllChildren({a: 1, b: 2}, function() {}, null);
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
      traverseAllChildren(/abc/, function() {}, null);
    }).toThrowError(
      'Objects are not valid as a React child (found: /abc/). If you meant ' +
        'to render a collection of children, use an array instead or wrap the ' +
        'object using createFragment(object) from the React add-ons.',
    );
  });

  it('should warn for using maps as children with owner info', () => {
    spyOn(console, 'error');

    class Parent extends React.Component {
      render() {
        return <div>{new Map([['foo', 0], ['bar', 1]])}</div>;
      }
    }

    ReactTestUtils.renderIntoDocument(<Parent />);

    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toBe(
      'Warning: Using Maps as children is not yet fully supported. It is an ' +
        'experimental feature that might be removed. Convert it to a sequence ' +
        '/ iterable of keyed ReactElements instead. Check the render method of `Parent`.',
    );
  });
});
