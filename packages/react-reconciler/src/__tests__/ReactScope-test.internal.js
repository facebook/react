/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import {createEventTarget} from 'react-interactions/events/src/dom/testing-library';

let React;
let ReactFeatureFlags;

describe('ReactScope', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableScopeAPI = true;
    ReactFeatureFlags.enableFlareAPI = true;
    React = require('react');
  });

  describe('ReactDOM', () => {
    let ReactDOM;
    let container;

    beforeEach(() => {
      ReactDOM = require('react-dom');
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
      container = null;
    });

    it('queryAllNodes() works as intended', () => {
      const testScopeQuery = (type, props) => true;
      const TestScope = React.unstable_createScope();
      const scopeRef = React.createRef();
      const divRef = React.createRef();
      const spanRef = React.createRef();
      const aRef = React.createRef();

      function Test({toggle}) {
        return toggle ? (
          <TestScope ref={scopeRef}>
            <div ref={divRef}>DIV</div>
            <span ref={spanRef}>SPAN</span>
            <a ref={aRef}>A</a>
          </TestScope>
        ) : (
          <TestScope ref={scopeRef}>
            <a ref={aRef}>A</a>
            <div ref={divRef}>DIV</div>
            <span ref={spanRef}>SPAN</span>
          </TestScope>
        );
      }

      ReactDOM.render(<Test toggle={true} />, container);
      let nodes = scopeRef.current.queryAllNodes(testScopeQuery);
      expect(nodes).toEqual([divRef.current, spanRef.current, aRef.current]);
      ReactDOM.render(<Test toggle={false} />, container);
      nodes = scopeRef.current.queryAllNodes(testScopeQuery);
      expect(nodes).toEqual([aRef.current, divRef.current, spanRef.current]);
      ReactDOM.render(null, container);
      expect(scopeRef.current).toBe(null);
    });

    it('queryAllNodes() provides the correct host instance', () => {
      const testScopeQuery = (type, props) => type === 'div';
      const TestScope = React.unstable_createScope();
      const scopeRef = React.createRef();
      const divRef = React.createRef();
      const spanRef = React.createRef();
      const aRef = React.createRef();

      function Test({toggle}) {
        return toggle ? (
          <TestScope ref={scopeRef}>
            <div ref={divRef}>DIV</div>
            <span ref={spanRef}>SPAN</span>
            <a ref={aRef}>A</a>
          </TestScope>
        ) : (
          <TestScope ref={scopeRef}>
            <a ref={aRef}>A</a>
            <div ref={divRef}>DIV</div>
            <span ref={spanRef}>SPAN</span>
          </TestScope>
        );
      }

      ReactDOM.render(<Test toggle={true} />, container);
      let nodes = scopeRef.current.queryAllNodes(testScopeQuery);
      expect(nodes).toEqual([divRef.current]);
      let filterQuery = (type, props, instance) =>
        instance === spanRef.current || testScopeQuery(type, props);
      nodes = scopeRef.current.queryAllNodes(filterQuery);
      expect(nodes).toEqual([divRef.current, spanRef.current]);
      filterQuery = (type, props, instance) =>
        [spanRef.current, aRef.current].includes(instance) ||
        testScopeQuery(type, props);
      nodes = scopeRef.current.queryAllNodes(filterQuery);
      expect(nodes).toEqual([divRef.current, spanRef.current, aRef.current]);
      ReactDOM.render(<Test toggle={false} />, container);
      filterQuery = (type, props, instance) =>
        [spanRef.current, aRef.current].includes(instance) ||
        testScopeQuery(type, props);
      nodes = scopeRef.current.queryAllNodes(filterQuery);
      expect(nodes).toEqual([aRef.current, divRef.current, spanRef.current]);
      ReactDOM.render(null, container);
      expect(scopeRef.current).toBe(null);
    });

    it('queryFirstNode() works as intended', () => {
      const testScopeQuery = (type, props) => true;
      const TestScope = React.unstable_createScope();
      const scopeRef = React.createRef();
      const divRef = React.createRef();
      const spanRef = React.createRef();
      const aRef = React.createRef();

      function Test({toggle}) {
        return toggle ? (
          <TestScope ref={scopeRef}>
            <div ref={divRef}>DIV</div>
            <span ref={spanRef}>SPAN</span>
            <a ref={aRef}>A</a>
          </TestScope>
        ) : (
          <TestScope ref={scopeRef}>
            <a ref={aRef}>A</a>
            <div ref={divRef}>DIV</div>
            <span ref={spanRef}>SPAN</span>
          </TestScope>
        );
      }

      ReactDOM.render(<Test toggle={true} />, container);
      let node = scopeRef.current.queryFirstNode(testScopeQuery);
      expect(node).toEqual(divRef.current);
      ReactDOM.render(<Test toggle={false} />, container);
      node = scopeRef.current.queryFirstNode(testScopeQuery);
      expect(node).toEqual(aRef.current);
      ReactDOM.render(null, container);
      expect(scopeRef.current).toBe(null);
    });

    it('containsNode() works as intended', () => {
      const TestScope = React.unstable_createScope();
      const scopeRef = React.createRef();
      const divRef = React.createRef();
      const spanRef = React.createRef();
      const aRef = React.createRef();
      const outerSpan = React.createRef();
      const emRef = React.createRef();

      function Test({toggle}) {
        return toggle ? (
          <div>
            <span ref={outerSpan}>SPAN</span>
            <TestScope ref={scopeRef}>
              <div ref={divRef}>DIV</div>
              <span ref={spanRef}>SPAN</span>
              <a ref={aRef}>A</a>
            </TestScope>
            <em ref={emRef}>EM</em>
          </div>
        ) : (
          <div>
            <TestScope ref={scopeRef}>
              <a ref={aRef}>A</a>
              <div ref={divRef}>DIV</div>
              <span ref={spanRef}>SPAN</span>
              <em ref={emRef}>EM</em>
            </TestScope>
            <span ref={outerSpan}>SPAN</span>
          </div>
        );
      }

      ReactDOM.render(<Test toggle={true} />, container);
      expect(scopeRef.current.containsNode(divRef.current)).toBe(true);
      expect(scopeRef.current.containsNode(spanRef.current)).toBe(true);
      expect(scopeRef.current.containsNode(aRef.current)).toBe(true);
      expect(scopeRef.current.containsNode(outerSpan.current)).toBe(false);
      expect(scopeRef.current.containsNode(emRef.current)).toBe(false);
      ReactDOM.render(<Test toggle={false} />, container);
      expect(scopeRef.current.containsNode(divRef.current)).toBe(true);
      expect(scopeRef.current.containsNode(spanRef.current)).toBe(true);
      expect(scopeRef.current.containsNode(aRef.current)).toBe(true);
      expect(scopeRef.current.containsNode(outerSpan.current)).toBe(false);
      expect(scopeRef.current.containsNode(emRef.current)).toBe(true);
      ReactDOM.render(<Test toggle={true} />, container);
      expect(scopeRef.current.containsNode(emRef.current)).toBe(false);
    });

    it('mixed getParent() and queryAllNodes() works as intended', () => {
      const testScopeQuery = (type, props) => true;
      const TestScope = React.unstable_createScope();
      const TestScope2 = React.unstable_createScope();
      const refA = React.createRef();
      const refB = React.createRef();
      const refC = React.createRef();
      const refD = React.createRef();
      const spanA = React.createRef();
      const spanB = React.createRef();
      const divA = React.createRef();
      const divB = React.createRef();

      function Test() {
        return (
          <div>
            <TestScope ref={refA}>
              <span ref={spanA}>
                <TestScope2 ref={refB}>
                  <div ref={divA}>
                    <TestScope ref={refC}>
                      <span ref={spanB}>
                        <TestScope2 ref={refD}>
                          <div ref={divB}>>Hello world</div>
                        </TestScope2>
                      </span>
                    </TestScope>
                  </div>
                </TestScope2>
              </span>
            </TestScope>
          </div>
        );
      }

      ReactDOM.render(<Test />, container);
      const dParent = refD.current.getParent();
      expect(dParent).not.toBe(null);
      expect(dParent.queryAllNodes(testScopeQuery)).toEqual([
        divA.current,
        spanB.current,
        divB.current,
      ]);
      const cParent = refC.current.getParent();
      expect(cParent).not.toBe(null);
      expect(cParent.queryAllNodes(testScopeQuery)).toEqual([
        spanA.current,
        divA.current,
        spanB.current,
        divB.current,
      ]);
      expect(refB.current.getParent()).toBe(null);
      expect(refA.current.getParent()).toBe(null);
    });

    it('getChildren() works as intended', () => {
      const TestScope = React.unstable_createScope();
      const TestScope2 = React.unstable_createScope();
      const refA = React.createRef();
      const refB = React.createRef();
      const refC = React.createRef();
      const refD = React.createRef();
      const spanA = React.createRef();
      const spanB = React.createRef();
      const divA = React.createRef();
      const divB = React.createRef();

      function Test() {
        return (
          <div>
            <TestScope ref={refA}>
              <span ref={spanA}>
                <TestScope2 ref={refB}>
                  <div ref={divA}>
                    <TestScope ref={refC}>
                      <span ref={spanB}>
                        <TestScope2 ref={refD}>
                          <div ref={divB}>>Hello world</div>
                        </TestScope2>
                      </span>
                    </TestScope>
                  </div>
                </TestScope2>
              </span>
            </TestScope>
          </div>
        );
      }

      ReactDOM.render(<Test />, container);
      const dChildren = refD.current.getChildren();
      expect(dChildren).toBe(null);
      const cChildren = refC.current.getChildren();
      expect(cChildren).toBe(null);
      const bChildren = refB.current.getChildren();
      expect(bChildren).toEqual([refD.current]);
      const aChildren = refA.current.getChildren();
      expect(aChildren).toEqual([refC.current]);
    });

    it('scopes support server-side rendering and hydration', () => {
      const TestScope = React.unstable_createScope();
      const ReactDOMServer = require('react-dom/server');
      const scopeRef = React.createRef();
      const divRef = React.createRef();
      const spanRef = React.createRef();
      const aRef = React.createRef();

      function Test({toggle}) {
        return (
          <div>
            <TestScope ref={scopeRef}>
              <div ref={divRef}>DIV</div>
              <span ref={spanRef}>SPAN</span>
              <a ref={aRef}>A</a>
            </TestScope>
            <div>Outside content!</div>
          </div>
        );
      }
      const html = ReactDOMServer.renderToString(<Test />);
      expect(html).toBe(
        '<div data-reactroot=""><div>DIV</div><span>SPAN</span><a>A</a><div>Outside content!</div></div>',
      );
      container.innerHTML = html;
      ReactDOM.hydrate(<Test />, container);
      const testScopeQuery = (type, props) => true;
      const nodes = scopeRef.current.queryAllNodes(testScopeQuery);
      expect(nodes).toEqual([divRef.current, spanRef.current, aRef.current]);
    });

    it('event responders can be attached to scopes', () => {
      let onKeyDown = jest.fn();
      const TestScope = React.unstable_createScope();
      const ref = React.createRef();
      const useKeyboard = require('react-interactions/events/keyboard')
        .useKeyboard;
      let Component = () => {
        const listener = useKeyboard({
          onKeyDown,
        });
        return (
          <TestScope DEPRECATED_flareListeners={listener}>
            <div ref={ref} />
          </TestScope>
        );
      };
      ReactDOM.render(<Component />, container);

      let target = createEventTarget(ref.current);
      target.keydown({key: 'Q'});
      expect(onKeyDown).toHaveBeenCalledTimes(1);

      onKeyDown = jest.fn();
      Component = () => {
        const listener = useKeyboard({
          onKeyDown,
        });
        return (
          <div>
            <TestScope DEPRECATED_flareListeners={listener}>
              <div ref={ref} />
            </TestScope>
          </div>
        );
      };
      ReactDOM.render(<Component />, container);

      target = createEventTarget(ref.current);
      target.keydown({key: 'Q'});
      expect(onKeyDown).toHaveBeenCalledTimes(1);
    });
  });

  describe('ReactTestRenderer', () => {
    let ReactTestRenderer;

    beforeEach(() => {
      ReactTestRenderer = require('react-test-renderer');
    });

    it('queryAllNodes() works as intended', () => {
      const testScopeQuery = (type, props) => true;
      const TestScope = React.unstable_createScope();
      const scopeRef = React.createRef();
      const divRef = React.createRef();
      const spanRef = React.createRef();
      const aRef = React.createRef();

      function Test({toggle}) {
        return toggle ? (
          <TestScope ref={scopeRef}>
            <div ref={divRef}>DIV</div>
            <span ref={spanRef}>SPAN</span>
            <a ref={aRef}>A</a>
          </TestScope>
        ) : (
          <TestScope ref={scopeRef}>
            <a ref={aRef}>A</a>
            <div ref={divRef}>DIV</div>
            <span ref={spanRef}>SPAN</span>
          </TestScope>
        );
      }

      const renderer = ReactTestRenderer.create(<Test toggle={true} />, {
        createNodeMock: element => {
          return element;
        },
      });
      let nodes = scopeRef.current.queryAllNodes(testScopeQuery);
      expect(nodes).toEqual([divRef.current, spanRef.current, aRef.current]);
      renderer.update(<Test toggle={false} />);
      nodes = scopeRef.current.queryAllNodes(testScopeQuery);
      expect(nodes).toEqual([aRef.current, divRef.current, spanRef.current]);
    });

    it('queryFirstNode() works as intended', () => {
      const testScopeQuery = (type, props) => true;
      const TestScope = React.unstable_createScope();
      const scopeRef = React.createRef();
      const divRef = React.createRef();
      const spanRef = React.createRef();
      const aRef = React.createRef();

      function Test({toggle}) {
        return toggle ? (
          <TestScope ref={scopeRef}>
            <div ref={divRef}>DIV</div>
            <span ref={spanRef}>SPAN</span>
            <a ref={aRef}>A</a>
          </TestScope>
        ) : (
          <TestScope ref={scopeRef}>
            <a ref={aRef}>A</a>
            <div ref={divRef}>DIV</div>
            <span ref={spanRef}>SPAN</span>
          </TestScope>
        );
      }

      const renderer = ReactTestRenderer.create(<Test toggle={true} />, {
        createNodeMock: element => {
          return element;
        },
      });
      let node = scopeRef.current.queryFirstNode(testScopeQuery);
      expect(node).toEqual(divRef.current);
      renderer.update(<Test toggle={false} />);
      node = scopeRef.current.queryFirstNode(testScopeQuery);
      expect(node).toEqual(aRef.current);
    });

    it('containsNode() works as intended', () => {
      const TestScope = React.unstable_createScope();
      const scopeRef = React.createRef();
      const divRef = React.createRef();
      const spanRef = React.createRef();
      const aRef = React.createRef();
      const outerSpan = React.createRef();
      const emRef = React.createRef();

      function Test({toggle}) {
        return toggle ? (
          <div>
            <span ref={outerSpan}>SPAN</span>
            <TestScope ref={scopeRef}>
              <div ref={divRef}>DIV</div>
              <span ref={spanRef}>SPAN</span>
              <a ref={aRef}>A</a>
            </TestScope>
            <em ref={emRef}>EM</em>
          </div>
        ) : (
          <div>
            <TestScope ref={scopeRef}>
              <a ref={aRef}>A</a>
              <div ref={divRef}>DIV</div>
              <span ref={spanRef}>SPAN</span>
              <em ref={emRef}>EM</em>
            </TestScope>
            <span ref={outerSpan}>SPAN</span>
          </div>
        );
      }

      const renderer = ReactTestRenderer.create(<Test toggle={true} />, {
        createNodeMock: element => {
          return element;
        },
      });
      expect(scopeRef.current.containsNode(divRef.current)).toBe(true);
      expect(scopeRef.current.containsNode(spanRef.current)).toBe(true);
      expect(scopeRef.current.containsNode(aRef.current)).toBe(true);
      expect(scopeRef.current.containsNode(outerSpan.current)).toBe(false);
      expect(scopeRef.current.containsNode(emRef.current)).toBe(false);
      renderer.update(<Test toggle={false} />);
      expect(scopeRef.current.containsNode(divRef.current)).toBe(true);
      expect(scopeRef.current.containsNode(spanRef.current)).toBe(true);
      expect(scopeRef.current.containsNode(aRef.current)).toBe(true);
      expect(scopeRef.current.containsNode(outerSpan.current)).toBe(false);
      expect(scopeRef.current.containsNode(emRef.current)).toBe(true);
      renderer.update(<Test toggle={true} />);
      expect(scopeRef.current.containsNode(emRef.current)).toBe(false);
    });

    it('mixed getParent() and queryAllNodes() works as intended', () => {
      const testScopeQuery = (type, props) => true;
      const TestScope = React.unstable_createScope();
      const TestScope2 = React.unstable_createScope();
      const refA = React.createRef();
      const refB = React.createRef();
      const refC = React.createRef();
      const refD = React.createRef();
      const spanA = React.createRef();
      const spanB = React.createRef();
      const divA = React.createRef();
      const divB = React.createRef();

      function Test() {
        return (
          <div>
            <TestScope ref={refA}>
              <span ref={spanA}>
                <TestScope2 ref={refB}>
                  <div ref={divA}>
                    <TestScope ref={refC}>
                      <span ref={spanB}>
                        <TestScope2 ref={refD}>
                          <div ref={divB}>>Hello world</div>
                        </TestScope2>
                      </span>
                    </TestScope>
                  </div>
                </TestScope2>
              </span>
            </TestScope>
          </div>
        );
      }

      ReactTestRenderer.create(<Test />, {
        createNodeMock: element => {
          return element;
        },
      });
      const dParent = refD.current.getParent();
      expect(dParent).not.toBe(null);
      expect(dParent.queryAllNodes(testScopeQuery)).toEqual([
        divA.current,
        spanB.current,
        divB.current,
      ]);
      const cParent = refC.current.getParent();
      expect(cParent).not.toBe(null);
      expect(cParent.queryAllNodes(testScopeQuery)).toEqual([
        spanA.current,
        divA.current,
        spanB.current,
        divB.current,
      ]);
      expect(refB.current.getParent()).toBe(null);
      expect(refA.current.getParent()).toBe(null);
    });

    it('getChildren() works as intended', () => {
      const TestScope = React.unstable_createScope();
      const TestScope2 = React.unstable_createScope();
      const refA = React.createRef();
      const refB = React.createRef();
      const refC = React.createRef();
      const refD = React.createRef();
      const spanA = React.createRef();
      const spanB = React.createRef();
      const divA = React.createRef();
      const divB = React.createRef();

      function Test() {
        return (
          <div>
            <TestScope ref={refA}>
              <span ref={spanA}>
                <TestScope2 ref={refB}>
                  <div ref={divA}>
                    <TestScope ref={refC}>
                      <span ref={spanB}>
                        <TestScope2 ref={refD}>
                          <div ref={divB}>>Hello world</div>
                        </TestScope2>
                      </span>
                    </TestScope>
                  </div>
                </TestScope2>
              </span>
            </TestScope>
          </div>
        );
      }

      ReactTestRenderer.create(<Test />, {
        createNodeMock: element => {
          return element;
        },
      });
      const dChildren = refD.current.getChildren();
      expect(dChildren).toBe(null);
      const cChildren = refC.current.getChildren();
      expect(cChildren).toBe(null);
      const bChildren = refB.current.getChildren();
      expect(bChildren).toEqual([refD.current]);
      const aChildren = refA.current.getChildren();
      expect(aChildren).toEqual([refC.current]);
    });
  });
});
