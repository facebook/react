import React from 'react';
import FixtureSet from '../../FixtureSet';

class SelectFixture extends React.Component {
  state = {value: ''};
  onChange = event => {
    this.setState({value: event.target.value});
  };
  render() {
    return (
      <FixtureSet title="Selects" description="">
        <form>
          <fieldset>
            <legend>Controlled</legend>
            <select value={this.state.value} onChange={this.onChange}>
              <option value="">Select a color</option>
              <option value="red">Red</option>
              <option value="blue">Blue</option>
              <option value="green">Green</option>
            </select>
            <span className="hint">Value: {this.state.value}</span>
          </fieldset>
          <fieldset>
            <legend>Uncontrolled</legend>
            <select defaultValue="">
              <option value="">Select a color</option>
              <option value="red">Red</option>
              <option value="blue">Blue</option>
              <option value="gree">Green</option>
            </select>
          </fieldset>
        </form>
      </FixtureSet>
    );
  }
}

export default SelectFixture;
