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
  let React;
  let ReactDOM;
  let ReactDOMServer;

  function renderMarkupIntoDocument(elt) {
    const container = document.createElement('div');
    // Force server-rendering path:
    container.innerHTML = ReactDOMServer.renderToString(elt);
    return ReactDOM.hydrate(elt, container);
  }

  function getTypeOf(instance) {
    return instance.type;
  }

  function getTextOf(instance) {
    return instance.memoizedProps;
  }

  function getInstanceFromNode(node) {
    const instanceKey = Object
        .keys(node)
        .find(key => key.startsWith('__reactInternalInstance$'));
    return node[instanceKey];
  }

  function getFiberPropsFromNode(node) {
    const props = Object
        .keys(node)
        .find(key => key.startsWith('__reactEventHandlers$'));
    return node[props];
  }

  function simulateInput(elem, value) {
    const inputEvent = document.createEvent('Event');
    inputEvent.initEvent('input', true, true);
    setUntrackedInputValue.call(elem, value);
    elem.dispatchEvent(inputEvent);
  }

  function simulateClick(elem) {
    const event = new MouseEvent('click', {
      bubbles: true,
    });
    elem.dispatchEvent(event);
  }

  const setUntrackedInputValue = Object
    .getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    ).set;

  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
    document.innerHTML = '';
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
      const inst = renderMarkupIntoDocument(<Component toRef={toRef} />);
      return inst.refs.target.nodeName;
    }

    expect(renderAndGetRef('div')).toBe('DIV');
    expect(renderAndGetRef('h1')).toBe('H1');
    expect(renderAndGetRef('p')).toBe('P');
    expect(renderAndGetRef('input')).toBe('INPUT');
  });

  it('finds closest instance for node when an event happens', done => {
    const elemID = 'aID';
    const innerHTML = {__html: `<div id="${elemID}"></div>`}

    class ClosestInstance extends React.Component {
      id = 'closestInstance'
      _onClick = e => {
        const node = e.currentTarget;
        const instance = getInstanceFromNode(node);
        expect(instance).toBeDefined();
        expect(getTypeOf(instance)).toBe('div')
        expect(node.id).toBe(this.id);
        done();
      }
      render() {
        return (
          <div
            id="closestInstance"
            onClick={this._onClick}
            dangerouslySetInnerHTML={innerHTML}>
          </div>
        );
      }
    }

    const component = <ClosestInstance />;
    const container = document.createElement('div');
    ReactDOM.render(<section>{component}</section>, container);
    document.body.appendChild(container);
    simulateClick(document.getElementById(elemID));
  });

  it('finds instances for nodes when events happen', done => {
    const inputID = 'inputID';
    const startValue = 'start';
    const finishValue = 'finish';

    class Controlled extends React.Component {
      state = {value: startValue};
      a = null;
      _onChange = e => {
        const node = e.currentTarget;
        expect(node.value).toEqual(finishValue);
        const instance = getInstanceFromNode(node);
        expect(instance).toBeDefined();
        expect(getTypeOf(instance)).toBe('input')
        expect(node.id).toBe(inputID);
        done()
      }
      render() {
        return (
          <div>
            <input
              id={inputID}
              type="text"
              ref={n => (this.a = n)}
              value={this.state.value}
              onChange={this._onChange}
            />
          </div>
        );
      }
    }

    const component = <Controlled />;
    const container = document.createElement('div');
    const instance = ReactDOM.render(component, container);
    document.body.appendChild(container);
    simulateInput(instance.a, finishValue);
  });

  it('updates fiber props on changes', done => {
    const startValue = 'start';
    const finishValue = 'finish';

    class AnotherControlled extends React.Component {
      state = {value: startValue};
      a = null;
      _onChange = e => {
        const node = e.currentTarget;
        const props = getFiberPropsFromNode(node);
        expect(props.value).toBe(startValue);
        expect(node.value).toEqual(finishValue);
        this.setState({value: e.currentTarget.value}, () => {
          const updatedProps = getFiberPropsFromNode(node);
          expect(updatedProps.value).toBe(finishValue);
          done();
        });
      }
      render() {
        return (
          <div>
            <input
              type="text"
              ref={n => (this.a = n)}
              value={this.state.value}
              onChange={this._onChange}
            />
          </div>
        );
      }
    }

    const component = <AnotherControlled />;
    const container = document.createElement('div');
    const instance = ReactDOM.render(component, container);
    document.body.appendChild(container);
    simulateInput(instance.a, finishValue);
  });
});
