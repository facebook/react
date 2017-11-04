// as specified https://github.com/facebook/react/issues/9866
import React, {Component} from 'react';

export default class InputElements extends Component {
  state = {text: 'initialText'};
  handleChange = e => {
    this.setState({text: e.target.value});
  };
  render() {
    return (
      <div>
        <h3> {"<input>"} Elements </h3>
        <p>
          Uncontrolled: <input placeholder="Uncontrolled input" />
        </p>
        <p>
          Controlled: <input value={this.state.text} onChange={this.handleChange} />
          <br />
          text: {this.state.text}
        </p>
      </div>
    );
  }
}