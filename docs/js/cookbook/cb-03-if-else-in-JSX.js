/**
 * @jsx React.DOM
 */

 var IF_ELSE_IN_JSX_COMPONENT = "
/** @jsx React.DOM */

// this
React.renderComponent(<div id="msg">Hello World!</div>, mountNode);
// is the same as this
React.renderComponent(React.DOM.div({id:"msg"}, "Hello World!"), mountNode);
";
 React.renderComponent(
 ReactPlayground( {codeText:IF_ELSE_IN_JSX_COMPONENT} ),
 document.getElementById("IfElseIn-JSX")
 );