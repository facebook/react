const React = window.React;

class DrawBox extends React.Component {
  render() {
    const boxStyle = {
      border: '1px solid #d9d9d9',
      margin: '10px 0 20px',
      padding: '20px 20px',
      touchAction: 'none',
    };

    const obstacleStyle = {
      border: '1px solid #d9d9d9',
      width: '25%',
      height: '200px',
      margin: '12.5%',
      display: 'inline-block',
    };

    return (
      <div
        style={boxStyle}
        onPointerOver={this.props.onOver}
        onPointerOut={this.props.onOut}
        onPointerEnter={this.props.onEnter}
        onPointerLeave={this.props.onLeave}>
        <div style={obstacleStyle} />
        <div style={obstacleStyle} />
      </div>
    );
  }
}

export default DrawBox;
