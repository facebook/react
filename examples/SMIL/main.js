/** @jsx React.DOM */

var CSSTransitionGroup = React.addons.CSSTransitionGroup;
var INTERVAL = 40;

var Dot = React.createClass({

  render: function () {
    var r = this.props.radius;
    var path = "M 0 0 H " + (300 - (r*2)) + " Z";
    return (
      <circle cx={r} cy="50" r={r} fill={this.props.color} stroke="black" strokeWidth="1">
        <animateMotion path={path} dur={this.props.duration+'s'} repeatCount="indefinite" />
      </circle>
      );
  }

});

var SmilDemo = React.createClass({
  getInitialState: function() {
    return {start: 0};
  },

  componentDidMount: function() {
    this.interval = Timers.requestInterval(this.tick, INTERVAL);
  },

  componentWillUnmount: function() {
    Timers.clearInterval(this.interval);
  },

  tick: function() {
    this.setState({start: this.state.start + 1});
  },

  render: function() {
    var val = this.state.start % 255;
    var color1 =  "rgba(0," + val +",100,0.5)";
    var color2 =  "rgba(0,100," + val + ",0.5)";
    var color3 =  "rgba("+val+",100,50,0.5)";
    var radius1 =  this.state.start % 50;
    return (
      <div>
        <div>{val}</div>
        <svg width="300px" height="300px">
          <Dot radius={radius1} duration="8" color={color1} />
          <Dot radius="30" duration="2" color={color2} />
          <Dot radius="15" duration="4" color={color3} />
        </svg>
      </div>
      );
  }
});

React.renderComponent(
  <SmilDemo />,
  document.getElementById('container')
);

