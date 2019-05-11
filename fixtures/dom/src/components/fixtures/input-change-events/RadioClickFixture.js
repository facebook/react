import Fixture from '../../Fixture';
const React = window.React;

class RadioClickFixture extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      changeCount: 0,
    };
  }

  handleChange = () => {
    this.setState(({changeCount}) => {
      return {
        changeCount: changeCount + 1,
      };
    });
  };

  handleReset = () => {
    this.setState({
      changeCount: 0,
    });
  };

  render() {
    const {changeCount} = this.state;
    const color = changeCount === 0 ? 'green' : 'red';

    return (
      <Fixture>
        <label>
          <input defaultChecked type="radio" onChange={this.handleChange} />
          Test case radio input
        </label>{' '}
        <p style={{color}}>
          <code>onChange</code>
          {' calls: '}
          <strong>{changeCount}</strong>
        </p>
        <button onClick={this.handleReset}>Reset count</button>
      </Fixture>
    );
  }
}

export default RadioClickFixture;
