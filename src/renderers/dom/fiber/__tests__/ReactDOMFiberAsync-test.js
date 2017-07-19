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

      it('activeUpdates batches sync updates and flushes them at the end of the batch', () => {
        let ops = [];
        let instance;

        class Component extends React.Component {
          state = {text: ''};
          push(val) {
            this.setState(state => ({text: state.text + val}));
          }
          componentDidUpdate() {
            ops.push(this.state.text);
          }
          render() {
            instance = this;
            return <span>{this.state.text}</span>;
          }
        }

        ReactDOM.render(<Component />, container);

        instance.push('A');
        expect(ops).toEqual(['A']);
        expect(container.textContent).toEqual('A');

        ReactDOM.activeUpdates(() => {
          instance.push('B');
          instance.push('C');
          // Not flushed yet
          expect(container.textContent).toEqual('A');
          expect(ops).toEqual(['A']);
        });
        expect(container.textContent).toEqual('ABC');
        expect(ops).toEqual(['A', 'ABC']);
        instance.push('D');
        expect(container.textContent).toEqual('ABCD');
        expect(ops).toEqual(['A', 'ABC', 'ABCD']);
      });

      it('activeUpdates flushes updates even if nested inside another activeUpdates', () => {
        let ops = [];
        let instance;

        class Component extends React.Component {
          state = {text: ''};
          push(val) {
            this.setState(state => ({text: state.text + val}));
          }
          componentDidUpdate() {
            ops.push(this.state.text);
          }
          render() {
            instance = this;
            return <span>{this.state.text}</span>;
          }
        }

        ReactDOM.render(<Component />, container);

        instance.push('A');
        expect(ops).toEqual(['A']);
        expect(container.textContent).toEqual('A');

        ReactDOM.activeUpdates(() => {
          instance.push('B');
          instance.push('C');
          // Not flushed yet
          expect(container.textContent).toEqual('A');
          expect(ops).toEqual(['A']);

          ReactDOM.activeUpdates(() => {
            instance.push('D');
          });
          // The nested activeUpdates caused everything to flush.
          expect(container.textContent).toEqual('ABCD');
          expect(ops).toEqual(['A', 'ABCD']);
        });
        expect(container.textContent).toEqual('ABCD');
        expect(ops).toEqual(['A', 'ABCD']);
      });

      it('activeUpdates does not create a nested update', () => {
        let ops = [];

        class Component extends React.Component {
          state = {text: ''};
          push(val) {
            this.setState(state => ({text: state.text + val}));
          }
          componentDidMount() {
            ReactDOM.activeUpdates(() => {
              this.push('A');
              this.push('B');
              this.push('C');
            });
            // Not flushed yet
            expect(container.textContent).toEqual('');
            expect(ops).toEqual([]);
          }
          componentDidUpdate() {
            ops.push(this.state.text);
          }
          render() {
            return <span>{this.state.text}</span>;
          }
        }

        ReactDOM.render(<Component />, container);

        expect(container.textContent).toEqual('ABC');
        expect(ops).toEqual(['ABC']);
      });

      it('activeUpdates flushes updates before end of the tick', () => {
        let ops = [];
        let instance;

        class Component extends React.Component {
          state = {text: ''};
          push(val) {
            this.setState(state => ({text: state.text + val}));
          }
          componentDidUpdate() {
            ops.push(this.state.text);
          }
          render() {
            instance = this;
            return <span>{this.state.text}</span>;
          }
        }

        class AsyncWrapper extends React.Component {
          static unstable_asyncUpdates = true;
          render() {
            return this.props.children;
          }
        }

        ReactDOM.render(<AsyncWrapper><Component /></AsyncWrapper>, container);
        jest.runAllTimers();

        // Updates are async by default
        instance.push('A');
        expect(ops).toEqual([]);
        expect(container.textContent).toEqual('');

        ReactDOM.activeUpdates(() => {
          instance.push('B');
          instance.push('C');
          // Not flushed yet
          expect(container.textContent).toEqual('');
          expect(ops).toEqual([]);
        });
        // Only the active updates have flushed
        expect(container.textContent).toEqual('BC');
        expect(ops).toEqual(['BC']);

        instance.push('D');
        expect(container.textContent).toEqual('BC');
        expect(ops).toEqual(['BC']);

        // Flush the async updates
        jest.runAllTimers();
        expect(container.textContent).toEqual('BCAD');
        expect(ops).toEqual(['BC', 'BCAD']);
      });
    });
  }
});
