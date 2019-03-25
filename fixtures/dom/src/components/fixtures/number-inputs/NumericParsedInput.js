import Fixture from '../../Fixture';

const React = window.React;

export default class NumbericParsedInput extends React.Component {
  state = {
    value: 0,
  };

  onChange = event => {
    this.setState({
      value: event.target.valueAsNumber,
    });
  };

  render() {
    const {value} = this.state;

    return (
      <Fixture>
        <div>{this.props.children}</div>

        <div className="control-box">
          <input type="number" value={value} onChange={this.onChange} />
          <pre>Value: {value}</pre>
        </div>
      </Fixture>
    );
  }
}
