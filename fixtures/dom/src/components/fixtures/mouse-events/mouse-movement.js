import TestCase from '../../TestCase';

const React = window.React;

class MouseMovement extends React.Component {
  state = {
    movement: {x: 0, y: 0},
  };

  onMove = event => {
    this.setState({x: event.movementX, y: event.movementY});
  };

  render() {
    const {x, y} = this.state;

    const boxStyle = {
      padding: '10px 20px',
      border: '1px solid #d9d9d9',
      margin: '10px 0 20px',
    };

    return (
      <TestCase
        title="Mouse Movement"
        description="We polyfill the movementX and movementY fields."
        affectedBrowsers="IE, Safari">
        <TestCase.Steps>
          <li>Mouse over the box below</li>
        </TestCase.Steps>

        <TestCase.ExpectedResult>
          The reported values should equal the pixel (integer) difference
          between mouse movements positions.
        </TestCase.ExpectedResult>

        <div style={boxStyle} onMouseMove={this.onMove}>
          <p>Trace your mouse over this box.</p>
          <p>
            Last movement: {x},{y}
          </p>
        </div>
      </TestCase>
    );
  }
}

export default MouseMovement;
