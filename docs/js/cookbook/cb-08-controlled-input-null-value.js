/**
 * @jsx React.DOM
 */

 var CB_08-CONTROLLED-INPUT-NULL-VALUE_COMPONENT = "
/** @jsx React.DOM */

React.renderComponent(<input value="hi" />, mountNode);

setTimeout(function() {
  React.renderComponent(<input value={null} />, mountNode);
}, 2000);
";
 React.renderComponent(
 ReactPlayground( {codeText:CB_08-CONTROLLED-INPUT-NULL-VALUE_COMPONENT} ),
 document.getElementById("cb-08ControlledInputNullValueExample")
 );