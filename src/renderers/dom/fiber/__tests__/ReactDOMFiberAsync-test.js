var React = require('react');
var ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
var ReactFeatureFlags = require('ReactFeatureFlags');

var ReactDOM;

var AsyncComponent = React.unstable_AsyncComponent;

describe('ReactDOMFiberAsync', () => {
  var container;

  beforeEach(() => {
    container = document.createElement('div');
    ReactDOM = require('react-dom');
  });

  it('renders synchronously by default', () => {
    var ops = [];
    ReactDOM.render(<div>Hi</div>, container, () => {
      ops.push(container.textContent);
    });
    ReactDOM.render(<div>Bye</div>, container, () => {
      ops.push(container.textContent);
    });
    expect(ops).toEqual(['Hi', 'Bye']);
  });

  if (ReactDOMFeatureFlags.useFiber) {
    it('renders synchronously when feature flag is disabled', () => {
      ReactDOM.render(
        <AsyncComponent><div>Hi</div></AsyncComponent>,
        container,
      );
      expect(container.textContent).toEqual('Hi');

      ReactDOM.render(
        <AsyncComponent><div>Bye</div></AsyncComponent>,
        container,
      );
      expect(container.textContent).toEqual('Bye');
    });

    describe('with feature flag enabled', () => {
      beforeEach(() => {
        jest.resetModules();
        ReactFeatureFlags = require('ReactFeatureFlags');
        container = document.createElement('div');
        ReactFeatureFlags.enableAsyncSubtreeAPI = true;
        ReactDOM = require('react-dom');
      });

      it('AsyncComponent at the root makes the entire tree async', () => {
        ReactDOM.render(
          <AsyncComponent><div>Hi</div></AsyncComponent>,
          container,
        );
        expect(container.textContent).toEqual('');
        jest.runAllTimers();
        expect(container.textContent).toEqual('Hi');

        ReactDOM.render(
          <AsyncComponent><div>Bye</div></AsyncComponent>,
          container,
        );
        expect(container.textContent).toEqual('Hi');
        jest.runAllTimers();
        expect(container.textContent).toEqual('Bye');
      });

      it('updates inside an async tree are async by default', () => {
        let instance;
        class Component extends React.Component {
          state = {step: 0};
          render() {
            instance = this;
            return <div>{this.state.step}</div>;
          }
        }

        ReactDOM.render(
          <AsyncComponent><Component /></AsyncComponent>,
          container,
        );
        expect(container.textContent).toEqual('');
        jest.runAllTimers();
        expect(container.textContent).toEqual('0');

        instance.setState({step: 1});
        expect(container.textContent).toEqual('0');
        jest.runAllTimers();
        expect(container.textContent).toEqual('1');
      });

      it('AsyncComponent creates an async subtree', () => {
        let instance;
        class Component extends React.unstable_AsyncComponent {
          state = {step: 0};
          render() {
            instance = this;
            return <div>{this.state.step}</div>;
          }
        }

        ReactDOM.render(<div><Component /></div>, container);
        jest.runAllTimers();

        instance.setState({step: 1});
        expect(container.textContent).toEqual('0');
        jest.runAllTimers();
        expect(container.textContent).toEqual('1');
      });

      it('updates inside an async subtree are async by default', () => {
        class Component extends React.unstable_AsyncComponent {
          render() {
            return <Child />;
          }
        }

        let instance;
        class Child extends React.Component {
          state = {step: 0};
          render() {
            instance = this;
            return <div>{this.state.step}</div>;
          }
        }

        ReactDOM.render(<div><Component /></div>, container);
        jest.runAllTimers();

        instance.setState({step: 1});
        expect(container.textContent).toEqual('0');
        jest.runAllTimers();
        expect(container.textContent).toEqual('1');
      });
    });
  }
});
