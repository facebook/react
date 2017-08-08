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

const React = require('react');
let ReactTestRenderer;

const RCTView = 'RCTView';
const View = props => <RCTView {...props} />;

describe('ReactTestRendererTraversal', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactTestRenderer = require('react-test-renderer');
  });

  class Example extends React.Component {
    render() {
      return (
        <View>
          <View foo="foo">
            <View bar="bar" />
            <View bar="bar" baz="baz" itself="itself" />
            <View />
            <ExampleSpread bar="bar" />
            <ExampleFn bar="bar" bing="bing" />
            <ExampleNull bar="bar" />
            <ExampleNull null="null">
              <View void="void" />
              <View void="void" />
            </ExampleNull>
          </View>
        </View>
      );
    }
  }
  class ExampleSpread extends React.Component {
    render = () => <View {...this.props} />;
  }
  const ExampleFn = props => <View baz="baz" />;
  const ExampleNull = props => null;

  it('initializes', () => {
    const render = ReactTestRenderer.create(<Example />);
    const hasFooProp = node => node.props.hasOwnProperty('foo');

    // assert .props, .type and .parent attributes
    const foo = render.root.find(hasFooProp);
    expect(foo.props.children).toHaveLength(7);
    expect(foo.type).toBe(View);
    expect(render.root.parent).toBe(null);
    expect(foo.children[0].parent).toBe(foo);
  });

  it('searches via .find() / .findAll()', () => {
    const render = ReactTestRenderer.create(<Example />);
    const hasFooProp = node => node.props.hasOwnProperty('foo');
    const hasBarProp = node => node.props.hasOwnProperty('bar');
    const hasBazProp = node => node.props.hasOwnProperty('baz');
    const hasBingProp = node => node.props.hasOwnProperty('bing');
    const hasNullProp = node => node.props.hasOwnProperty('null');
    const hasVoidProp = node => node.props.hasOwnProperty('void');
    const hasItselfProp = node => node.props.hasOwnProperty('itself');

    expect(() => render.root.find(hasFooProp)).not.toThrow(); // 1 match
    expect(() => render.root.find(hasBarProp)).toThrow(); // >1 matches
    expect(() => render.root.find(hasBazProp)).toThrow(); // >1 matches
    expect(() => render.root.find(hasBingProp)).not.toThrow(); // 1 match
    expect(() => render.root.find(hasNullProp)).not.toThrow(); // 1 match
    expect(() => render.root.find(hasVoidProp)).toThrow(); // 0 matches

    // same assertion as .find(), but confirm length
    expect(render.root.findAll(hasFooProp, {deep: false})).toHaveLength(1);
    expect(render.root.findAll(hasBarProp, {deep: false})).toHaveLength(5);
    expect(render.root.findAll(hasBazProp, {deep: false})).toHaveLength(2);
    expect(render.root.findAll(hasBingProp, {deep: false})).toHaveLength(1);
    expect(render.root.findAll(hasNullProp, {deep: false})).toHaveLength(1);
    expect(render.root.findAll(hasVoidProp, {deep: false})).toHaveLength(0);

    // note: with {deep: true}, .findAll() will continue to
    //       search children, even after finding a match
    expect(render.root.findAll(hasFooProp)).toHaveLength(2);
    expect(render.root.findAll(hasBarProp)).toHaveLength(9);
    expect(render.root.findAll(hasBazProp)).toHaveLength(4);
    expect(render.root.findAll(hasBingProp)).toHaveLength(1); // no spread
    expect(render.root.findAll(hasNullProp)).toHaveLength(1); // no spread
    expect(render.root.findAll(hasVoidProp)).toHaveLength(0);

    const bing = render.root.find(hasBingProp);
    expect(bing.find(hasBarProp)).toBe(bing);
    expect(bing.find(hasBingProp)).toBe(bing);
    expect(bing.findAll(hasBazProp, {deep: false})).toHaveLength(1);
    expect(bing.findAll(hasBazProp)).toHaveLength(2);

    const foo = render.root.find(hasFooProp);
    expect(foo.findAll(hasFooProp, {deep: false})).toHaveLength(1);
    expect(foo.findAll(hasFooProp)).toHaveLength(2);

    const itself = foo.find(hasItselfProp);
    expect(itself.find(hasBarProp)).toBe(itself);
    expect(itself.find(hasBazProp)).toBe(itself);
    expect(itself.findAll(hasBazProp, {deep: false})).toHaveLength(1);
    expect(itself.findAll(hasBazProp)).toHaveLength(2);
  });

  it('searches via .findByType() / .findAllByType()', () => {
    const render = ReactTestRenderer.create(<Example />);

    expect(() => render.root.findByType(ExampleFn)).not.toThrow(); // 1 match
    expect(() => render.root.findByType(View)).not.toThrow(); // 1 match
    // note: there are clearly multiple <View /> in general, but there
    //       is only one being rendered at root node level
    expect(() => render.root.findByType(ExampleNull)).toThrow(); // 2 matches

    expect(render.root.findAllByType(ExampleFn)).toHaveLength(1);
    expect(render.root.findAllByType(View, {deep: false})).toHaveLength(1);
    expect(render.root.findAllByType(View)).toHaveLength(7);
    expect(render.root.findAllByType(ExampleNull)).toHaveLength(2);

    const nulls = render.root.findAllByType(ExampleNull);
    expect(nulls[0].findAllByType(View)).toHaveLength(0);
    expect(nulls[1].findAllByType(View)).toHaveLength(0);

    const fn = render.root.findAllByType(ExampleFn);
    expect(fn[0].findAllByType(View)).toHaveLength(1);
  });

  it('searches via .findByProps() / .findAllByProps()', () => {
    const render = ReactTestRenderer.create(<Example />);
    const foo = 'foo';
    const bar = 'bar';
    const baz = 'baz';

    expect(() => render.root.findByProps({foo})).not.toThrow(); // 1 match
    expect(() => render.root.findByProps({bar})).toThrow(); // >1 matches
    expect(() => render.root.findByProps({baz})).toThrow(); // >1 matches

    expect(render.root.findAllByProps({foo}, {deep: false})).toHaveLength(1);
    expect(render.root.findAllByProps({bar}, {deep: false})).toHaveLength(5);
    expect(render.root.findAllByProps({baz}, {deep: false})).toHaveLength(2);

    expect(render.root.findAllByProps({foo})).toHaveLength(2);
    expect(render.root.findAllByProps({bar})).toHaveLength(9);
    expect(render.root.findAllByProps({baz})).toHaveLength(4);
  });
});
