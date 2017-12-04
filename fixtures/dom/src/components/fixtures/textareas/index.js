import FixtureSet from '../../FixtureSet';
import TestCase from '../../TestCase';

const React = window.React;

export default class TextAreaFixtures extends React.Component {
  state = {value: ''};
  onChange = event => {
    this.setState({value: event.target.value});
  };
  render() {
    return (
      <FixtureSet title="Textareas">
        <TestCase
          title="Kitchen Sink"
          description="Verify that the controlled textarea displays its value under 'Controlled Output', and that both textareas can be typed in">
          <div>
            <form className="container">
              <fieldset>
                <legend>Controlled</legend>
                <textarea value={this.state.value} onChange={this.onChange} />
              </fieldset>
              <fieldset>
                <legend>Uncontrolled</legend>
                <textarea defaultValue="" />
              </fieldset>
            </form>
            <div className="container">
              <h4>Controlled Output:</h4>
              <div className="output">{this.state.value}</div>
            </div>
          </div>
        </TestCase>
        <TestCase title="Placeholders">
          <TestCase.ExpectedResult>
            The textarea should be rendered with the placeholder "Hello, world"
          </TestCase.ExpectedResult>
          <div style={{margin: '10px 0px'}}>
            <textarea placeholder="Hello, world" />
          </div>
        </TestCase>
      </FixtureSet>
    );
  }
}
