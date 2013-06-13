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
 * @jsx React.DOM
 * @emails react-core
 */

"use strict";

var React;

var Fake;

var singleChild = function(children) {
  return (<Fake>{children}</Fake>).props.children;
};

var multiChild = function(child1, child2, child3, child4) {
  return (<Fake>{child1} {child2} {child3}{child4}</Fake>).props.children;
};


describe('ReactComponentFlatten', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();
    React = require('React');
    var ReactComponent = require('ReactComponent');
    var copyProperties = require('copyProperties');
    var Constructor = function() {};
    copyProperties(Constructor.prototype, ReactComponent.Mixin);
    Fake = function() {
      var instance = new Constructor();
      instance.construct.apply(instance, arguments);
      return instance;
    };
  });

  it("should reuse a flat array", function() {
    var children = [
      <div key="foo" />,
      <div key="bar" />
    ];

    var flat = singleChild(children);

    expect(flat).toBe(children);
    expect(flat[0]._key).toEqual('0:foo');
    expect(flat[1]._key).toEqual('0:bar');
  });

  it("should collapse a sparse array", function() {
    var children = [
      null,
      <div key="foo" />,
      <div key="bar" />
    ];

    var flat = singleChild(children);

    expect(flat).not.toBe(children);
    expect(flat.length).toEqual(2);
    expect(flat[0]._key).toEqual('0:foo');
    expect(flat[1]._key).toEqual('0:bar');
  });

  it("should collapse a nested array into a flat array", function() {
    var flat = multiChild(
      null,
      <div key="foo" />,
      [<div key="bar" />, null]
    );

    expect(flat.length).toEqual(2);
    expect(flat[0]._key).toEqual('foo');
    expect(flat[1]._key).toEqual('2:bar');
  });

  it("should use retain key index despite static empty values", function() {
    // TODO: Wrap in another single child (currently breaks)

    var before = multiChild(
      <div />,
      <div />,
      [<div key="foo" />],
      [<div key="foo" />]
    );

    var after = multiChild(
      null,
      <div />,
      null,
      [<div key="foo" />]
    );

    expect(before.length).toEqual(4);
    expect(after.length).toEqual(2);
    expect(before[1]._key).toEqual(after[0]._key);
    expect(before[3]._key).toEqual(after[1]._key);
  });

  it("should assign idempotent keys for extra flattening layers", function() {
    var flat = multiChild(
      null,
      [null, <div key="FOO" />],
      false
    );

    var preFlat = multiChild(
      null,
      singleChild([null, <div key="FOO" />]),
      false
    );

    expect(flat.length).toBe(1);
    expect(preFlat.length).toBe(1);
    expect(preFlat[0]._key).toBe(flat[0]._key);
  });

  it("should assign idempotent strings through flattening", function() {
    var children = [
      'FOO',
      'BAR'
    ];
    var flat = singleChild(children);
    var wrappedFlat = multiChild(null, flat);
    expect(flat).toBe(children);
    expect(wrappedFlat.length).toBe(2);
    expect(wrappedFlat[0]).toBe(flat[0]);
    expect(wrappedFlat[1]).toBe(flat[1]);
  });

  it("cannot keep keys unique when children are unboxed", function() {
    // This is a case that difficult to solve and should not actually be solved.
    var children1 = [<div key="foo" />];
    var children2 = [<div key="foo" />];
    var flat1 = singleChild(children1);
    var flat2 = singleChild(children2);
    // There's no way to tell flat1[0] and flat2[0] apart.
    var mergedChildren = [flat1[0], flat2[0]];
    var newChildren = multiChild(mergedChildren);
    expect(newChildren.length).toBe(2);
    expect(newChildren[0]._key).toBe(newChildren[1]._key);
  });

});


