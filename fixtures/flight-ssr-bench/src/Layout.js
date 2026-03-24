const React = require('react');

function Layout({children}) {
  return React.createElement('main', {className: 'layout'}, children);
}

module.exports = Layout;
module.exports.default = Layout;
