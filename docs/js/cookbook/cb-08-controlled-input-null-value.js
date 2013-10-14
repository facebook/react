/**
 * @jsx React.DOM
 */

 var CONTROLLED_INPUT_NULL_VALUE_COMPONENT = "
/** @jsx React.DOM */

React.renderComponent(<input value="hi" />, mountNode);

setTimeout(function() {
  React.renderComponent(<input value={null} />, mountNode);
}, 2000);
";
 React.renderComponent(
 ReactPlayground( {codeText:CONTROLLED_INPUT_NULL_VALUE_COMPONENT} ),
 document.getElementById("ControlledInputNullValue")
 );