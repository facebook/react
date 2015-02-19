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

describe('traverseAllChildren', function() {
  var traverseAllChildren;
  var React;
  var ReactFragment;
  beforeEach(function() {
    traverseAllChildren = require('traverseAllChildren');
    React = require('React');
    ReactFragment = require('ReactFragment');
  });

  function frag(obj) {
    return ReactFragment.create(obj);
  }

  it('should support identity for simple', function() {
    var traverseContext = [];
    var traverseFn =
      jasmine.createSpy().andCallFake(function(context, kid, key, index) {
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
      0
    );
    expect(traverseContext.length).toEqual(1);
  });

  it('should treat single arrayless child as being in array', function() {
    var traverseContext = [];
    var traverseFn =
      jasmine.createSpy().andCallFake(function(context, kid, key, index) {
        context.push(true);
      });

    var simpleKid = <span />;
    var instance = <div>{simpleKid}</div>;
    traverseAllChildren(instance.props.children, traverseFn, traverseContext);
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      simpleKid,
      '.0',
      0
    );
    expect(traverseContext.length).toEqual(1);
  });

  it('should treat single child in array as expected', function() {
    var traverseContext = [];
    var traverseFn =
      jasmine.createSpy().andCallFake(function(context, kid, key, index) {
        context.push(true);
      });

    var simpleKid = <span />;
    var instance = <div>{[simpleKid]}</div>;
    traverseAllChildren(instance.props.children, traverseFn, traverseContext);
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      simpleKid,
      '.0',
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
      jasmine.createSpy().andCallFake(function(context, kid, key, index) {
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
      '.$keyZero',
      0
    );
    expect(traverseFn).toHaveBeenCalledWith(traverseContext, one, '.1', 1);
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      two,
      '.$keyTwo',
      2
    );
    expect(traverseFn).toHaveBeenCalledWith(traverseContext, three, '.3', 3);
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      four,
      '.$keyFour',
      4
    );
  });

  it('should traverse children of different kinds', function() {
    var div = <div key="divNode" />;
    var span = <span key="spanNode" />;
    var a = <a key="aNode" />;

    var traverseContext = [];
    var traverseFn =
      jasmine.createSpy().andCallFake(function(context, kid, key, index) {
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

    expect(traverseFn.calls.length).toBe(9);
    expect(traverseContext.length).toEqual(9);

    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext, div, '.$divNode', 0
    );
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext, span, '.1:0:$span:$spanNode', 1
    );
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext, a, '.2:$a:$aNode', 2
    );
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext, 'string', '.3', 3
    );
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext, 1234, '.4', 4
    );
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext, null, '.5', 5
    );
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext, null, '.6', 6
    );
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext, null, '.7', 7
    );
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext, null, '.8', 8
    );
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


    var traverseContext = [];
    var traverseFn =
      jasmine.createSpy().andCallFake(function(context, kid, key, index) {
        context.push(true);
      });

    var instance = (
      <div>{
        [frag({
          firstHalfKey: [zero, one, two],
          secondHalfKey: [three, four],
          keyFive: five
        })]
      }</div>
    );

    traverseAllChildren(instance.props.children, traverseFn, traverseContext);
    expect(traverseFn.calls.length).toBe(6);
    expect(traverseContext.length).toEqual(6);
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      zero,
      '.0:$firstHalfKey:0:$keyZero',
      0
    );

    expect(traverseFn)
      .toHaveBeenCalledWith(traverseContext, one, '.0:$firstHalfKey:0:1', 1);

    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      two,
      '.0:$firstHalfKey:0:$keyTwo',
      2
    );

    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      three,
      '.0:$secondHalfKey:0:0',
      3
    );

    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      four,
      '.0:$secondHalfKey:0:$keyFour',
      4
    );

    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      five,
      '.0:$keyFive:$keyFiveInner',
      5
    );
  });

  it('should retain key across two mappings', function() {
    var zeroForceKey = <div key="keyZero" />;
    var oneForceKey = <div key="keyOne" />;
    var traverseContext = [];
    var traverseFn =
      jasmine.createSpy().andCallFake(function(context, kid, key, index) {
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
      0
    );
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      oneForceKey,
      '.$keyOne',
      1
    );
  });

  it('should be called for each child in an iterable without keys', function() {
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
          }
        };
      }
    };

    var traverseContext = [];
    var traverseFn =
      jasmine.createSpy().andCallFake(function(context, kid, key, index) {
        context.push(kid);
      });

    var instance = (
      <div>
        {threeDivIterable}
      </div>
    );

    traverseAllChildren(instance.props.children, traverseFn, traverseContext);
    expect(traverseFn.calls.length).toBe(3);

    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      traverseContext[0],
      '.0',
      0
    );
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      traverseContext[1],
      '.1',
      1
    );
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      traverseContext[2],
      '.2',
      2
    );
  });

  it('should be called for each child in an iterable with keys', function() {
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
          }
        };
      }
    };

    var traverseContext = [];
    var traverseFn =
      jasmine.createSpy().andCallFake(function(context, kid, key, index) {
        context.push(kid);
      });

    var instance = (
      <div>
        {threeDivIterable}
      </div>
    );

    traverseAllChildren(instance.props.children, traverseFn, traverseContext);
    expect(traverseFn.calls.length).toBe(3);

    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      traverseContext[0],
      '.$#1',
      0
    );
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      traverseContext[1],
      '.$#2',
      1
    );
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      traverseContext[2],
      '.$#3',
      2
    );
  });

  it('should use keys from entry iterables', function() {
    spyOn(console, 'warn');

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
          }
        };
      }
    };
    threeDivEntryIterable.entries = threeDivEntryIterable['@@iterator'];

    var traverseContext = [];
    var traverseFn =
      jasmine.createSpy().andCallFake(function(context, kid, key, index) {
        context.push(kid);
      });

    var instance = (
      <div>
        {threeDivEntryIterable}
      </div>
    );

    traverseAllChildren(instance.props.children, traverseFn, traverseContext);
    expect(traverseFn.calls.length).toBe(3);

    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      traverseContext[0],
      '.$#1:0',
      0
    );
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      traverseContext[1],
      '.$#2:0',
      1
    );
    expect(traverseFn).toHaveBeenCalledWith(
      traverseContext,
      traverseContext[2],
      '.$#3:0',
      2
    );

    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toContain(
      'Warning: Using Maps as children is not yet fully supported. It is an ' +
      'experimental feature that might be removed. Convert it to a sequence ' +
      '/ iterable of keyed ReactElements instead.'
    );
  });

});
