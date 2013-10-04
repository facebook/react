/**
 * @jsx React.DOM
 */

 var CB_06-STYLE-PROP-VALUE-PX_COMPONENT = "
/** @jsx React.DOM */

var divStyle = {height: 10}; // rendered as "height:10px"
React.renderComponent(<div style={divStyle}>Hello World!</div>, mountNode);
";
 React.renderComponent(
 ReactPlayground( {codeText:CB_06-STYLE-PROP-VALUE-PX_COMPONENT} ),
 document.getElementById("cb-06StylePropValuePxExample")
 );