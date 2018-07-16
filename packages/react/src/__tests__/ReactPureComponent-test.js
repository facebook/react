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

describe('ReactPureComponent', () => {
  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
  });

  it('should render', () => {
    let renders = 0;
    class Component extends React.PureComponent {
      constructor() {
        super();
        this.state = {type: 'mushrooms'};
      }
      render() {
        renders++;
        return <div>{this.props.text[0]}</div>;
      }
    }

    const container = document.createElement('div');
    let text;
    let component;

    text = ['porcini'];
    component = ReactDOM.render(<Component text={text} />, container);
    expect(container.textContent).toBe('porcini');
    expect(renders).toBe(1);

    text = ['morel'];
    component = ReactDOM.render(<Component text={text} />, container);
    expect(container.textContent).toBe('morel');
    expect(renders).toBe(2);

    text[0] = 'portobello';
    component = ReactDOM.render(<Component text={text} />, container);
    expect(container.textContent).toBe('morel');
    expect(renders).toBe(2);

    // Setting state without changing it doesn't cause a rerender.
    component.setState({type: 'mushrooms'});
    expect(container.textContent).toBe('morel');
    expect(renders).toBe(2);

    // But changing state does.
    component.setState({type: 'portobello mushrooms'});
    expect(container.textContent).toBe('portobello');
    expect(renders).toBe(3);
  });

  it('can override shouldComponentUpdate', () => {
    let renders = 0;
    class Component extends React.PureComponent {
      render() {
        renders++;
        return <div />;
      }
      shouldComponentUpdate() {
        return true;
      }
    }

    const container = document.createElement('div');
    expect(() => ReactDOM.render(<Component />, container)).toWarnDev(
      'Warning: ' +
        'Component has a method called shouldComponentUpdate(). ' +
        'shouldComponentUpdate should not be used when extending React.PureComponent. ' +
        'Please extend React.Component if shouldComponentUpdate is used.',
      {withoutStack: true},
    );
    ReactDOM.render(<Component />, container);
    expect(renders).toBe(2);
  });

  it('extends React.Component', () => {
    let renders = 0;
    class Component extends React.PureComponent {
      render() {
        expect(this instanceof React.Component).toBe(true);
        expect(this instanceof React.PureComponent).toBe(true);
        renders++;
        return <div />;
      }
    }
    ReactDOM.render(<Component />, document.createElement('div'));
    expect(renders).toBe(1);
  });

  it('should warn when shouldComponentUpdate is defined on React.PureComponent', () => {
    class PureComponent extends React.PureComponent {
      shouldComponentUpdate() {
        return true;
      }
      render() {
        return <div />;
      }
    }
    const container = document.createElement('div');
    expect(() => ReactDOM.render(<PureComponent />, container)).toWarnDev(
      'Warning: ' +
        'PureComponent has a method called shouldComponentUpdate(). ' +
        'shouldComponentUpdate should not be used when extending React.PureComponent. ' +
        'Please extend React.Component if shouldComponentUpdate is used.',
      {withoutStack: true},
    );
  });
});
