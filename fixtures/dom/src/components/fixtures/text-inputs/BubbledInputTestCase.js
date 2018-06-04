import Fixture from '../../Fixture';
const React = window.React;

const noop = () => {};

class BubbledInputTestCase extends React.Component {
  state = {
    value: '',
  };

  onChange = event => {
    this.setState({
      value: (event.srcElement || event.target).value,
    });
  };

  render() {
    return (
      <Fixture>
        <div className="control-box" onChange={this.onChange}>
          <fieldset>
            <legend>Controlled Text</legend>
            <input value={this.state.value} onChange={noop} />
            <p className="hint">Value: {JSON.stringify(this.state.value)}</p>
          </fieldset>
        </div>
      </Fixture>
    );
  }
}

export default BubbledInputTestCase;
