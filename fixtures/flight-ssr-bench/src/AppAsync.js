const React = require('react');
const Header = require('./Header');
const Layout = require('./Layout');
const ProductListAsync = require('./ProductListAsync');

function AppAsync({itemCount}) {
  return React.createElement(
    'html',
    null,
    React.createElement(
      'body',
      null,
      React.createElement(Header, {title: 'Flight SSR Benchmark (Async)'}),
      React.createElement(
        Layout,
        null,
        React.createElement(ProductListAsync, {count: itemCount})
      )
    )
  );
}

module.exports = AppAsync;
module.exports.default = AppAsync;
