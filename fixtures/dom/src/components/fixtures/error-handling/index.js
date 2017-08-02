import FixtureSet from '../../FixtureSet';
import TestCase from '../../TestCase';

const React = window.React;

function BadRender(props) {
  throw props.error;
}
class ErrorBoundary extends React.Component {
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
        return `Captured an error: ${this.state.error.message}`;
      } else {
        return `Captured an error: ${this.state.error}`;
      }
    }
    if (this.state.shouldThrow) {
      return <BadRender error={this.props.error} />;
    }
    return <button onClick={this.triggerError}>Trigger error</button>;
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
        <ErrorBoundary error={this.props.error} key={this.state.key} />
        <button onClick={this.restart}>Reset</button>
      </div>
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
          <Example error={new Error('Oops!')} />
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
          <Example error={null} />
        </TestCase>
      </FixtureSet>
    );
  }
}
