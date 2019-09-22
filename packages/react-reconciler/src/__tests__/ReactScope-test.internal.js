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

    it('getScopedNodes() works as intended', () => {
      const TestScope = React.unstable_createScope((type, props) => true);
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
      let nodes = scopeRef.current.getScopedNodes();
      expect(nodes).toEqual([divRef.current, spanRef.current, aRef.current]);
      ReactDOM.render(<Test toggle={false} />, container);
      nodes = scopeRef.current.getScopedNodes();
      expect(nodes).toEqual([aRef.current, divRef.current, spanRef.current]);
      ReactDOM.render(null, container);
      expect(scopeRef.current).toBe(null);
    });

    it('mixed getParent() and getScopedNodes() works as intended', () => {
      const TestScope = React.unstable_createScope((type, props) => true);
      const TestScope2 = React.unstable_createScope((type, props) => true);
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
      expect(dParent.getScopedNodes()).toEqual([
        divA.current,
        spanB.current,
        divB.current,
      ]);
      const cParent = refC.current.getParent();
      expect(cParent).not.toBe(null);
      expect(cParent.getScopedNodes()).toEqual([
        spanA.current,
        divA.current,
        spanB.current,
        divB.current,
      ]);
      expect(refB.current.getParent()).toBe(null);
      expect(refA.current.getParent()).toBe(null);
    });

    it('getChildren() works as intended', () => {
      const TestScope = React.unstable_createScope((type, props) => true);
      const TestScope2 = React.unstable_createScope((type, props) => true);
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
      const TestScope = React.unstable_createScope((type, props) => true);
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
      const nodes = scopeRef.current.getScopedNodes();
      expect(nodes).toEqual([divRef.current, spanRef.current, aRef.current]);
    });

    it('event responders can be attached to scopes', () => {
      let onKeyDown = jest.fn();
      const TestScope = React.unstable_createScope((type, props) => true);
      const ref = React.createRef();
      const useKeyboard = require('react-interactions/events/keyboard')
        .useKeyboard;
      let Component = () => {
        const listener = useKeyboard({
          onKeyDown,
        });
        return (
          <TestScope listeners={listener}>
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
            <TestScope listeners={listener}>
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

    it('getScopedNodes() works as intended', () => {
      const TestScope = React.unstable_createScope((type, props) => true);
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
      let nodes = scopeRef.current.getScopedNodes();
      expect(nodes).toEqual([divRef.current, spanRef.current, aRef.current]);
      renderer.update(<Test toggle={false} />);
      nodes = scopeRef.current.getScopedNodes();
      expect(nodes).toEqual([aRef.current, divRef.current, spanRef.current]);
    });

    it('mixed getParent() and getScopedNodes() works as intended', () => {
      const TestScope = React.unstable_createScope((type, props) => true);
      const TestScope2 = React.unstable_createScope((type, props) => true);
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
      expect(dParent.getScopedNodes()).toEqual([
        divA.current,
        spanB.current,
        divB.current,
      ]);
      const cParent = refC.current.getParent();
      expect(cParent).not.toBe(null);
      expect(cParent.getScopedNodes()).toEqual([
        spanA.current,
        divA.current,
        spanB.current,
        divB.current,
      ]);
      expect(refB.current.getParent()).toBe(null);
      expect(refA.current.getParent()).toBe(null);
    });

    it('getChildren() works as intended', () => {
      const TestScope = React.unstable_createScope((type, props) => true);
      const TestScope2 = React.unstable_createScope((type, props) => true);
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
