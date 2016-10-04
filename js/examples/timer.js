'use strict';

var _jsxFileName = '_js/examples/timer.js';
var TIMER_COMPONENT = '\nclass Timer extends React.Component {\n  constructor(props) {\n    super(props);\n    this.state = {secondsElapsed: 0};\n  }\n\n  tick() {\n    this.setState((prevState) => ({\n      secondsElapsed: prevState.secondsElapsed + 1\n    }));\n  }\n\n  componentDidMount() {\n    this.interval = setInterval(() => this.tick(), 1000);\n  }\n\n  componentWillUnmount() {\n    clearInterval(this.interval);\n  }\n\n  render() {\n    return (\n      <div>Seconds Elapsed: {this.state.secondsElapsed}</div>\n    );\n  }\n}\n\nReactDOM.render(<Timer />, mountNode);\n'.trim();

ReactDOM.render(React.createElement(ReactPlayground, { codeText: TIMER_COMPONENT, __source: {
    fileName: _jsxFileName,
    lineNumber: 33
  }
}), document.getElementById('timerExample'));