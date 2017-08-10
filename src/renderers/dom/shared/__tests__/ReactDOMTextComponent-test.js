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

var React;
var ReactDOM;
var ReactDOMServer;
var ReactDOMFeatureFlags;

// In standard React, TextComponent keeps track of different Text templates
// using comments. However, in React Fiber, those comments are not outputted due
// to the way Fiber keeps track of the templates.
// This function "Normalizes" childNodes lists to avoid the presence of comments
// and make the child list identical in standard React and Fiber
function filterOutComments(nodeList) {
  return [].slice.call(nodeList).filter(node => !(node instanceof Comment));
}

describe('ReactDOMTextComponent', () => {
  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
    ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
  });

  it('updates a mounted text component in place', () => {
    var el = document.createElement('div');
    var inst = ReactDOM.render(<div><span />{'foo'}{'bar'}</div>, el);
    let nodes = filterOutComments(ReactDOM.findDOMNode(inst).childNodes);

    let foo = nodes[1];
    let bar = nodes[2];
    expect(foo.data).toBe('foo');
    expect(bar.data).toBe('bar');

    inst = ReactDOM.render(<div><span />{'baz'}{'qux'}</div>, el);
    // After the update, the text nodes should have stayed in place (as opposed
    // to getting unmounted and remounted)
    nodes = filterOutComments(ReactDOM.findDOMNode(inst).childNodes);
    expect(nodes[1]).toBe(foo);
    expect(nodes[2]).toBe(bar);
    expect(foo.data).toBe('baz');
    expect(bar.data).toBe('qux');
  });

  it('can be toggled in and out of the markup', () => {
    var el = document.createElement('div');
    var inst = ReactDOM.render(<div>{'foo'}<div />{'bar'}</div>, el);

    var container = ReactDOM.findDOMNode(inst);
    let childNodes = filterOutComments(container.childNodes);
    let childDiv = childNodes[1];

    inst = ReactDOM.render(<div>{null}<div />{null}</div>, el);
    container = ReactDOM.findDOMNode(inst);
    childNodes = filterOutComments(container.childNodes);
    expect(childNodes.length).toBe(1);
    expect(childNodes[0]).toBe(childDiv);

    inst = ReactDOM.render(<div>{'foo'}<div />{'bar'}</div>, el);
    container = ReactDOM.findDOMNode(inst);
    childNodes = filterOutComments(container.childNodes);
    expect(childNodes.length).toBe(3);
    expect(childNodes[0].data).toBe('foo');
    expect(childNodes[1]).toBe(childDiv);
    expect(childNodes[2].data).toBe('bar');
  });

  /**
   * The following Node.normalize() tests are intentionally failing.
   * See #9836 tracking whether we'll need to fix this or if it's unnecessary.
   */

  xit(
    'can reconcile text merged by Node.normalize() alongside other elements',
    () => {
      var el = document.createElement('div');
      var inst = ReactDOM.render(
        <div>{'foo'}{'bar'}{'baz'}<span />{'qux'}</div>,
        el,
      );

      var container = ReactDOM.findDOMNode(inst);
      container.normalize();

      inst = ReactDOM.render(
        <div>{'bar'}{'baz'}{'qux'}<span />{'foo'}</div>,
        el,
      );
      container = ReactDOM.findDOMNode(inst);
      expect(container.textContent).toBe('barbazquxfoo');
    },
  );

  xit('can reconcile text merged by Node.normalize()', () => {
    var el = document.createElement('div');
    var inst = ReactDOM.render(<div>{'foo'}{'bar'}{'baz'}</div>, el);

    var container = ReactDOM.findDOMNode(inst);
    container.normalize();

    inst = ReactDOM.render(<div>{'bar'}{'baz'}{'qux'}</div>, el);
    container = ReactDOM.findDOMNode(inst);
    expect(container.textContent).toBe('barbazqux');
  });

  it('can reconcile text from pre-rendered markup', () => {
    var el = document.createElement('div');
    var reactEl = <div>{'foo'}{'bar'}{'baz'}</div>;
    el.innerHTML = ReactDOMServer.renderToString(reactEl);

    if (ReactDOMFeatureFlags.useFiber) {
      ReactDOM.hydrate(reactEl, el);
    } else {
      ReactDOM.render(reactEl, el);
    }
    expect(el.textContent).toBe('foobarbaz');

    ReactDOM.unmountComponentAtNode(el);

    reactEl = <div>{''}{''}{''}</div>;
    el.innerHTML = ReactDOMServer.renderToString(reactEl);

    if (ReactDOMFeatureFlags.useFiber) {
      ReactDOM.hydrate(reactEl, el);
    } else {
      ReactDOM.render(reactEl, el);
    }
    expect(el.textContent).toBe('');
  });

  xit('can reconcile text arbitrarily split into multiple nodes', () => {
    var el = document.createElement('div');
    var inst = ReactDOM.render(<div><span />{'foobarbaz'}</div>, el);

    var container = ReactDOM.findDOMNode(inst);
    let childNodes = filterOutComments(ReactDOM.findDOMNode(inst).childNodes);
    let textNode = childNodes[1];
    textNode.textContent = 'foo';
    container.insertBefore(
      document.createTextNode('bar'),
      childNodes[1].nextSibling,
    );
    container.insertBefore(
      document.createTextNode('baz'),
      childNodes[1].nextSibling,
    );

    inst = ReactDOM.render(<div><span />{'barbazqux'}</div>, el);
    container = ReactDOM.findDOMNode(inst);
    expect(container.textContent).toBe('barbazqux');
  });

  xit(
    'can reconcile text arbitrarily split into multiple nodes on some substitutions only',
    () => {
      var el = document.createElement('div');
      var inst = ReactDOM.render(
        <div>
          <span />{'bar'}<span />{'foobarbaz'}{'foo'}{'barfoo'}<span />
        </div>,
        el,
      );

      var container = ReactDOM.findDOMNode(inst);
      let childNodes = filterOutComments(ReactDOM.findDOMNode(inst).childNodes);
      let textNode = childNodes[3];
      textNode.textContent = 'foo';
      container.insertBefore(
        document.createTextNode('bar'),
        childNodes[3].nextSibling,
      );
      container.insertBefore(
        document.createTextNode('baz'),
        childNodes[3].nextSibling,
      );
      let secondTextNode = childNodes[5];
      secondTextNode.textContent = 'bar';
      container.insertBefore(
        document.createTextNode('foo'),
        childNodes[5].nextSibling,
      );

      inst = ReactDOM.render(
        <div>
          <span />{'baz'}<span />{'barbazqux'}{'bar'}{'bazbar'}<span />
        </div>,
        el,
      );
      container = ReactDOM.findDOMNode(inst);
      expect(container.textContent).toBe('bazbarbazquxbarbazbar');
    },
  );

  xit('can unmount normalized text nodes', () => {
    var el = document.createElement('div');
    ReactDOM.render(<div>{''}{'foo'}{'bar'}</div>, el);
    el.normalize();
    ReactDOM.render(<div />, el);
    expect(el.innerHTML).toBe('<div></div>');
  });
});
