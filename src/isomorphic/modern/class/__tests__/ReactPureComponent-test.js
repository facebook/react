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

describe('ReactPureComponent', function() {
  beforeEach(function() {
    React = require('React');
    ReactDOM = require('ReactDOM');
  });

  it('should render', function() {
    var renders = 0;
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

    var container = document.createElement('div');
    var text;
    var component;

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

    // Setting state, even with the same values, causes a rerender.
    component.setState({type: 'mushrooms'});
    expect(container.textContent).toBe('portobello');
    expect(renders).toBe(3);
  });

  it('can override shouldComponentUpdate', function() {
    var renders = 0;
    class Component extends React.PureComponent {
      render() {
        renders++;
        return <div />;
      }
      shouldComponentUpdate() {
        return true;
      }
    }
    var container = document.createElement('div');
    ReactDOM.render(<Component />, container);
    ReactDOM.render(<Component />, container);
    expect(renders).toBe(2);
  });

  it('does not update functional components inside pure components', function() {
    // Multiple levels of host components and functional components; make sure
    // purity propagates down. So we render:
    //
    // <Impure>
    //   <Functional>
    //     <Functional>
    //       <Pure>
    //         <Functional>
    //           <Functional>
    //
    // with some host wrappers in between. The render code is a little
    // convoluted because we want to make the props scalar-equal as long as
    // `text` (threaded through the whole tree) is. The outer two Functional
    // components should always rerender; the inner Functional components should
    // only rerender if `text` changes to a different object.

    var impureRenders = 0;
    var pureRenders = 0;
    var functionalRenders = 0;

    var pureComponent;
    class Impure extends React.Component {
      render() {
        impureRenders++;
        return (
          <div>
            {/* These props will always be shallow-equal. */}
            <Functional
              depth={2}
              thenRender="pureComponent"
              text={this.props.text}
            />
          </div>
        );
      }
    }
    class Pure extends React.PureComponent {
      render() {
        pureComponent = this;
        pureRenders++;
        return (
          <div>
            <Functional
              depth={2}
              thenRender="text"
              text={this.props.text}
            />
          </div>
        );
      }
    }
    function Functional(props) {
      functionalRenders++;
      if (props.depth <= 1) {
        return (
          <div>
            {props.prefix}
            {props.thenRender === 'pureComponent' ?
              [props.text[0] + '/', <Pure key="pure" text={props.text} />] :
              props.text[0]}
          </div>
        );
      } else {
        return (
          <div>
            <Functional
              {...props}
              depth={props.depth - 1}
            />
          </div>
        );
      }
    }

    var container = document.createElement('div');
    var text;

    text = ['porcini'];
    ReactDOM.render(<Impure text={text} />, container);
    expect(container.textContent).toBe('porcini/porcini');
    expect(impureRenders).toBe(1);
    expect(pureRenders).toBe(1);
    expect(functionalRenders).toBe(4);

    text = ['morel'];
    ReactDOM.render(<Impure text={text} />, container);
    expect(container.textContent).toBe('morel/morel');
    expect(impureRenders).toBe(2);
    expect(pureRenders).toBe(2);
    expect(functionalRenders).toBe(8);

    text[0] = 'portobello';
    ReactDOM.render(<Impure text={text} />, container);
    // Updates happen down and stop at the pure component
    expect(container.textContent).toBe('portobello/morel');
    expect(impureRenders).toBe(3);
    expect(pureRenders).toBe(2);
    expect(functionalRenders).toBe(10);

    // Forcing the pure component to update makes it rerender, but its
    // functional children still don't.
    pureComponent.forceUpdate();
    expect(container.textContent).toBe('portobello/morel');
    expect(impureRenders).toBe(3);
    expect(pureRenders).toBe(3);
    expect(functionalRenders).toBe(10);
  });

});
