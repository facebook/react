const React = window.React;

const RangeInputs = React.createClass({
  getInitialState() {
    return { value: 0.5 };
  },
  onChange(event) {
    this.setState({ value: event.target.value });
  },
  render() {
    return (
      <form>
        <fieldset>
          <legend>Controlled</legend>
          <input type="range" value={this.state.value} onChange={this.onChange} />
          <span className="hint">Value: {this.state.value}</span>
        </fieldset>

        <fieldset>
          <legend>Uncontrolled</legend>
          <input type="range" defaultValue={0.5} />
        </fieldset>
      </form>
    );
  },
});

export default RangeInputs;
