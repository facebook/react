/** @jsx React.DOM */

var CSSTransitionGroup = React.addons.CSSTransitionGroup;
var INTERVAL = 40; // 25 frame/sec

var Dot = React.createClass({

  render: function () {
    var r = this.props.radius;
    var path = "M 0 0 H " + (300 - (r * 2)) + " Z";
    return (
      <circle cx={r} cy={this.props.y} r={r} fill={this.props.color || 'Black'} stroke="black" strokeWidth="1">
        <animateMotion path={path} dur={this.props.duration + 's'} repeatCount="indefinite" />
      { !this.props.color ? <animate dur="5s" begin="6s" from="#000000" to="#CC9933" calcMode="linear" attributeName="fill"/> : false }
      </circle>
      );
  }

});

var style = {stroke:'#000099', fill:'#000099', fontSize:18};
var Square = React.createClass({
  render: function () {
    return (
      <g>
        <rect x="50" y="200" rx="5" ry="5" width="100" height="100"
          fill="#CCCCFF"/>
        <text x="55" y="220" style={style}>Weeeee!</text>
        <animateTransform attributeName="transform" type="rotate"
          values="0 150 100; 360 150 100" repeatCount="indefinite"
          begin="0s" dur="5s" />
      </g>
      );
  }
});

var SmilDemo = React.createClass({
  getInitialState: function () {
    return {start: 0};
  },

  componentDidMount: function () {
    this.interval = Timers.requestInterval(this.tick, INTERVAL);
  },

  componentWillUnmount: function () {
    Timers.clearInterval(this.interval);
  },

  tick: function () {
    this.setState({start: this.state.start + 1});
  },

  render: function () {
    var val = this.state.start % 255;
    var color1 = "rgba(0," + val + ",100,0.5)";
    var color2 = "rgba(0,100," + val + ",0.5)";
    var radius1 = 20 + (this.state.start % 30);
    return (
      <div>
        <div>{val}</div>
        <svg width="500px" height="500px">
          <Dot y={radius1} radius={radius1} duration="8" color={color1} />
          <Dot y="100" radius="30" duration="2" color={color2} />
          <Dot y="200" radius="15" duration="4">
          </Dot>
          <Square/>
        </svg>
      </div>
      );
  }
});

React.renderComponent(
  <SmilDemo />,
  document.getElementById('container')
);

