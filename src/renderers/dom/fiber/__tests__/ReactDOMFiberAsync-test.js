var React = require('react');
var ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');

var ReactDOM;

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
    it('throws when calling async APIs when feature flag is disabled', () => {
      expect(() => {
        ReactDOM.unstable_asyncRender(<div>Hi</div>, container);
      }).toThrow('ReactDOM.unstable_asyncRender is not a function');
    });

    describe('with feature flag enabled', () => {
      beforeEach(() => {
        jest.resetModules();
        ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
        container = document.createElement('div');
        ReactDOMFeatureFlags.enableAsyncSubtreeAPI = true;
        ReactDOM = require('react-dom');
      });

      it('unstable_asyncRender creates an async tree', () => {
        ReactDOM.unstable_asyncRender(<div>Hi</div>, container);
        expect(container.textContent).toEqual('');
        jest.runAllTimers();
        expect(container.textContent).toEqual('Hi');

        ReactDOM.unstable_asyncRender(<div>Bye</div>, container);
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

        ReactDOM.unstable_asyncRender(<Component />, container);
        expect(container.textContent).toEqual('');
        jest.runAllTimers();
        expect(container.textContent).toEqual('0');

        instance.setState({step: 1});
        expect(container.textContent).toEqual('0');
        jest.runAllTimers();
        expect(container.textContent).toEqual('1');
      });

      it('unstable_asyncUpdates creates an async subtree', () => {
        let instance;
        class Component extends React.Component {
          state = {step: 0};
          unstable_asyncUpdates = true;
          render() {
            instance = this;
            return <div>{this.state.step}</div>;
          }
        }

        ReactDOM.render(<Component />, container);
        jest.runAllTimers();

        instance.setState({step: 1});
        expect(container.textContent).toEqual('0');
        jest.runAllTimers();
        expect(container.textContent).toEqual('1');
      });

      it('updates inside an async subtree are async by default', () => {
        class Component extends React.Component {
          unstable_asyncUpdates = true;
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

        ReactDOM.render(<Component />, container);
        jest.runAllTimers();

        instance.setState({step: 1});
        expect(container.textContent).toEqual('0');
        jest.runAllTimers();
        expect(container.textContent).toEqual('1');
      })
    });
  }
});
