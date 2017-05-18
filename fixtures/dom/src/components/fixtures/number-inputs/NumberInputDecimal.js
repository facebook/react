const React = window.React;

import Fixture from '../../Fixture';

class NumberInputDecimal extends React.Component {
  state = { value: '.98' };
  changeValue = () => {
    this.setState({
      value: '0.98',
    });
  }
  render() {
    const {value} = this.state;
    return (
      <Fixture>
        <div>{this.props.children}</div>

        <div className="control-box">
          <input
            type="number"
            value={value}
            onChange={(e) => {
             this.setState({value: e.target.value}); 
            }}
          />
          <button onClick={this.changeValue}>change.98 to 0.98</button>
        </div>
      </Fixture>
    );
  }
}

export default NumberInputDecimal;
