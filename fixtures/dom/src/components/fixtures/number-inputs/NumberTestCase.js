const React = window.React;

import Fixture from '../../Fixture';

const NumberTestCase = React.createClass({
  getInitialState() {
    return { value: '' };
  },
  onChange(event) {
    const parsed = parseFloat(event.target.value, 10)
    const value = isNaN(parsed) ? '' : parsed

    this.setState({ value })
  },
  render() {
    return (
      <Fixture>
        <div>{this.props.children}</div>

        <div className="control-box">
          <fieldset>
            <legend>Controlled</legend>
            <input type="number" value={this.state.value} onChange={this.onChange} />
            <span className="hint"> Value: {JSON.stringify(this.state.value)}</span>
          </fieldset>

          <fieldset>
            <legend>Uncontrolled</legend>
            <input type="number" defaultValue={0.5} />
          </fieldset>
        </div>
      </Fixture>
    );
  },
});

export default NumberTestCase;
