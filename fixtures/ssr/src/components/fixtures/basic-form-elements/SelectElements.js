// as specified https://github.com/facebook/react/issues/9866
import React, {Component} from 'react';
import FixtureSet from '../../FixtureSet';
import Fixture from '../../Fixture';

export default class SelectElements extends Component {
  state = {selected: 'lime'};
  handleChange = e => {
    this.setState({selected: e.target.value});
  };
  render() {
    return (
      <FixtureSet
        title="<select> Elements"
        description="Expected behavior across controlled and uncontrolled select elements">
        <Fixture>
          <div className="control-box">
            <fieldset>
              <legend>Controlled</legend>
              Change this:
              <select value={this.state.selected} onChange={this.handleChange}>
                <option value="grapefruit">Grapefruit</option>
                <option value="lime">Lime</option>
                <option value="coconut">Coconut</option>
                <option value="mango">Mango</option>
              </select>
              <hr />
              this.state.selected: <pre>{this.state.selected}</pre>
            </fieldset>

            <fieldset>
              <legend>Uncontrolled</legend>
              <select defaultValue="value2">
                <option value="value1">Value 1</option>
                <option value="value2">Value 2</option>
                <option value="value3">Value 3</option>
              </select>
            </fieldset>
          </div>
        </Fixture>
      </FixtureSet>
    );
  }
}
