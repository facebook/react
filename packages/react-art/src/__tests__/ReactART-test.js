/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

/*jslint evil: true */

'use strict';

var React = require('react');
var ReactDOM = require('react-dom');
var ReactTestUtils = require('react-dom/test-utils');

var Group;
var Shape;
var Surface;
var TestComponent;

var Missing = {};

var ReactART = require('react-art');
var ARTSVGMode = require('art/modes/svg');
var ARTCurrentMode = require('art/modes/current');

function testDOMNodeStructure(domNode, expectedStructure) {
  expect(domNode).toBeDefined();
  expect(domNode.nodeName).toBe(expectedStructure.nodeName);
  for (var prop in expectedStructure) {
    if (!expectedStructure.hasOwnProperty(prop)) {
      continue;
    }
    if (prop !== 'nodeName' && prop !== 'children') {
      if (expectedStructure[prop] === Missing) {
        expect(domNode.hasAttribute(prop)).toBe(false);
      } else {
        expect(domNode.getAttribute(prop)).toBe(expectedStructure[prop]);
      }
    }
  }
  if (expectedStructure.children) {
    expectedStructure.children.forEach(function(subTree, index) {
      testDOMNodeStructure(domNode.childNodes[index], subTree);
    });
  }
}

describe('ReactART', () => {
  beforeEach(() => {
    ARTCurrentMode.setCurrent(ARTSVGMode);

    Group = ReactART.Group;
    Shape = ReactART.Shape;
    Surface = ReactART.Surface;

    TestComponent = class extends React.Component {
      render() {
        var a = (
          <Shape
            d="M0,0l50,0l0,50l-50,0z"
            fill={new ReactART.LinearGradient(['black', 'white'])}
            key="a"
            width={50}
            height={50}
            x={50}
            y={50}
            opacity={0.1}
          />
        );

        var b = (
          <Shape
            fill="#3C5A99"
            key="b"
            scale={0.5}
            x={50}
            y={50}
            title="This is an F"
            cursor="pointer">
            M64.564,38.583H54l0.008-5.834c0-3.035,0.293-4.666,4.657-4.666
            h5.833V16.429h-9.33c-11.213,0-15.159,5.654-15.159,15.16v6.994
            h-6.99v11.652h6.99v33.815H54V50.235h9.331L64.564,38.583z
          </Shape>
        );

        var c = <Group key="c" />;

        return (
          <Surface width={150} height={200}>
            <Group ref="group">
              {this.props.flipped ? [b, a, c] : [a, b, c]}
            </Group>
          </Surface>
        );
      }
    };
  });

  it('should have the correct lifecycle state', () => {
    var instance = <TestComponent />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    var group = instance.refs.group;
    // Duck type test for an ART group
    expect(typeof group.indicate).toBe('function');
  });

  it('should render a reasonable SVG structure in SVG mode', () => {
    var instance = <TestComponent />;
    instance = ReactTestUtils.renderIntoDocument(instance);

    var expectedStructure = {
      nodeName: 'svg',
      width: '150',
      height: '200',
      children: [
        {nodeName: 'defs'},
        {
          nodeName: 'g',
          children: [
            {
              nodeName: 'defs',
              children: [{nodeName: 'linearGradient'}],
            },
            {nodeName: 'path'},
            {nodeName: 'path'},
            {nodeName: 'g'},
          ],
        },
      ],
    };

    var realNode = ReactDOM.findDOMNode(instance);
    testDOMNodeStructure(realNode, expectedStructure);
  });

  it('should be able to reorder components', () => {
    var container = document.createElement('div');
    var instance = ReactDOM.render(
      <TestComponent flipped={false} />,
      container,
    );

    var expectedStructure = {
      nodeName: 'svg',
      children: [
        {nodeName: 'defs'},
        {
          nodeName: 'g',
          children: [
            {nodeName: 'defs'},
            {nodeName: 'path', opacity: '0.1'},
            {nodeName: 'path', opacity: Missing},
            {nodeName: 'g'},
          ],
        },
      ],
    };

    var realNode = ReactDOM.findDOMNode(instance);
    testDOMNodeStructure(realNode, expectedStructure);

    ReactDOM.render(<TestComponent flipped={true} />, container);

    var expectedNewStructure = {
      nodeName: 'svg',
      children: [
        {nodeName: 'defs'},
        {
          nodeName: 'g',
          children: [
            {nodeName: 'defs'},
            {nodeName: 'path', opacity: Missing},
            {nodeName: 'path', opacity: '0.1'},
            {nodeName: 'g'},
          ],
        },
      ],
    };

    testDOMNodeStructure(realNode, expectedNewStructure);
  });

  it('should be able to reorder many components', () => {
    var container = document.createElement('div');

    class Component extends React.Component {
      render() {
        var chars = this.props.chars.split('');
        return (
          <Surface>
            {chars.map(text => <Shape key={text} title={text} />)}
          </Surface>
        );
      }
    }

    // Mini multi-child stress test: lots of reorders, some adds, some removes.
    var before = 'abcdefghijklmnopqrst';
    var after = 'mxhpgwfralkeoivcstzy';

    var instance = ReactDOM.render(<Component chars={before} />, container);
    var realNode = ReactDOM.findDOMNode(instance);
    expect(realNode.textContent).toBe(before);

    instance = ReactDOM.render(<Component chars={after} />, container);
    expect(realNode.textContent).toBe(after);

    ReactDOM.unmountComponentAtNode(container);
  });

  it('renders composite with lifecycle inside group', () => {
    var mounted = false;

    class CustomShape extends React.Component {
      render() {
        return <Shape />;
      }

      componentDidMount() {
        mounted = true;
      }
    }

    ReactTestUtils.renderIntoDocument(
      <Surface>
        <Group>
          <CustomShape />
        </Group>
      </Surface>,
    );
    expect(mounted).toBe(true);
  });

  it('resolves refs before componentDidMount', () => {
    class CustomShape extends React.Component {
      render() {
        return <Shape />;
      }
    }

    var ref = null;

    class Outer extends React.Component {
      componentDidMount() {
        ref = this.refs.test;
      }

      render() {
        return (
          <Surface>
            <Group>
              <CustomShape ref="test" />
            </Group>
          </Surface>
        );
      }
    }

    ReactTestUtils.renderIntoDocument(<Outer />);
    expect(ref.constructor).toBe(CustomShape);
  });

  it('resolves refs before componentDidUpdate', () => {
    class CustomShape extends React.Component {
      render() {
        return <Shape />;
      }
    }

    var ref = {};

    class Outer extends React.Component {
      componentDidMount() {
        ref = this.refs.test;
      }

      componentDidUpdate() {
        ref = this.refs.test;
      }

      render() {
        return (
          <Surface>
            <Group>
              {this.props.mountCustomShape && <CustomShape ref="test" />}
            </Group>
          </Surface>
        );
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(<Outer />, container);
    expect(ref).not.toBeDefined();
    ReactDOM.render(<Outer mountCustomShape={true} />, container);
    expect(ref.constructor).toBe(CustomShape);
  });

  it('adds and updates event handlers', () => {
    const container = document.createElement('div');

    function render(onClick) {
      return ReactDOM.render(
        <Surface>
          <Shape onClick={onClick} />
        </Surface>,
        container,
      );
    }

    function doClick(instance) {
      const path = ReactDOM.findDOMNode(instance).querySelector('path');

      // ReactTestUtils.Simulate.click doesn't work with SVG elements
      path.click();
    }

    const onClick1 = jest.fn();
    let instance = render(onClick1);
    doClick(instance);
    expect(onClick1).toBeCalled();

    const onClick2 = jest.fn();
    instance = render(onClick2);
    doClick(instance);
    expect(onClick2).toBeCalled();
  });
});
