'use client';

const React = require('react');

function ProductCard({name, price, description}) {
  return React.createElement(
    'div',
    {className: 'product-card'},
    React.createElement('h3', null, name),
    React.createElement('span', {className: 'price'}, '$', price),
    React.createElement('p', null, description),
    React.createElement('button', null, 'Add to cart')
  );
}

module.exports = ProductCard;
module.exports.default = ProductCard;
