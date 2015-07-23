'use strict';

var React = require('./lib/React');

var assign = require('./lib/Object.assign');
var deprecated = require('./lib/deprecated');

// We want to warn once when any of these methods are used.
if (process.env.NODE_ENV !== 'production') {
  var deprecations = {
    // ReactDOM
    findDOMNode: deprecated(
      'findDOMNode',
      'react-dom',
      React,
      React.findDOMNode
    ),
    render: deprecated(
      'render',
      'react-dom',
      React,
      React.render
    ),
    unmountComponentAtNode: deprecated(
      'unmountComponentAtNode',
      'react-dom',
      React,
      React.unmountComponentAtNode
    ),
    // ReactDOMServer
    renderToString: deprecated(
      'renderToString',
      'react-dom/server',
      React,
      React.renderToString
    ),
    renderToStaticMarkup: deprecated(
      'renderToStaticMarkup',
      'react-dom/server',
      React,
      React.renderToStaticMarkup
    ),
  };
  // Export a wrapped object. We'll use assign and take advantage of the fact
  // that this will override the original methods in React.
  module.exports = assign(
    {},
    React,
    deprecations
  );
} else {
  module.exports = React;
}
