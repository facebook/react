/**
 * @jsx React.DOM
 */

 var CB_02-INLINE-STYLES TIP_COMPONENT = "
/** @jsx React.DOM */

var divStyle = {
  color: 'white',
  backgroundImage: 'url(' + imgUrl + ')',
  WebkitTransition: 'all' // note the capital 'W' here
};

React.renderComponent(<div style={divStyle}>Hello World!</div>, mountNode);
";
 React.renderComponent(
 ReactPlayground( {codeText:CB_02-INLINE-STYLES TIP_COMPONENT} ),
 document.getElementById("cb-02InlineStyles tipExample")
 );