import React from 'react';

import Fixture from '../../Fixture';

class InputPlaceholderFixture extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      placeholder: 'A placeholder',
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
  handleGeneratePlaceholder = () => {
    this.setState({
      placeholder: `A placeholder: ${Math.random() * 100}`,
    });
  };

  handleReset = () => {
    this.setState({
      changeCount: 0,
    });
  };

  render() {
    const {placeholder, changeCount} = this.state;
    const color = changeCount === 0 ? 'green' : 'red';

    return (
      <Fixture>
        <input
          type="text"
          placeholder={placeholder}
          onChange={this.handleChange}
        />{' '}
        <button onClick={this.handleGeneratePlaceholder}>
          Change placeholder
        </button>
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

export default InputPlaceholderFixture;
