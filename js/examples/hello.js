'use strict';

var _jsxFileName = '_js/examples/hello.js';
var HELLO_COMPONENT = '\nvar HelloMessage = React.createClass({\n  render: function() {\n    return <div>Hello {this.props.name}</div>;\n  }\n});\n\nReactDOM.render(<HelloMessage name="John" />, mountNode);\n';

ReactDOM.render(React.createElement(ReactPlayground, { codeText: HELLO_COMPONENT, __source: {
    fileName: _jsxFileName,
    lineNumber: 12
  }
}), document.getElementById('helloExample'));