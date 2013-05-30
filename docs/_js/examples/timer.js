/**
 * @jsx React.DOM
 */

var TIMER_COMPONENT = "\
var Timer = React.createClass({\n\
  getInitialState: function() {\n\
    return {secondsElapsed: 0};\n\
  },\n\
  tick: React.autoBind(function() {\n\
    this.setState({secondsElapsed: this.state.secondsElapsed + 1});\n\
  }),\n\
  componentDidMount: function() {\n\
    setInterval(this.tick, 1000);\n\
  },\n\
  render: function() {\n\
    return React.DOM.div({},\n\
      'Seconds Elapsed: ' + this.state.secondsElapsed\n\
    );\n\
  }\n\
});\n\
\n\
React.renderComponent(Timer({}), mountNode);\
";

React.renderComponent(
  <ReactPlayground codeText={TIMER_COMPONENT} />,
  document.getElementById('timerExample')
);
