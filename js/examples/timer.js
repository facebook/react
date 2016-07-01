'use strict';

var _jsxFileName = '_js/examples/timer.js';
var TIMER_COMPONENT = '\nvar Timer = React.createClass({\n  getInitialState: function() {\n    return {secondsElapsed: 0};\n  },\n  tick: function() {\n    this.setState({secondsElapsed: this.state.secondsElapsed + 1});\n  },\n  componentDidMount: function() {\n    this.interval = setInterval(this.tick, 1000);\n  },\n  componentWillUnmount: function() {\n    clearInterval(this.interval);\n  },\n  render: function() {\n    return (\n      <div>Seconds Elapsed: {this.state.secondsElapsed}</div>\n    );\n  }\n});\n\nReactDOM.render(<Timer />, mountNode);\n';

ReactDOM.render(React.createElement(ReactPlayground, { codeText: TIMER_COMPONENT, __source: {
    fileName: _jsxFileName,
    lineNumber: 26
  }
}), document.getElementById('timerExample'));