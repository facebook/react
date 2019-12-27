const React = window.React;

const CIRCLE_SIZE = 80;

class DragBox extends React.Component {
  state = {
    hasCapture: false,
    circleLeft: 80,
    circleTop: 80,
  };
  isDragging = false;
  previousLeft = 0;
  previousTop = 0;

  onDown = event => {
    this.isDragging = true;
    event.target.setPointerCapture(event.pointerId);

    // We store the initial coordinates to be able to calculate the changes
    // later on.
    this.extractPositionDelta(event);
  };

  onMove = event => {
    if (!this.isDragging) {
      return;
    }
    const {left, top} = this.extractPositionDelta(event);

    this.setState(({circleLeft, circleTop}) => ({
      circleLeft: circleLeft + left,
      circleTop: circleTop + top,
    }));
  };

  onUp = event => (this.isDragging = false);
  onGotCapture = event => this.setState({hasCapture: true});
  onLostCapture = event => this.setState({hasCapture: false});

  extractPositionDelta = event => {
    const left = event.pageX;
    const top = event.pageY;
    const delta = {
      left: left - this.previousLeft,
      top: top - this.previousTop,
    };
    this.previousLeft = left;
    this.previousTop = top;
    return delta;
  };

  render() {
    const {hasCapture, circleLeft, circleTop} = this.state;

    const boxStyle = {
      border: '1px solid #d9d9d9',
      margin: '10px 0 20px',
      minHeight: 400,
      width: '100%',
      position: 'relative',
    };

    const circleStyle = {
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: CIRCLE_SIZE / 2,
      position: 'absolute',
      left: circleLeft,
      top: circleTop,
      backgroundColor: hasCapture ? 'blue' : 'green',
      touchAction: 'none',
    };

    return (
      <div style={boxStyle}>
        <div
          style={circleStyle}
          onPointerDown={this.onDown}
          onPointerMove={this.onMove}
          onPointerUp={this.onUp}
          onPointerCancel={this.onUp}
          onGotPointerCapture={this.onGotCapture}
          onLostPointerCapture={this.onLostCapture}
        />
      </div>
    );
  }
}

export default DragBox;
