const React = window.React;

class HitBox extends React.Component {
  state = {
    x: 0,
    y: 0,
  };

  static defaultProps = {
    onMouseMove: n => n,
  };

  onMove = event => {
    this.setState({x: event.clientX, y: event.clientY});
    this.props.onMouseMove(event);
  };

  render() {
    const {x, y} = this.state;

    const boxStyle = {
      padding: '10px 20px',
      border: '1px solid #d9d9d9',
      margin: '10px 0 20px',
    };

    return (
      <div onMouseMove={this.onMove} style={boxStyle}>
        <p>Trace your mouse over this box.</p>
        <p>
          Last movement: {x},{y}
        </p>
      </div>
    );
  }
}

export default HitBox;
