import Fixture from '../../Fixture';

const React = window.React;

class EmailAttributesTestCase extends React.Component {
  state = {value: 'a@fb.com'};
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
              type="email"
              pattern=".+@fb.com"
              maxlength={17}
              multiple={true}
              value={this.state.value}
              onChange={this.onChange}
            />
            <span className="hint">
              {' '}
              Value: {JSON.stringify(this.state.value)}
            </span>
          </fieldset>

          <fieldset>
            <legend>Uncontrolled</legend>
            <input
              type="email"
              defaultValue=""
              pattern=".+@fb.com"
              maxlength={17}
              multiple={true}
            />
          </fieldset>
        </div>
      </Fixture>
    );
  }
}

export default EmailAttributesTestCase;
