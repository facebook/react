var name = Math.random() > 0.5 ? 'Jane' : 'John';
var HELLO_COMPONENT = ('\nclass HelloMessage extends React.Component {\n  render() {\n    return <div>Hello {this.props.name}</div>;\n  }\n}\n\nReactDOM.render(<HelloMessage name="' + name + '" />, mountNode);\n').trim();

ReactDOM.render(React.createElement(ReactPlayground, { codeText: HELLO_COMPONENT }), document.getElementById('helloExample'));