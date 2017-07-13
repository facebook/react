const React = window.React;

import Fixture from '../../Fixture';

class PasswordTestCase extends React.Component {
  state = {value: ''};
  onChange = event => {
    this.setState({value: event.target.value});
  };
  render() {
    return (
      <Fixture>
        <div>{this.props.children}</div>

        <div className="control-box">
          <fieldset>
            <legend>Controlled</legend>
            <input
              type="password"
              value={this.state.value}
              onChange={this.onChange}
            />
            <span className="hint">
              {' '}Value: {JSON.stringify(this.state.value)}
            </span>
          </fieldset>

          <fieldset>
            <legend>Uncontrolled</legend>
            <input type="password" defaultValue="" />
          </fieldset>
        </div>
      </Fixture>
    );
  }
}

export default PasswordTestCase;
