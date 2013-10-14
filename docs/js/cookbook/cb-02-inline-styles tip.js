/**
 * @jsx React.DOM
 */

 var INLINE_STYLES_TIP_COMPONENT = "
/** @jsx React.DOM */

var divStyle = {
  color: 'white',
  backgroundImage: 'url(' + imgUrl + ')',
  WebkitTransition: 'all' // note the capital 'W' here
};

React.renderComponent(<div style={divStyle}>Hello World!</div>, mountNode);
";
 React.renderComponent(
 ReactPlayground( {codeText:INLINE_STYLES_TIP_COMPONENT} ),
 document.getElementById("InlineStyles tip")
 );