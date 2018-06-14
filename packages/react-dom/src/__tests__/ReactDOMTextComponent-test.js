/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;
let ReactDOMServer;

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
  });

  it('updates a mounted text component in place', () => {
    const el = document.createElement('div');
    let inst = ReactDOM.render(
      <div>
        <span />
        {'foo'}
        {'bar'}
      </div>,
      el,
    );
    let nodes = filterOutComments(inst.childNodes);

    let foo = nodes[1];
    let bar = nodes[2];
    expect(foo.data).toBe('foo');
    expect(bar.data).toBe('bar');

    inst = ReactDOM.render(
      <div>
        <span />
        {'baz'}
        {'qux'}
      </div>,
      el,
    );
    // After the update, the text nodes should have stayed in place (as opposed
    // to getting unmounted and remounted)
    nodes = filterOutComments(inst.childNodes);
    expect(nodes[1]).toBe(foo);
    expect(nodes[2]).toBe(bar);
    expect(foo.data).toBe('baz');
    expect(bar.data).toBe('qux');
  });

  it('can be toggled in and out of the markup', () => {
    const el = document.createElement('div');
    let inst = ReactDOM.render(
      <div>
        {'foo'}
        <div />
        {'bar'}
      </div>,
      el,
    );

    let childNodes = filterOutComments(inst.childNodes);
    let childDiv = childNodes[1];

    inst = ReactDOM.render(
      <div>
        {null}
        <div />
        {null}
      </div>,
      el,
    );
    childNodes = filterOutComments(inst.childNodes);
    expect(childNodes.length).toBe(1);
    expect(childNodes[0]).toBe(childDiv);

    inst = ReactDOM.render(
      <div>
        {'foo'}
        <div />
        {'bar'}
      </div>,
      el,
    );
    childNodes = filterOutComments(inst.childNodes);
    expect(childNodes.length).toBe(3);
    expect(childNodes[0].data).toBe('foo');
    expect(childNodes[1]).toBe(childDiv);
    expect(childNodes[2].data).toBe('bar');
  });

  /**
   * The following Node.normalize() tests are intentionally failing.
   * See #9836 tracking whether we'll need to fix this or if it's unnecessary.
   */

  xit('can reconcile text merged by Node.normalize() alongside other elements', () => {
    const el = document.createElement('div');
    let inst = ReactDOM.render(
      <div>
        {'foo'}
        {'bar'}
        {'baz'}
        <span />
        {'qux'}
      </div>,
      el,
    );

    inst.normalize();

    inst = ReactDOM.render(
      <div>
        {'bar'}
        {'baz'}
        {'qux'}
        <span />
        {'foo'}
      </div>,
      el,
    );
    expect(inst.textContent).toBe('barbazquxfoo');
  });

  xit('can reconcile text merged by Node.normalize()', () => {
    const el = document.createElement('div');
    let inst = ReactDOM.render(
      <div>
        {'foo'}
        {'bar'}
        {'baz'}
      </div>,
      el,
    );

    inst.normalize();

    inst = ReactDOM.render(
      <div>
        {'bar'}
        {'baz'}
        {'qux'}
      </div>,
      el,
    );
    expect(inst.textContent).toBe('barbazqux');
  });

  it('can reconcile text from pre-rendered markup', () => {
    const el = document.createElement('div');
    let reactEl = (
      <div>
        {'foo'}
        {'bar'}
        {'baz'}
      </div>
    );
    el.innerHTML = ReactDOMServer.renderToString(reactEl);

    ReactDOM.hydrate(reactEl, el);
    expect(el.textContent).toBe('foobarbaz');

    ReactDOM.unmountComponentAtNode(el);

    reactEl = (
      <div>
        {''}
        {''}
        {''}
      </div>
    );
    el.innerHTML = ReactDOMServer.renderToString(reactEl);

    ReactDOM.hydrate(reactEl, el);
    expect(el.textContent).toBe('');
  });

  xit('can reconcile text arbitrarily split into multiple nodes', () => {
    const el = document.createElement('div');
    let inst = ReactDOM.render(
      <div>
        <span />
        {'foobarbaz'}
      </div>,
      el,
    );

    let childNodes = filterOutComments(inst.childNodes);
    let textNode = childNodes[1];
    textNode.textContent = 'foo';
    inst.insertBefore(
      document.createTextNode('bar'),
      childNodes[1].nextSibling,
    );
    inst.insertBefore(
      document.createTextNode('baz'),
      childNodes[1].nextSibling,
    );

    inst = ReactDOM.render(
      <div>
        <span />
        {'barbazqux'}
      </div>,
      el,
    );
    expect(inst.textContent).toBe('barbazqux');
  });

  xit('can reconcile text arbitrarily split into multiple nodes on some substitutions only', () => {
    const el = document.createElement('div');
    let inst = ReactDOM.render(
      <div>
        <span />
        {'bar'}
        <span />
        {'foobarbaz'}
        {'foo'}
        {'barfoo'}
        <span />
      </div>,
      el,
    );

    let childNodes = filterOutComments(inst.childNodes);
    let textNode = childNodes[3];
    textNode.textContent = 'foo';
    inst.insertBefore(
      document.createTextNode('bar'),
      childNodes[3].nextSibling,
    );
    inst.insertBefore(
      document.createTextNode('baz'),
      childNodes[3].nextSibling,
    );
    let secondTextNode = childNodes[5];
    secondTextNode.textContent = 'bar';
    inst.insertBefore(
      document.createTextNode('foo'),
      childNodes[5].nextSibling,
    );

    inst = ReactDOM.render(
      <div>
        <span />
        {'baz'}
        <span />
        {'barbazqux'}
        {'bar'}
        {'bazbar'}
        <span />
      </div>,
      el,
    );
    expect(inst.textContent).toBe('bazbarbazquxbarbazbar');
  });

  xit('can unmount normalized text nodes', () => {
    const el = document.createElement('div');
    ReactDOM.render(
      <div>
        {''}
        {'foo'}
        {'bar'}
      </div>,
      el,
    );
    el.normalize();
    ReactDOM.render(<div />, el);
    expect(el.innerHTML).toBe('<div></div>');
  });
});
