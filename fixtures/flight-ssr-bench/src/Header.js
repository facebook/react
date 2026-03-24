'use client';

const React = require('react');

function Header({title}) {
  return React.createElement(
    'header',
    null,
    React.createElement('h1', null, title),
    React.createElement(
      'nav',
      null,
      React.createElement('a', {href: '/'}, 'Home'),
      React.createElement('a', {href: '/products'}, 'Products')
    )
  );
}

module.exports = Header;
module.exports.default = Header;
