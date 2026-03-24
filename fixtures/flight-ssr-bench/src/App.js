const React = require('react');
const Header = require('./Header');
const Layout = require('./Layout');
const ProductList = require('./ProductList');

function App({itemCount}) {
  return React.createElement(
    'html',
    null,
    React.createElement(
      'body',
      null,
      React.createElement(Header, {title: 'Flight SSR Benchmark'}),
      React.createElement(
        Layout,
        null,
        React.createElement(ProductList, {count: itemCount})
      )
    )
  );
}

module.exports = App;
module.exports.default = App;
