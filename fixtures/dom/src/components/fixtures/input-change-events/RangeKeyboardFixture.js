import React from 'react';

import Fixture from '../../Fixture';


class RangeKeyboardFixture extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      keydownCount: 0,
      changeCount: 0,
    };
  }

  componentDidMount() {
    this.input.addEventListener('keydown', this.handleKeydown, false)
  }

  componentWillUnmount() {
    this.input.removeEventListener('keydown', this.handleKeydown, false)
  }

  handleChange = () => {
    this.setState(({ changeCount }) => {
      return {
        changeCount: changeCount + 1
      }
    })
  }

  handleKeydown = (e) => {
    // only interesting in arrow key events
    if (![37, 38, 39, 40].includes(e.keyCode))
      return;

    this.setState(({ keydownCount }) => {
      return {
        keydownCount: keydownCount + 1
      }
    })
  }

  handleReset = () => {
    this.setState({
      keydownCount: 0,
      changeCount: 0,
    })
  }

  render() {
    const { keydownCount, changeCount } = this.state;
    const color = keydownCount === changeCount ? 'green' : 'red';

    return (
      <Fixture>
        <input
          type='range'
          ref={r => this.input = r}
          onChange={this.handleChange}
        />
        {' '}

        <p style={{ color }}>
          <code>onKeyDown</code>{' calls: '}<strong>{keydownCount}</strong>
          {' vs '}
          <code>onChange</code>{' calls: '}<strong>{changeCount}</strong>
        </p>
        <button onClick={this.handleReset}>Reset counts</button>
      </Fixture>
    )
  }
}

export default RangeKeyboardFixture;
