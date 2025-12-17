import FixtureSet from '../../FixtureSet';

const React = window.React;

class RangeInputs extends React.Component {
  state = {value: 0.5};
  onChange = event => {
    this.setState({value: event.target.value});
  };
  render() {
    return (
      <FixtureSet
        title="Range Inputs"
        description="Note: Range inputs are not supported in IE9.">
        <form>
          <fieldset>
            <legend>Controlled</legend>
            <input
              type="range"
              value={this.state.value}
              onChange={this.onChange}
            />
            <span className="hint">Value: {this.state.value}</span>
          </fieldset>

          <fieldset>
            <legend>Uncontrolled</legend>
            <input type="range" defaultValue={0.5} />
          </fieldset>
        </form>
      </FixtureSet>
    );
  }
}

export default RangeInputs;
