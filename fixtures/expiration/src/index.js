import React from 'react';
import ReactDOM from 'react-dom';

class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { counter: 0 };
  }

  incrementCounter = () => {
    this.setState(state => ({
      counter: state.counter + 1,
    }));
  }

  componentDidMount() {
    this.incrementCounter();
  }

  componentDidUpdate() {
    setTimeout(this.incrementCounter, 1000); // Add a delay before incrementing
  }

  render() {
    return <h1>{this.state.counter}</h1>;
  }
}

const interval = 200;
function block() {
  const endTime = performance.now() + interval;
  while (performance.now() < endTime) {}
}
setInterval(block, interval);

// Should render a counter that increments approximately every second (the
// expiration time of a low priority update).
ReactDOM.render(<Counter />, document.getElementById('root'));
block();