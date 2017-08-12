const React = window.React;
const ReactDOM = window.ReactDOM;

class SelectFixture extends React.Component {
  state = {value: ''};
  _nestedDOMNode = null;

  onChange = event => {
    this.setState({value: event.target.value});
  };

  componentDidMount() {
    this._renderNestedSelect();
  }

  componentDidUpdate() {
    this._renderNestedSelect();
  }

  _renderNestedSelect() {
    ReactDOM.render(
      <select value={this.state.value} onChange={this.onChange}>
        <option value="">Select a color</option>
        <option value="red">Red</option>
        <option value="blue">Blue</option>
        <option value="green">Green</option>
      </select>,
      this._nestedDOMNode
    );
  }

  render() {
    return (
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
            <option value="green">Green</option>
          </select>
          <span className="hint" />
        </fieldset>
        <fieldset>
          <legend>Controlled in nested subtree</legend>
          <div ref={node => (this._nestedDOMNode = node)} />
          <span className="hint">
            This should synchronize in both direction with the one above.
          </span>
        </fieldset>
      </form>
    );
  }
}

export default SelectFixture;
