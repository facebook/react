const React = window.React;

import Fixture from '../../Fixture';

class NumberInputExtraZeroes extends React.Component {
  state = { value: '3.0000' }
  changeValue = () => {
    this.setState({
      value: '3.0000'
    });
  }
  onChange = event => {
    this.setState({ value: event.target.value });
  }
  render() {
    const { value } = this.state
    return (
      <Fixture>
        <div>{this.props.children}</div>

        <div className="control-box">
          <input type="number" value={value} onChange={this.onChange} />
          <button onClick={this.changeValue}>Reset to "3.0000"</button>
        </div>
      </Fixture>
    );
  }
}

export default NumberInputExtraZeroes;
