import Fixture from '../../Fixture';
import FixtureSet from '../../FixtureSet';
import TestCase from '../../TestCase';

const React = window.React;

class CheckboxInputs extends React.Component {
  state = {
    checked: false,
    indeterminate: false,
  };

  handleChange = event => {
    this.setState({checked: event.target.checked});
  };

  handleIndeterminateChange = event => {
    this.setState({indeterminate: event.target.checked});
  };

  indeterminateRef = input => {
    if (input) {
      input.indeterminate = this.state.indeterminate;
    }
  };

  render() {
    return (
      <FixtureSet title="Checkbox Inputs">
        <TestCase
          title="Controlled checkbox"
          description="A controlled checkbox should update when clicked">
          <TestCase.Steps>
            <li>Click the checkbox</li>
          </TestCase.Steps>
          <TestCase.ExpectedResult>
            The checkbox should toggle and the displayed state should update
          </TestCase.ExpectedResult>
          <Fixture>
            <fieldset>
              <legend>Controlled</legend>
              <label>
                <input
                  type="checkbox"
                  checked={this.state.checked}
                  onChange={this.handleChange}
                />
                {' Toggle me'}
              </label>
              <span className="hint">
                {' '}
                Checked: {String(this.state.checked)}
              </span>
            </fieldset>
          </Fixture>
        </TestCase>

        <TestCase
          title="Uncontrolled checkbox"
          description="An uncontrolled checkbox with defaultChecked">
          <TestCase.Steps>
            <li>Click the checkbox</li>
          </TestCase.Steps>
          <TestCase.ExpectedResult>
            The checkbox should toggle freely without React controlling it
          </TestCase.ExpectedResult>
          <Fixture>
            <fieldset>
              <legend>Uncontrolled</legend>
              <label>
                <input type="checkbox" defaultChecked={true} />
                {' Default checked'}
              </label>
            </fieldset>
          </Fixture>
        </TestCase>

        <TestCase
          title="Disabled checkbox"
          description="A disabled checkbox should not respond to user interaction">
          <TestCase.Steps>
            <li>Try to click the disabled checkboxes</li>
          </TestCase.Steps>
          <TestCase.ExpectedResult>
            Nothing should happen, the checkboxes should remain in their
            original state
          </TestCase.ExpectedResult>
          <Fixture>
            <fieldset>
              <legend>Disabled</legend>
              <label>
                <input type="checkbox" disabled checked={true} readOnly />
                {' Disabled (checked)'}
              </label>
              <br />
              <label>
                <input type="checkbox" disabled checked={false} readOnly />
                {' Disabled (unchecked)'}
              </label>
            </fieldset>
          </Fixture>
        </TestCase>
      </FixtureSet>
    );
  }
}

export default CheckboxInputs;
