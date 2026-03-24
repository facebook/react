const React = require('react');
const ProductCard = require('./ProductCard');

function generateProducts(count) {
  const products = [];
  for (let i = 0; i < count; i++) {
    products.push({
      id: i,
      name: 'Product ' + i,
      price: ((i * 17 + 3) % 9999 / 100).toFixed(2),
      description:
        'Description for product ' +
        i +
        '. This is a moderately long description to simulate realistic content.',
    });
  }
  return products;
}

function ProductList({count}) {
  const products = generateProducts(count);
  return React.createElement(
    'div',
    {className: 'product-list'},
    products.map(function (p) {
      return React.createElement(ProductCard, {
        key: p.id,
        name: p.name,
        price: p.price,
        description: p.description,
      });
    })
  );
}

module.exports = ProductList;
module.exports.default = ProductList;
