/**
 * @jsx React.DOM
 */

 var CB_03-IF-ELSE-IN-JSX TIP_COMPONENT = "
/** @jsx React.DOM */

// this
React.renderComponent(<div id="msg">Hello World!</div>, mountNode);
// is the same as this
React.renderComponent(React.DOM.div({id:"msg"}, "Hello World!"), mountNode);
";
 React.renderComponent(
 ReactPlayground( {codeText:CB_03-IF-ELSE-IN-JSX TIP_COMPONENT} ),
 document.getElementById("cb-03IfElseIn-JSX tipExample")
 );