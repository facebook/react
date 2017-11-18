// as specified https://github.com/facebook/react/issues/9866
import React, {Component} from 'react';
import FixtureSet from '../../FixtureSet';
import Fixture from '../../Fixture';

export default class InputElements extends Component {
  state = {text: 'initialText'};
  handleChange = e => {
    this.setState({text: e.target.value});
  };
  render() {
    return (
      <FixtureSet
        title="<input> Elements"
        description="Expected behavior across controlled and uncontrolled inputs">
        <Fixture>
        <div className="control-box">
          <fieldset>
            <legend>Controlled</legend>
            Write here: <input value={this.state.text} onChange={this.handleChange} />
            <hr />
            this.state.text: <pre>{this.state.text}</pre>
          </fieldset>

          <fieldset>
            <legend>Uncontrolled</legend>
            <input placeholder="Uncontrolled input" />
          </fieldset>
        </div>
        </Fixture>
      </FixtureSet>
    );
  }
}