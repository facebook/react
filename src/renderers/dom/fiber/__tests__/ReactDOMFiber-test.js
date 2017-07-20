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

var React = require('react');
var ReactDOM = require('react-dom');
var ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
var ReactTestUtils = require('react-dom/test-utils');
var PropTypes = require('prop-types');

describe('ReactDOMFiber', () => {
  var container;
  var ReactFeatureFlags;

  beforeEach(() => {
    container = document.createElement('div');
    ReactFeatureFlags = require('ReactFeatureFlags');
    ReactFeatureFlags.disableNewFiberFeatures = false;
  });

  afterEach(() => {
    ReactFeatureFlags = require('ReactFeatureFlags');
    ReactFeatureFlags.disableNewFiberFeatures = true;
  });

  it('should render strings as children', () => {
    const Box = ({value}) => <div>{value}</div>;

    ReactDOM.render(<Box value="foo" />, container);
    expect(container.textContent).toEqual('foo');
  });

  it('should render numbers as children', () => {
    const Box = ({value}) => <div>{value}</div>;

    ReactDOM.render(<Box value={10} />, container);

    expect(container.textContent).toEqual('10');
  });

  it('should be called a callback argument', () => {
    // mounting phase
    let called = false;
    ReactDOM.render(<div>Foo</div>, container, () => (called = true));
    expect(called).toEqual(true);

    // updating phase
    called = false;
    ReactDOM.render(<div>Foo</div>, container, () => (called = true));
    expect(called).toEqual(true);
  });

  it('should call a callback argument when the same element is re-rendered', () => {
    class Foo extends React.Component {
      render() {
        return <div>Foo</div>;
      }
    }
    const element = <Foo />;

    // mounting phase
    let called = false;
    ReactDOM.render(element, container, () => (called = true));
    expect(called).toEqual(true);

    // updating phase
    called = false;
    ReactDOM.unstable_batchedUpdates(() => {
      ReactDOM.render(element, container, () => (called = true));
    });
    expect(called).toEqual(true);
  });

  if (ReactDOMFeatureFlags.useFiber) {
    it('should render a component returning strings directly from render', () => {
      const Text = ({value}) => value;

      ReactDOM.render(<Text value="foo" />, container);
      expect(container.textContent).toEqual('foo');
    });

    it('should render a component returning numbers directly from render', () => {
      const Text = ({value}) => value;

      ReactDOM.render(<Text value={10} />, container);

      expect(container.textContent).toEqual('10');
    });

    it('finds the DOM Text node of a string child', () => {
      class Text extends React.Component {
        render() {
          return this.props.value;
        }
      }

      let instance = null;
      ReactDOM.render(
        <Text value="foo" ref={ref => (instance = ref)} />,
        container,
      );

      const textNode = ReactDOM.findDOMNode(instance);
      expect(textNode).toBe(container.firstChild);
      expect(textNode.nodeType).toBe(3);
      expect(textNode.nodeValue).toBe('foo');
    });

    it('finds the first child when a component returns a fragment', () => {
      class Fragment extends React.Component {
        render() {
          return [<div key="a" />, <span key="b" />];
        }
      }

      let instance = null;
      ReactDOM.render(<Fragment ref={ref => (instance = ref)} />, container);

      expect(container.childNodes.length).toBe(2);

      const firstNode = ReactDOM.findDOMNode(instance);
      expect(firstNode).toBe(container.firstChild);
      expect(firstNode.tagName).toBe('DIV');
    });

    it('finds the first child even when fragment is nested', () => {
      class Wrapper extends React.Component {
        render() {
          return this.props.children;
        }
      }

      class Fragment extends React.Component {
        render() {
          return [<Wrapper key="a"><div /></Wrapper>, <span key="b" />];
        }
      }

      let instance = null;
      ReactDOM.render(<Fragment ref={ref => (instance = ref)} />, container);

      expect(container.childNodes.length).toBe(2);

      const firstNode = ReactDOM.findDOMNode(instance);
      expect(firstNode).toBe(container.firstChild);
      expect(firstNode.tagName).toBe('DIV');
    });

    it('finds the first child even when first child renders null', () => {
      class NullComponent extends React.Component {
        render() {
          return null;
        }
      }

      class Fragment extends React.Component {
        render() {
          return [<NullComponent key="a" />, <div key="b" />, <span key="c" />];
        }
      }

      let instance = null;
      ReactDOM.render(<Fragment ref={ref => (instance = ref)} />, container);

      expect(container.childNodes.length).toBe(2);

      const firstNode = ReactDOM.findDOMNode(instance);
      expect(firstNode).toBe(container.firstChild);
      expect(firstNode.tagName).toBe('DIV');
    });
  }

  if (ReactDOMFeatureFlags.useFiber) {
    var svgEls, htmlEls, mathEls;
    var expectSVG = {ref: el => svgEls.push(el)};
    var expectHTML = {ref: el => htmlEls.push(el)};
    var expectMath = {ref: el => mathEls.push(el)};

    var usePortal = function(tree) {
      return ReactDOM.unstable_createPortal(
        tree,
        document.createElement('div'),
      );
    };

    var assertNamespacesMatch = function(tree) {
      container = document.createElement('div');
      svgEls = [];
      htmlEls = [];
      mathEls = [];

      ReactDOM.render(tree, container);
      svgEls.forEach(el => {
        expect(el.namespaceURI).toBe('http://www.w3.org/2000/svg');
      });
      htmlEls.forEach(el => {
        expect(el.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
      });
      mathEls.forEach(el => {
        expect(el.namespaceURI).toBe('http://www.w3.org/1998/Math/MathML');
      });

      ReactDOM.unmountComponentAtNode(container);
      expect(container.innerHTML).toBe('');
    };

    it('should render one portal', () => {
      var portalContainer = document.createElement('div');

      ReactDOM.render(
        <div>
          {ReactDOM.unstable_createPortal(<div>portal</div>, portalContainer)}
        </div>,
        container,
      );
      expect(portalContainer.innerHTML).toBe('<div>portal</div>');
      expect(container.innerHTML).toBe('<div></div>');

      ReactDOM.unmountComponentAtNode(container);
      expect(portalContainer.innerHTML).toBe('');
      expect(container.innerHTML).toBe('');
    });

    it('should render many portals', () => {
      var portalContainer1 = document.createElement('div');
      var portalContainer2 = document.createElement('div');

      var ops = [];
      class Child extends React.Component {
        componentDidMount() {
          ops.push(`${this.props.name} componentDidMount`);
        }
        componentDidUpdate() {
          ops.push(`${this.props.name} componentDidUpdate`);
        }
        componentWillUnmount() {
          ops.push(`${this.props.name} componentWillUnmount`);
        }
        render() {
          return <div>{this.props.name}</div>;
        }
      }

      class Parent extends React.Component {
        componentDidMount() {
          ops.push(`Parent:${this.props.step} componentDidMount`);
        }
        componentDidUpdate() {
          ops.push(`Parent:${this.props.step} componentDidUpdate`);
        }
        componentWillUnmount() {
          ops.push(`Parent:${this.props.step} componentWillUnmount`);
        }
        render() {
          const {step} = this.props;
          return [
            <Child key="a" name={`normal[0]:${step}`} />,
            ReactDOM.unstable_createPortal(
              <Child key="b" name={`portal1[0]:${step}`} />,
              portalContainer1,
            ),
            <Child key="c" name={`normal[1]:${step}`} />,
            ReactDOM.unstable_createPortal(
              [
                <Child key="d" name={`portal2[0]:${step}`} />,
                <Child key="e" name={`portal2[1]:${step}`} />,
              ],
              portalContainer2,
            ),
          ];
        }
      }

      ReactDOM.render(<Parent step="a" />, container);
      expect(portalContainer1.innerHTML).toBe('<div>portal1[0]:a</div>');
      expect(portalContainer2.innerHTML).toBe(
        '<div>portal2[0]:a</div><div>portal2[1]:a</div>',
      );
      expect(container.innerHTML).toBe(
        '<div>normal[0]:a</div><div>normal[1]:a</div>',
      );
      expect(ops).toEqual([
        'normal[0]:a componentDidMount',
        'portal1[0]:a componentDidMount',
        'normal[1]:a componentDidMount',
        'portal2[0]:a componentDidMount',
        'portal2[1]:a componentDidMount',
        'Parent:a componentDidMount',
      ]);

      ops.length = 0;
      ReactDOM.render(<Parent step="b" />, container);
      expect(portalContainer1.innerHTML).toBe('<div>portal1[0]:b</div>');
      expect(portalContainer2.innerHTML).toBe(
        '<div>portal2[0]:b</div><div>portal2[1]:b</div>',
      );
      expect(container.innerHTML).toBe(
        '<div>normal[0]:b</div><div>normal[1]:b</div>',
      );
      expect(ops).toEqual([
        'normal[0]:b componentDidUpdate',
        'portal1[0]:b componentDidUpdate',
        'normal[1]:b componentDidUpdate',
        'portal2[0]:b componentDidUpdate',
        'portal2[1]:b componentDidUpdate',
        'Parent:b componentDidUpdate',
      ]);

      ops.length = 0;
      ReactDOM.unmountComponentAtNode(container);
      expect(portalContainer1.innerHTML).toBe('');
      expect(portalContainer2.innerHTML).toBe('');
      expect(container.innerHTML).toBe('');
      expect(ops).toEqual([
        'Parent:b componentWillUnmount',
        'normal[0]:b componentWillUnmount',
        'portal1[0]:b componentWillUnmount',
        'normal[1]:b componentWillUnmount',
        'portal2[0]:b componentWillUnmount',
        'portal2[1]:b componentWillUnmount',
      ]);
    });

    it('should render nested portals', () => {
      var portalContainer1 = document.createElement('div');
      var portalContainer2 = document.createElement('div');
      var portalContainer3 = document.createElement('div');

      ReactDOM.render(
        [
          <div key="a">normal[0]</div>,
          ReactDOM.unstable_createPortal(
            [
              <div key="b">portal1[0]</div>,
              ReactDOM.unstable_createPortal(
                <div key="c">portal2[0]</div>,
                portalContainer2,
              ),
              ReactDOM.unstable_createPortal(
                <div key="d">portal3[0]</div>,
                portalContainer3,
              ),
              <div key="e">portal1[1]</div>,
            ],
            portalContainer1,
          ),
          <div key="f">normal[1]</div>,
        ],
        container,
      );
      expect(portalContainer1.innerHTML).toBe(
        '<div>portal1[0]</div><div>portal1[1]</div>',
      );
      expect(portalContainer2.innerHTML).toBe('<div>portal2[0]</div>');
      expect(portalContainer3.innerHTML).toBe('<div>portal3[0]</div>');
      expect(container.innerHTML).toBe(
        '<div>normal[0]</div><div>normal[1]</div>',
      );

      ReactDOM.unmountComponentAtNode(container);
      expect(portalContainer1.innerHTML).toBe('');
      expect(portalContainer2.innerHTML).toBe('');
      expect(portalContainer3.innerHTML).toBe('');
      expect(container.innerHTML).toBe('');
    });

    it('should reconcile portal children', () => {
      var portalContainer = document.createElement('div');

      ReactDOM.render(
        <div>
          {ReactDOM.unstable_createPortal(<div>portal:1</div>, portalContainer)}
        </div>,
        container,
      );
      expect(portalContainer.innerHTML).toBe('<div>portal:1</div>');
      expect(container.innerHTML).toBe('<div></div>');

      ReactDOM.render(
        <div>
          {ReactDOM.unstable_createPortal(<div>portal:2</div>, portalContainer)}
        </div>,
        container,
      );
      expect(portalContainer.innerHTML).toBe('<div>portal:2</div>');
      expect(container.innerHTML).toBe('<div></div>');

      ReactDOM.render(
        <div>
          {ReactDOM.unstable_createPortal(<p>portal:3</p>, portalContainer)}
        </div>,
        container,
      );
      expect(portalContainer.innerHTML).toBe('<p>portal:3</p>');
      expect(container.innerHTML).toBe('<div></div>');

      ReactDOM.render(
        <div>
          {ReactDOM.unstable_createPortal(['Hi', 'Bye'], portalContainer)}
        </div>,
        container,
      );
      expect(portalContainer.innerHTML).toBe('HiBye');
      expect(container.innerHTML).toBe('<div></div>');

      ReactDOM.render(
        <div>
          {ReactDOM.unstable_createPortal(['Bye', 'Hi'], portalContainer)}
        </div>,
        container,
      );
      expect(portalContainer.innerHTML).toBe('ByeHi');
      expect(container.innerHTML).toBe('<div></div>');

      ReactDOM.render(
        <div>
          {ReactDOM.unstable_createPortal(null, portalContainer)}
        </div>,
        container,
      );
      expect(portalContainer.innerHTML).toBe('');
      expect(container.innerHTML).toBe('<div></div>');
    });

    it('should keep track of namespace across portals (simple)', () => {
      assertNamespacesMatch(
        <svg {...expectSVG}>
          <image {...expectSVG} />
          {usePortal(<div {...expectHTML} />)}
          <image {...expectSVG} />
        </svg>,
      );
      assertNamespacesMatch(
        <math {...expectMath}>
          <mi {...expectMath} />
          {usePortal(<div {...expectHTML} />)}
          <mi {...expectMath} />
        </math>,
      );
      assertNamespacesMatch(
        <div {...expectHTML}>
          <p {...expectHTML} />
          {usePortal(
            <svg {...expectSVG}>
              <image {...expectSVG} />
            </svg>,
          )}
          <p {...expectHTML} />
        </div>,
      );
    });

    it('should keep track of namespace across portals (medium)', () => {
      assertNamespacesMatch(
        <svg {...expectSVG}>
          <image {...expectSVG} />
          {usePortal(<div {...expectHTML} />)}
          <image {...expectSVG} />
          {usePortal(<div {...expectHTML} />)}
          <image {...expectSVG} />
        </svg>,
      );
      assertNamespacesMatch(
        <div {...expectHTML}>
          <math {...expectMath}>
            <mi {...expectMath} />
            {usePortal(
              <svg {...expectSVG}>
                <image {...expectSVG} />
              </svg>,
            )}
          </math>
          <p {...expectHTML} />
        </div>,
      );
      assertNamespacesMatch(
        <math {...expectMath}>
          <mi {...expectMath} />
          {usePortal(
            <svg {...expectSVG}>
              <image {...expectSVG} />
              <foreignObject {...expectSVG}>
                <p {...expectHTML} />
                <math {...expectMath}>
                  <mi {...expectMath} />
                </math>
                <p {...expectHTML} />
              </foreignObject>
              <image {...expectSVG} />
            </svg>,
          )}
          <mi {...expectMath} />
        </math>,
      );
      assertNamespacesMatch(
        <div {...expectHTML}>
          {usePortal(
            <svg {...expectSVG}>
              {usePortal(<div {...expectHTML} />)}
              <image {...expectSVG} />
            </svg>,
          )}
          <p {...expectHTML} />
        </div>,
      );
      assertNamespacesMatch(
        <svg {...expectSVG}>
          <svg {...expectSVG}>
            {usePortal(<div {...expectHTML} />)}
            <image {...expectSVG} />
          </svg>
          <image {...expectSVG} />
        </svg>,
      );
    });

    it('should keep track of namespace across portals (complex)', () => {
      assertNamespacesMatch(
        <div {...expectHTML}>
          {usePortal(
            <svg {...expectSVG}>
              <image {...expectSVG} />
            </svg>,
          )}
          <p {...expectHTML} />
          <svg {...expectSVG}>
            <image {...expectSVG} />
          </svg>
          <svg {...expectSVG}>
            <svg {...expectSVG}>
              <image {...expectSVG} />
            </svg>
            <image {...expectSVG} />
          </svg>
          <p {...expectHTML} />
        </div>,
      );
      assertNamespacesMatch(
        <div {...expectHTML}>
          <svg {...expectSVG}>
            <svg {...expectSVG}>
              <image {...expectSVG} />
              {usePortal(
                <svg {...expectSVG}>
                  <image {...expectSVG} />
                  <svg {...expectSVG}>
                    <image {...expectSVG} />
                  </svg>
                  <image {...expectSVG} />
                </svg>,
              )}
              <image {...expectSVG} />
              <foreignObject {...expectSVG}>
                <p {...expectHTML} />
                {usePortal(<p {...expectHTML} />)}
                <p {...expectHTML} />
              </foreignObject>
            </svg>
            <image {...expectSVG} />
          </svg>
          <p {...expectHTML} />
        </div>,
      );
      assertNamespacesMatch(
        <div {...expectHTML}>
          <svg {...expectSVG}>
            <foreignObject {...expectSVG}>
              <p {...expectHTML} />
              {usePortal(
                <svg {...expectSVG}>
                  <image {...expectSVG} />
                  <svg {...expectSVG}>
                    <image {...expectSVG} />
                    <foreignObject {...expectSVG}>
                      <p {...expectHTML} />
                    </foreignObject>
                    {usePortal(<p {...expectHTML} />)}
                  </svg>
                  <image {...expectSVG} />
                </svg>,
              )}
              <p {...expectHTML} />
            </foreignObject>
            <image {...expectSVG} />
          </svg>
          <p {...expectHTML} />
        </div>,
      );
    });

    it('should unwind namespaces on uncaught errors', () => {
      function BrokenRender() {
        throw new Error('Hello');
      }

      expect(() => {
        assertNamespacesMatch(
          <svg {...expectSVG}>
            <BrokenRender />
          </svg>,
        );
      }).toThrow('Hello');
      assertNamespacesMatch(<div {...expectHTML} />);
    });

    it('should unwind namespaces on caught errors', () => {
      function BrokenRender() {
        throw new Error('Hello');
      }

      class ErrorBoundary extends React.Component {
        state = {error: null};
        componentDidCatch(error) {
          this.setState({error});
        }
        render() {
          if (this.state.error) {
            return <p {...expectHTML} />;
          }
          return this.props.children;
        }
      }

      assertNamespacesMatch(
        <svg {...expectSVG}>
          <foreignObject {...expectSVG}>
            <ErrorBoundary>
              <math {...expectMath}>
                <BrokenRender />
              </math>
            </ErrorBoundary>
          </foreignObject>
          <image {...expectSVG} />
        </svg>,
      );
      assertNamespacesMatch(<div {...expectHTML} />);
    });

    it('should unwind namespaces on caught errors in a portal', () => {
      function BrokenRender() {
        throw new Error('Hello');
      }

      class ErrorBoundary extends React.Component {
        state = {error: null};
        componentDidCatch(error) {
          this.setState({error});
        }
        render() {
          if (this.state.error) {
            return <image {...expectSVG} />;
          }
          return this.props.children;
        }
      }

      assertNamespacesMatch(
        <svg {...expectSVG}>
          <ErrorBoundary>
            {usePortal(
              <div {...expectHTML}>
                <math {...expectMath}>
                  <BrokenRender />)
                </math>
              </div>,
            )}
          </ErrorBoundary>
          {usePortal(<div {...expectHTML} />)}
        </svg>,
      );
    });

    it('should pass portal context when rendering subtree elsewhere', () => {
      var portalContainer = document.createElement('div');

      class Component extends React.Component {
        static contextTypes = {
          foo: PropTypes.string.isRequired,
        };

        render() {
          return <div>{this.context.foo}</div>;
        }
      }

      class Parent extends React.Component {
        static childContextTypes = {
          foo: PropTypes.string.isRequired,
        };

        getChildContext() {
          return {
            foo: 'bar',
          };
        }

        render() {
          return ReactDOM.unstable_createPortal(<Component />, portalContainer);
        }
      }

      ReactDOM.render(<Parent />, container);
      expect(container.innerHTML).toBe('');
      expect(portalContainer.innerHTML).toBe('<div>bar</div>');
    });

    it('should update portal context if it changes due to setState', () => {
      var portalContainer = document.createElement('div');

      class Component extends React.Component {
        static contextTypes = {
          foo: PropTypes.string.isRequired,
          getFoo: PropTypes.func.isRequired,
        };

        render() {
          return <div>{this.context.foo + '-' + this.context.getFoo()}</div>;
        }
      }

      class Parent extends React.Component {
        static childContextTypes = {
          foo: PropTypes.string.isRequired,
          getFoo: PropTypes.func.isRequired,
        };

        state = {
          bar: 'initial',
        };

        getChildContext() {
          return {
            foo: this.state.bar,
            getFoo: () => this.state.bar,
          };
        }

        render() {
          return ReactDOM.unstable_createPortal(<Component />, portalContainer);
        }
      }

      var instance = ReactDOM.render(<Parent />, container);
      expect(portalContainer.innerHTML).toBe('<div>initial-initial</div>');
      expect(container.innerHTML).toBe('');
      instance.setState({bar: 'changed'});
      expect(portalContainer.innerHTML).toBe('<div>changed-changed</div>');
      expect(container.innerHTML).toBe('');
    });

    it('should update portal context if it changes due to re-render', () => {
      var portalContainer = document.createElement('div');

      class Component extends React.Component {
        static contextTypes = {
          foo: PropTypes.string.isRequired,
          getFoo: PropTypes.func.isRequired,
        };

        render() {
          return <div>{this.context.foo + '-' + this.context.getFoo()}</div>;
        }
      }

      class Parent extends React.Component {
        static childContextTypes = {
          foo: PropTypes.string.isRequired,
          getFoo: PropTypes.func.isRequired,
        };

        getChildContext() {
          return {
            foo: this.props.bar,
            getFoo: () => this.props.bar,
          };
        }

        render() {
          return ReactDOM.unstable_createPortal(<Component />, portalContainer);
        }
      }

      ReactDOM.render(<Parent bar="initial" />, container);
      expect(portalContainer.innerHTML).toBe('<div>initial-initial</div>');
      expect(container.innerHTML).toBe('');
      ReactDOM.render(<Parent bar="changed" />, container);
      expect(portalContainer.innerHTML).toBe('<div>changed-changed</div>');
      expect(container.innerHTML).toBe('');
    });

    it('findDOMNode should find dom element after expanding a fragment', () => {
      class MyNode extends React.Component {
        render() {
          return !this.props.flag
            ? [<div key="a" />]
            : [<span key="b" />, <div key="a" />];
        }
      }

      var myNodeA = ReactDOM.render(<MyNode />, container);
      var a = ReactDOM.findDOMNode(myNodeA);
      expect(a.tagName).toBe('DIV');

      var myNodeB = ReactDOM.render(<MyNode flag={true} />, container);
      expect(myNodeA === myNodeB).toBe(true);

      var b = ReactDOM.findDOMNode(myNodeB);
      expect(b.tagName).toBe('SPAN');
    });

    it('should bubble events from the portal to the parent', () => {
      var portalContainer = document.createElement('div');

      var ops = [];
      var portal = null;

      ReactDOM.render(
        <div onClick={() => ops.push('parent clicked')}>
          {ReactDOM.unstable_createPortal(
            <div
              onClick={() => ops.push('portal clicked')}
              ref={n => (portal = n)}>
              portal
            </div>,
            portalContainer,
          )}
        </div>,
        container,
      );

      expect(portal.tagName).toBe('DIV');

      var fakeNativeEvent = {};
      ReactTestUtils.simulateNativeEventOnNode(
        'topClick',
        portal,
        fakeNativeEvent,
      );

      expect(ops).toEqual(['portal clicked', 'parent clicked']);
    });

    it('should not onMouseLeave when staying in the portal', () => {
      var portalContainer = document.createElement('div');

      var ops = [];
      var firstTarget = null;
      var secondTarget = null;
      var thirdTarget = null;

      function simulateMouseMove(from, to) {
        if (from) {
          ReactTestUtils.simulateNativeEventOnNode('topMouseOut', from, {
            target: from,
            relatedTarget: to,
          });
        }
        if (to) {
          ReactTestUtils.simulateNativeEventOnNode('topMouseOver', to, {
            target: to,
            relatedTarget: from,
          });
        }
      }

      ReactDOM.render(
        <div>
          <div
            onMouseEnter={() => ops.push('enter parent')}
            onMouseLeave={() => ops.push('leave parent')}>
            <div ref={n => (firstTarget = n)} />
            {ReactDOM.unstable_createPortal(
              <div
                onMouseEnter={() => ops.push('enter portal')}
                onMouseLeave={() => ops.push('leave portal')}
                ref={n => (secondTarget = n)}>
                portal
              </div>,
              portalContainer,
            )}
          </div>
          <div ref={n => (thirdTarget = n)} />
        </div>,
        container,
      );

      simulateMouseMove(null, firstTarget);
      expect(ops).toEqual(['enter parent']);

      ops = [];

      simulateMouseMove(firstTarget, secondTarget);
      expect(ops).toEqual([
        // Parent did not invoke leave because we're still inside the portal.
        'enter portal',
      ]);

      ops = [];

      simulateMouseMove(secondTarget, thirdTarget);
      expect(ops).toEqual([
        'leave portal',
        'leave parent', // Only when we leave the portal does onMouseLeave fire.
      ]);
    });

    it('should not update event handlers until commit', () => {
      let ops = [];
      const handlerA = () => ops.push('A');
      const handlerB = () => ops.push('B');

      class Example extends React.Component {
        state = {flip: false, count: 0};
        flip() {
          this.setState({flip: true, count: this.state.count + 1});
        }
        tick() {
          this.setState({count: this.state.count + 1});
        }
        render() {
          const useB = !this.props.forceA && this.state.flip;
          return <div onClick={useB ? handlerB : handlerA} />;
        }
      }

      class Click extends React.Component {
        constructor() {
          super();
          click(node);
        }
        render() {
          return null;
        }
      }

      let inst;
      ReactDOM.render([<Example key="a" ref={n => (inst = n)} />], container);
      const node = container.firstChild;
      expect(node.tagName).toEqual('DIV');

      function click(target) {
        var fakeNativeEvent = {};
        ReactTestUtils.simulateNativeEventOnNode(
          'topClick',
          target,
          fakeNativeEvent,
        );
      }

      click(node);

      expect(ops).toEqual(['A']);
      ops = [];

      // Render with the other event handler.
      inst.flip();

      click(node);

      expect(ops).toEqual(['B']);
      ops = [];

      // Rerender without changing any props.
      inst.tick();

      click(node);

      expect(ops).toEqual(['B']);
      ops = [];

      // Render a flip back to the A handler. The second component invokes the
      // click handler during render to simulate a click during an aborted
      // render. I use this hack because at current time we don't have a way to
      // test aborted ReactDOM renders.
      ReactDOM.render(
        [<Example key="a" forceA={true} />, <Click key="b" />],
        container,
      );

      // Because the new click handler has not yet committed, we should still
      // invoke B.
      expect(ops).toEqual(['B']);
      ops = [];

      // Any click that happens after commit, should invoke A.
      click(node);
      expect(ops).toEqual(['A']);
    });

    it('should not crash encountering low-priority tree', () => {
      ReactDOM.render(
        <div hidden={true}>
          <div />
        </div>,
        container,
      );
    });

    it('should not warn when rendering into an empty container', () => {
      spyOn(console, 'error');
      ReactDOM.render(<div>foo</div>, container);
      expect(container.innerHTML).toBe('<div>foo</div>');
      ReactDOM.render(null, container);
      expect(container.innerHTML).toBe('');
      expectDev(console.error.calls.count()).toBe(0);
      ReactDOM.render(<div>bar</div>, container);
      expect(container.innerHTML).toBe('<div>bar</div>');
      expectDev(console.error.calls.count()).toBe(0);
    });

    it('should warn when replacing a container which was manually updated outside of React', () => {
      spyOn(console, 'error');
      // when not messing with the DOM outside of React
      ReactDOM.render(<div key="1">foo</div>, container);
      ReactDOM.render(<div key="1">bar</div>, container);
      expect(container.innerHTML).toBe('<div>bar</div>');
      // then we mess with the DOM before an update
      // we know this will error - that is expected right now
      // It's an error of type 'NotFoundError' with no message
      expect(() => {
        container.innerHTML = '<div>MEOW.</div>';
        ReactDOM.render(<div key="2">baz</div>, container);
      }).toThrowError();
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toContain(
        'render(...): ' +
          'It looks like the React-rendered content of this container was ' +
          'removed without using React. This is not supported and will ' +
          'cause errors. Instead, call ReactDOM.unmountComponentAtNode ' +
          'to empty a container.',
      );
    });

    it('should warn when doing an update to a container manually updated outside of React', () => {
      spyOn(console, 'error');
      // when not messing with the DOM outside of React
      ReactDOM.render(<div>foo</div>, container);
      ReactDOM.render(<div>bar</div>, container);
      expect(container.innerHTML).toBe('<div>bar</div>');
      // then we mess with the DOM before an update
      container.innerHTML = '<div>MEOW.</div>';
      ReactDOM.render(<div>baz</div>, container);
      // silently fails to update
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toContain(
        'render(...): ' +
          'It looks like the React-rendered content of this container was ' +
          'removed without using React. This is not supported and will ' +
          'cause errors. Instead, call ReactDOM.unmountComponentAtNode ' +
          'to empty a container.',
      );
    });

    it('should warn when doing an update to a container manually cleared outside of React', () => {
      spyOn(console, 'error');
      // when not messing with the DOM outside of React
      ReactDOM.render(<div>foo</div>, container);
      ReactDOM.render(<div>bar</div>, container);
      expect(container.innerHTML).toBe('<div>bar</div>');
      // then we mess with the DOM before an update
      container.innerHTML = '';
      ReactDOM.render(<div>baz</div>, container);
      // silently fails to update
      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toContain(
        'render(...): ' +
          'It looks like the React-rendered content of this container was ' +
          'removed without using React. This is not supported and will ' +
          'cause errors. Instead, call ReactDOM.unmountComponentAtNode ' +
          'to empty a container.',
      );
    });
  }
});

