import React from 'react';

import Fixture from '../../Fixture';

class RadioGroupFixture extends React.Component {
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
    const color = changeCount === 2 ? 'green' : 'red';

    return (
      <Fixture>
        <label>
          <input
            defaultChecked
            name="foo"
            type="radio"
            onChange={this.handleChange}
          />
          Radio 1
        </label>
        <label>
          <input name="foo" type="radio" onChange={this.handleChange} />
          Radio 2
        </label>

        {' '}
        <p style={{color}}>
          <code>onChange</code>{' calls: '}<strong>{changeCount}</strong>
        </p>
        <button onClick={this.handleReset}>Reset count</button>
      </Fixture>
    );
  }
}

export default RadioGroupFixture;
