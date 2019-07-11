/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

/*jslint evil: true */

'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const ReactTestUtils = require('react-dom/test-utils');

// Isolate test renderer.
jest.resetModules();
const ReactTestRenderer = require('react-test-renderer');

// Isolate ART renderer.
jest.resetModules();
const ReactART = require('react-art');
const ARTSVGMode = require('art/modes/svg');
const ARTCurrentMode = require('art/modes/current');
const Circle = require('react-art/Circle');
const Rectangle = require('react-art/Rectangle');
const Wedge = require('react-art/Wedge');

// Isolate the noop renderer
jest.resetModules();
const ReactNoop = require('react-noop-renderer');
const Scheduler = require('scheduler');

let Group;
let Shape;
let Surface;
let TestComponent;

const Missing = {};

function testDOMNodeStructure(domNode, expectedStructure) {
  expect(domNode).toBeDefined();
  expect(domNode.nodeName).toBe(expectedStructure.nodeName);
  for (const prop in expectedStructure) {
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
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    ARTCurrentMode.setCurrent(ARTSVGMode);

    Group = ReactART.Group;
    Shape = ReactART.Shape;
    Surface = ReactART.Surface;

    TestComponent = class extends React.Component {
      group = React.createRef();

      render() {
        const a = (
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

        const b = (
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

        const c = <Group key="c" />;

        return (
          <Surface width={150} height={200}>
            <Group ref={this.group}>
              {this.props.flipped ? [b, a, c] : [a, b, c]}
            </Group>
          </Surface>
        );
      }
    };
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  it('should have the correct lifecycle state', () => {
    let instance = <TestComponent />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    const group = instance.group.current;
    // Duck type test for an ART group
    expect(typeof group.indicate).toBe('function');
  });

  it('should render a reasonable SVG structure in SVG mode', () => {
    let instance = <TestComponent />;
    instance = ReactTestUtils.renderIntoDocument(instance);

    const expectedStructure = {
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

    const realNode = ReactDOM.findDOMNode(instance);
    testDOMNodeStructure(realNode, expectedStructure);
  });

  it('should be able to reorder components', () => {
    const instance = ReactDOM.render(
      <TestComponent flipped={false} />,
      container,
    );

    const expectedStructure = {
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

    const realNode = ReactDOM.findDOMNode(instance);
    testDOMNodeStructure(realNode, expectedStructure);

    ReactDOM.render(<TestComponent flipped={true} />, container);

    const expectedNewStructure = {
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
    class Component extends React.Component {
      render() {
        const chars = this.props.chars.split('');
        return (
          <Surface>
            {chars.map(text => <Shape key={text} title={text} />)}
          </Surface>
        );
      }
    }

    // Mini multi-child stress test: lots of reorders, some adds, some removes.
    const before = 'abcdefghijklmnopqrst';
    const after = 'mxhpgwfralkeoivcstzy';

    let instance = ReactDOM.render(<Component chars={before} />, container);
    const realNode = ReactDOM.findDOMNode(instance);
    expect(realNode.textContent).toBe(before);

    instance = ReactDOM.render(<Component chars={after} />, container);
    expect(realNode.textContent).toBe(after);

    ReactDOM.unmountComponentAtNode(container);
  });

  it('renders composite with lifecycle inside group', () => {
    let mounted = false;

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

    let ref = null;

    class Outer extends React.Component {
      test = React.createRef();

      componentDidMount() {
        ref = this.test.current;
      }

      render() {
        return (
          <Surface>
            <Group>
              <CustomShape ref={this.test} />
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

    let ref = {};

    class Outer extends React.Component {
      test = React.createRef();

      componentDidMount() {
        ref = this.test.current;
      }

      componentDidUpdate() {
        ref = this.test.current;
      }

      render() {
        return (
          <Surface>
            <Group>
              {this.props.mountCustomShape && <CustomShape ref={this.test} />}
            </Group>
          </Surface>
        );
      }
    }
    ReactDOM.render(<Outer />, container);
    expect(ref).toBe(null);
    ReactDOM.render(<Outer mountCustomShape={true} />, container);
    expect(ref.constructor).toBe(CustomShape);
  });

  it('adds and updates event handlers', () => {
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

      path.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
        }),
      );
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

  it('can concurrently render with a "primary" renderer while sharing context', () => {
    const CurrentRendererContext = React.createContext(null);

    function Yield(props) {
      Scheduler.unstable_yieldValue(props.value);
      return null;
    }

    let ops = [];
    function LogCurrentRenderer() {
      return (
        <CurrentRendererContext.Consumer>
          {currentRenderer => {
            ops.push(currentRenderer);
            return null;
          }}
        </CurrentRendererContext.Consumer>
      );
    }

    // Using test renderer instead of the DOM renderer here because async
    // testing APIs for the DOM renderer don't exist.
    ReactNoop.render(
      <CurrentRendererContext.Provider value="Test">
        <Yield value="A" />
        <Yield value="B" />
        <LogCurrentRenderer />
        <Yield value="C" />
      </CurrentRendererContext.Provider>,
    );

    expect(Scheduler).toFlushAndYieldThrough(['A']);

    ReactDOM.render(
      <Surface>
        <LogCurrentRenderer />
        <CurrentRendererContext.Provider value="ART">
          <LogCurrentRenderer />
        </CurrentRendererContext.Provider>
      </Surface>,
      container,
    );

    expect(ops).toEqual([null, 'ART']);

    ops = [];
    expect(Scheduler).toFlushAndYield(['B', 'C']);

    expect(ops).toEqual(['Test']);
  });
});

describe('ReactARTComponents', () => {
  it('should generate a <Shape> with props for drawing the Circle', () => {
    const circle = ReactTestRenderer.create(
      <Circle radius={10} stroke="green" strokeWidth={3} fill="blue" />,
    );
    expect(circle.toJSON()).toMatchSnapshot();
  });

  it('should warn if radius is missing on a Circle component', () => {
    expect(() =>
      ReactTestRenderer.create(
        <Circle stroke="green" strokeWidth={3} fill="blue" />,
      ),
    ).toWarnDev(
      'Warning: Failed prop type: The prop `radius` is marked as required in `Circle`, ' +
        'but its value is `undefined`.' +
        '\n    in Circle (at **)',
    );
  });

  it('should generate a <Shape> with props for drawing the Rectangle', () => {
    const rectangle = ReactTestRenderer.create(
      <Rectangle width={50} height={50} stroke="green" fill="blue" />,
    );
    expect(rectangle.toJSON()).toMatchSnapshot();
  });

  it('should warn if width/height is missing on a Rectangle component', () => {
    expect(() =>
      ReactTestRenderer.create(<Rectangle stroke="green" fill="blue" />),
    ).toWarnDev([
      'Warning: Failed prop type: The prop `width` is marked as required in `Rectangle`, ' +
        'but its value is `undefined`.' +
        '\n    in Rectangle (at **)',
      'Warning: Failed prop type: The prop `height` is marked as required in `Rectangle`, ' +
        'but its value is `undefined`.' +
        '\n    in Rectangle (at **)',
    ]);
  });

  it('should generate a <Shape> with props for drawing the Wedge', () => {
    const wedge = ReactTestRenderer.create(
      <Wedge outerRadius={50} startAngle={0} endAngle={360} fill="blue" />,
    );
    expect(wedge.toJSON()).toMatchSnapshot();
  });

  it('should return null if startAngle equals to endAngle on Wedge', () => {
    const wedge = ReactTestRenderer.create(
      <Wedge outerRadius={50} startAngle={0} endAngle={0} fill="blue" />,
    );
    expect(wedge.toJSON()).toBeNull();
  });

  it('should warn if outerRadius/startAngle/endAngle is missing on a Wedge component', () => {
    expect(() => ReactTestRenderer.create(<Wedge fill="blue" />)).toWarnDev([
      'Warning: Failed prop type: The prop `outerRadius` is marked as required in `Wedge`, ' +
        'but its value is `undefined`.' +
        '\n    in Wedge (at **)',
      'Warning: Failed prop type: The prop `startAngle` is marked as required in `Wedge`, ' +
        'but its value is `undefined`.' +
        '\n    in Wedge (at **)',
      'Warning: Failed prop type: The prop `endAngle` is marked as required in `Wedge`, ' +
        'but its value is `undefined`.' +
        '\n    in Wedge (at **)',
    ]);
  });
});
