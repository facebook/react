import TestCase from '../../TestCase';
import Iframe from '../../Iframe';
const React = window.React;

export default class ReorderedInputsTestCase extends React.Component {
  state = {count: 0};

  componentDidMount() {
    this.interval = setInterval(() => {
      this.setState({count: this.state.count + 1});
    }, 2000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  renderInputs() {
    const inputs = [
      <input key={1} defaultValue="Foo" />,
      <input key={2} defaultValue="Bar" />,
    ];
    if (this.state.count % 2 === 0) {
      inputs.reverse();
    }
    return inputs;
  }

  render() {
    return (
      <TestCase title="Reordered input elements in iframes" description="">
        <TestCase.Steps>
          <li>The two inputs below swap positions every two seconds</li>
          <li>Select the text in either of them</li>
          <li>Wait for the swap to occur</li>
        </TestCase.Steps>
        <TestCase.ExpectedResult>
          The selection you made should be maintained
        </TestCase.ExpectedResult>
        <Iframe height={50}>{this.renderInputs()}</Iframe>
      </TestCase>
    );
  }
}
