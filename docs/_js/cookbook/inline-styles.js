/**
 * @jsx React.DOM
 */

var INLINE_STYLES_COMPONENT = "\/** @jsx React.DOM *\/\r\n\r\nvar divStyle = {\r\n  color: \'white\',\r\n  backgroundColor: \'lightblue\',\r\n  WebkitTransition: \'all\' \/\/ note the capital \'W\' here\r\n};\r\n\r\nReact.renderComponent(<div style={divStyle}>Hello World!<\/div>, mountNode);";

React.renderComponent(
  ReactPlayground( {codeText:INLINE_STYLES_COMPONENT} ),
  document.getElementById('inlineStylesExample')
);
