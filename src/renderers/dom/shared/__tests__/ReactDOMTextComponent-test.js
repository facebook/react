/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactDOM;
var ReactDOMServer;

describe('ReactDOMTextComponent', () => {
  beforeEach(() => {
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactDOMServer = require('ReactDOMServer');
  });

  it('updates a mounted text component in place', () => {
    var el = document.createElement('div');
    var inst = ReactDOM.render(<div><span />{'foo'}{'bar'}</div>, el);

    var foo = ReactDOM.findDOMNode(inst).childNodes[2];
    var bar = ReactDOM.findDOMNode(inst).childNodes[5];
    expect(foo.data).toBe('foo');
    expect(bar.data).toBe('bar');

    inst = ReactDOM.render(<div><span />{'baz'}{'qux'}</div>, el);
    // After the update, the text nodes should have stayed in place (as opposed
    // to getting unmounted and remounted)
    expect(ReactDOM.findDOMNode(inst).childNodes[2]).toBe(foo);
    expect(ReactDOM.findDOMNode(inst).childNodes[5]).toBe(bar);
    expect(foo.data).toBe('baz');
    expect(bar.data).toBe('qux');
  });

  it('can be toggled in and out of the markup', () => {
    var el = document.createElement('div');
    var inst = ReactDOM.render(<div>{'foo'}<div />{'bar'}</div>, el);

    var container = ReactDOM.findDOMNode(inst);
    var childDiv = container.childNodes[3];
    var childNodes;

    inst = ReactDOM.render(<div>{null}<div />{null}</div>, el);
    container = ReactDOM.findDOMNode(inst);
    childNodes = container.childNodes;
    expect(childNodes.length).toBe(1);
    expect(childNodes[0]).toBe(childDiv);

    inst = ReactDOM.render(<div>{'foo'}<div />{'bar'}</div>, el);
    container = ReactDOM.findDOMNode(inst);
    childNodes = container.childNodes;
    expect(childNodes.length).toBe(7);
    expect(childNodes[1].data).toBe('foo');
    expect(childNodes[3]).toBe(childDiv);
    expect(childNodes[5].data).toBe('bar');
  });

  it('can reconcile text merged by Node.normalize()', () => {
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

    ReactDOM.render(reactEl, el);
    expect(el.textContent).toBe('foobarbaz');

    reactEl = <div>{''}{''}{''}</div>;
    el.innerHTML = ReactDOMServer.renderToString(reactEl);

    ReactDOM.render(reactEl, el);
    expect(el.textContent).toBe('');
  });

  it('can reconcile text arbitrarily split into multiple nodes', () => {
    var el = document.createElement('div');
    var inst = ReactDOM.render(<div><span />{'foobarbaz'}</div>, el);

    var container = ReactDOM.findDOMNode(inst);
    var childNodes = container.childNodes;
    var textNode = childNodes[2];
    textNode.textContent = 'foo';
    container.insertBefore(document.createTextNode('bar'), childNodes[3]);
    container.insertBefore(document.createTextNode('baz'), childNodes[3]);

    inst = ReactDOM.render(<div><span />{'barbazqux'}</div>, el);
    container = ReactDOM.findDOMNode(inst);
    expect(container.textContent).toBe('barbazqux');
  });
});
