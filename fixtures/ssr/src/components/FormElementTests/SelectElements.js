// as specified https://github.com/facebook/react/issues/9866
import React, {Component} from 'react';

export default class SelectElements extends Component {
  state = {selected: 'lime'};
  handleChange = e => {
    this.setState({selected: e.target.value});
  };
  render() {
    return (
      <div>
        <h3> {"<select>"} Elements </h3>
        <p>
          Uncontrolled: 
          <select defaultValue="value2">
            <option value="value1">Value 1</option> 
            <option value="value2">Value 2</option>
            <option value="value3">Value 3</option>
          </select>
        </p>
        <p>
          Controlled:
            <select value={this.state.selected} onChange={this.handleChange}>
              <option value="grapefruit">Grapefruit</option>
              <option value="lime">Lime</option>
              <option value="coconut">Coconut</option>
              <option value="mango">Mango</option>
            </select>
          <br />
          selected: {this.state.selected}
        </p>
      </div>
    );
  }
}