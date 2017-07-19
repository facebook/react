const React = window.React;

import FixtureSet from '../../FixtureSet';
import TestCase from '../../TestCase';

function BadRender() {
  throw new Error('Oops!');
}
class ErrorBoundary extends React.Component {
  state = {
    shouldThrow: false,
    error: null,
  };
  componentDidCatch(error) {
    this.setState({error});
  }
  triggerError = () => {
    this.setState({
      shouldThrow: true,
    });
  };
  render() {
    if (this.state.error) {
      return `Captured an error: ${this.state.error.message}`;
    }
    if (this.state.shouldThrow) {
      return <BadRender />;
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
        <ErrorBoundary key={this.state.key} />
        <button onClick={this.restart}>Restart</button>
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
          </TestCase.Steps>
          <TestCase.ExpectedResult>
            The DevTools should pause at the line where the error was thrown, in
            the BadRender component. After resuming, the "Trigger error" button
            should read "Caught an error: Oops!"
          </TestCase.ExpectedResult>
          <Example />
        </TestCase>
      </FixtureSet>
    );
  }
}
