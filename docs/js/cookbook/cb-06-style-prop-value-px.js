/**
 * @jsx React.DOM
 */

 var STYLE_PROP_VALUE_PX_COMPONENT = "
/** @jsx React.DOM */

var divStyle = {height: 10}; // rendered as "height:10px"
React.renderComponent(<div style={divStyle}>Hello World!</div>, mountNode);
";
 React.renderComponent(
 ReactPlayground( {codeText:STYLE_PROP_VALUE_PX_COMPONENT} ),
 document.getElementById("StylePropValuePx")
 );