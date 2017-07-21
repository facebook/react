var name = Math.random() > 0.5 ? 'Jane' : 'John';
var HELLO_COMPONENT = `
class HelloMessage extends React.Component {
  render() {
    return <div>Hello {this.props.name}</div>;
  }
}

ReactDOM.render(<HelloMessage name="${name}" />, mountNode);
`.trim();

ReactDOM.render(
  <ReactPlayground codeText={HELLO_COMPONENT} />,
  document.getElementById('helloExample')
);
