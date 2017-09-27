/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('ReactDOMComponentTree', () => {
  var React;
  var ReactDOM;
  var ReactDOMComponentTree;
  var ReactDOMServer;

  function renderMarkupIntoDocument(elt) {
    var container = document.createElement('div');
    // Force server-rendering path:
    container.innerHTML = ReactDOMServer.renderToString(elt);
    return ReactDOM.hydrate(elt, container);
  }

  function getTypeOf(instance) {
    if (typeof instance.tag === 'number') {
      return instance.type;
    }
    return instance._currentElement.type;
  }

  function getTextOf(instance) {
    if (typeof instance.tag === 'number') {
      return instance.memoizedProps;
    }
    return instance._stringText;
  }

  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
    // TODO: can we express this test with only public API?
    ReactDOMComponentTree = require('ReactDOMComponentTree');
    ReactDOMServer = require('react-dom/server');
  });

  it('finds nodes for instances', () => {
    // This is a little hard to test directly. But refs rely on it -- so we
    // check that we can find a ref at arbitrary points in the tree, even if
    // other nodes don't have a ref.
    class Component extends React.Component {
      render() {
        var toRef = this.props.toRef;
        return (
          <div ref={toRef === 'div' ? 'target' : null}>
            <h1 ref={toRef === 'h1' ? 'target' : null}>hello</h1>
            <p ref={toRef === 'p' ? 'target' : null}>
              <input ref={toRef === 'input' ? 'target' : null} />
            </p>
            goodbye.
          </div>
        );
      }
    }

    function renderAndGetRef(toRef) {
      var inst = renderMarkupIntoDocument(<Component toRef={toRef} />);
      return inst.refs.target.nodeName;
    }

    expect(renderAndGetRef('div')).toBe('DIV');
    expect(renderAndGetRef('h1')).toBe('H1');
    expect(renderAndGetRef('p')).toBe('P');
    expect(renderAndGetRef('input')).toBe('INPUT');
  });

  it('finds instances for nodes', () => {
    class Component extends React.Component {
      render() {
        return (
          <div>
            <h1>hello</h1>
            <p>
              <input />
            </p>
            goodbye.
            <main dangerouslySetInnerHTML={{__html: '<b><img></b>'}} />
          </div>
        );
      }
    }

    function renderAndQuery(sel) {
      var root = renderMarkupIntoDocument(<section><Component /></section>);
      return sel ? root.querySelector(sel) : root;
    }

    function renderAndGetInstance(sel) {
      return ReactDOMComponentTree.getInstanceFromNode(renderAndQuery(sel));
    }

    function renderAndGetClosest(sel) {
      return ReactDOMComponentTree.getClosestInstanceFromNode(
        renderAndQuery(sel),
      );
    }

    expect(getTypeOf(renderAndGetInstance(null))).toBe('section');
    expect(getTypeOf(renderAndGetInstance('div'))).toBe('div');
    expect(getTypeOf(renderAndGetInstance('h1'))).toBe('h1');
    expect(getTypeOf(renderAndGetInstance('p'))).toBe('p');
    expect(getTypeOf(renderAndGetInstance('input'))).toBe('input');
    expect(getTypeOf(renderAndGetInstance('main'))).toBe('main');

    // This one's a text component!
    var root = renderAndQuery(null);
    var inst = ReactDOMComponentTree.getInstanceFromNode(
      root.children[0].childNodes[2],
    );
    expect(getTextOf(inst)).toBe('goodbye.');

    expect(getTypeOf(renderAndGetClosest('b'))).toBe('main');
    expect(getTypeOf(renderAndGetClosest('img'))).toBe('main');
  });
});
