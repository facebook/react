var name = Math.random() > 0.5 ? 'Jane' : 'John';
var HELLO_COMPONENT = `
function HelloMessage(props) {
  return <div>Hello {props.name}</div>;
}

ReactDOM.render(<HelloMessage name="${name}" />, mountNode);
`.trim();

ReactDOM.render(
  <ReactPlayground codeText={HELLO_COMPONENT} />,
  document.getElementById('helloExample')
);