// disableNewFiberFeatures currently defaults to true in test
describe('disableNewFiberFeatures', () => {
  var container;
  var ReactFeatureFlags;

  beforeEach(() => {
    container = document.createElement('div');
    ReactFeatureFlags = require('ReactFeatureFlags');
    ReactFeatureFlags.disableNewFiberFeatures = true;
  });

  afterEach(() => {
    ReactFeatureFlags = require('ReactFeatureFlags');
    ReactFeatureFlags.disableNewFiberFeatures = false;
  });

  it('throws if non-element passed to top-level render', () => {
    const message = 'render(): Invalid component element.';
    expect(() => ReactDOM.render(null, container)).toThrow(message, container);
    expect(() => ReactDOM.render(undefined, container)).toThrow(
      message,
      container,
    );
    expect(() => ReactDOM.render(false, container)).toThrow(message, container);
    expect(() => ReactDOM.render('Hi', container)).toThrow(message, container);
    expect(() => ReactDOM.render(999, container)).toThrow(message, container);
    expect(() => ReactDOM.render([<div key="a" />], container)).toThrow(
      message,
      container,
    );
  });

  it('throws if something other than false, null, or an element is returned from render', () => {
    function Render(props) {
      return props.children;
    }

    expect(() => ReactDOM.render(<Render>Hi</Render>, container)).toThrow(
      /You may have returned undefined/,
    );
    expect(() => ReactDOM.render(<Render>{999}</Render>, container)).toThrow(
      /You may have returned undefined/,
    );
    expect(() =>
      ReactDOM.render(<Render>[<div key="a" />]</Render>, container),
    ).toThrow(/You may have returned undefined/);
  });

  it('treats mocked render functions as if they return null', () => {
    class Mocked extends React.Component {}
    Mocked.prototype.render = jest.fn();
    ReactDOM.render(<Mocked />, container);
    expect(container.textContent).toEqual('');
  });
});
