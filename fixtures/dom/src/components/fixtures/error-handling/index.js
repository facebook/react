import FixtureSet from '../../FixtureSet';
import TestCase from '../../TestCase';

const React = window.React;
const ReactDOM = window.ReactDOM;

function BadRender(props) {
  props.doThrow();
}
class ErrorBoundary extends React.Component {
  static defaultProps = {
    buttonText: 'Trigger error',
  };
  state = {
    shouldThrow: false,
    didThrow: false,
    error: null,
  };
  componentDidCatch(error) {
    this.setState({error, didThrow: true});
  }
  triggerError = () => {
    this.setState({
      shouldThrow: true,
    });
  };
  render() {
    if (this.state.didThrow) {
      if (this.state.error) {
        return <p>Captured an error: {this.state.error.message}</p>;
      } else {
        return <p>Captured an error: {'' + this.state.error}</p>;
      }
    }
    if (this.state.shouldThrow) {
      return <BadRender doThrow={this.props.doThrow} />;
    }
    return <button onClick={this.triggerError}>{this.props.buttonText}</button>;
  }
}
class Example extends React.Component {
  state = {key: 0};
  restart = () => {
    this.setState(state => ({key: state.key + 1}));
  };
  render() {
    return (
      <div>
        <button onClick={this.restart}>Reset</button>
        <ErrorBoundary
          buttonText={this.props.buttonText}
          doThrow={this.props.doThrow}
          key={this.state.key}
        />
      </div>
    );
  }
}

class TriggerErrorAndCatch extends React.Component {
  container = document.createElement('div');

  triggerErrorAndCatch = () => {
    try {
      ReactDOM.flushSync(() => {
        ReactDOM.render(
          <BadRender
            doThrow={() => {
              throw new Error('Caught error');
            }}
          />,
          this.container
        );
      });
    } catch (e) {}
  };

  render() {
    return (
      <button onClick={this.triggerErrorAndCatch}>
        Trigger error and catch
      </button>
    );
  }
}

export default class ErrorHandlingTestCases extends React.Component {
  render() {
    return (
      <FixtureSet title="Error handling" description="">
        <TestCase
          title="Break on uncaught exceptions"
          description="In DEV, errors should be treated as uncaught, even though React catches them internally">
          <TestCase.Steps>
            <li>Open the browser DevTools</li>
            <li>Make sure "Pause on exceptions" is enabled</li>
            <li>Make sure "Pause on caught exceptions" is disabled</li>
            <li>Click the "Trigger error" button</li>
            <li>Click the reset button</li>
          </TestCase.Steps>
          <TestCase.ExpectedResult>
            The DevTools should pause at the line where the error was thrown, in
            the BadRender component. After resuming, the "Trigger error" button
            should be replaced with "Captured an error: Oops!" Clicking reset
            should reset the test case.
          </TestCase.ExpectedResult>
          <Example
            doThrow={() => {
              throw new Error('Oops!');
            }}
          />
        </TestCase>
        <TestCase title="Throwing null" description="">
          <TestCase.Steps>
            <li>Click the "Trigger error" button</li>
            <li>Click the reset button</li>
          </TestCase.Steps>
          <TestCase.ExpectedResult>
            The "Trigger error" button should be replaced with "Captured an
            error: null". Clicking reset should reset the test case.
          </TestCase.ExpectedResult>
          <Example
            doThrow={() => {
              throw null; // eslint-disable-line no-throw-literal
            }}
          />
        </TestCase>
        <TestCase
          title="Cross-origin errors (development mode only)"
          description="">
          <TestCase.Steps>
            <li>Click the "Trigger cross-origin error" button</li>
            <li>Click the reset button</li>
          </TestCase.Steps>
          <TestCase.ExpectedResult>
            The "Trigger error" button should be replaced with "Captured an
            error: A cross-origin error was thrown [...]". The actual error message should
            be logged to the console: "Uncaught Error: Expected true to
            be false".
          </TestCase.ExpectedResult>
          <Example
            buttonText="Trigger cross-origin error"
            doThrow={() => {
              // The `expect` module is loaded via unpkg, so that this assertion
              // triggers a cross-origin error
              window.expect(true).toBe(false);
            }}
          />
        </TestCase>
        <TestCase
          title="Errors are logged even if they're caught (development mode only)"
          description="">
          <TestCase.Steps>
            <li>Click the "Trigger render error and catch" button</li>
          </TestCase.Steps>
          <TestCase.ExpectedResult>
            Open the console. "Uncaught Error: Caught error" should have been logged by the browser.
          </TestCase.ExpectedResult>
          <TriggerErrorAndCatch />
        </TestCase>
      </FixtureSet>
    );
  }
}
