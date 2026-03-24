const React = require('react');
const ProductCard = require('./ProductCard');

function generateProducts(start, end) {
  const products = [];
  for (let i = start; i < end; i++) {
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

// Simulated async data fetch — resolves immediately but goes through the
// async/microtask path so Suspense boundaries are exercised.
function fetchProducts(start, end) {
  return Promise.resolve(generateProducts(start, end));
}

// Async server component. Each chunk fetches its own batch and renders
// inside a Suspense boundary in the parent.
async function ProductListAsyncChunk({start, end}) {
  const products = await fetchProducts(start, end);
  return React.createElement(
    React.Fragment,
    null,
    products.map(function (p, i) {
      return React.createElement(ProductCard, {
        key: start + i,
        name: p.name,
        price: p.price,
        description: p.description,
      });
    })
  );
}

function ProductListAsync({count}) {
  const chunkSize = Math.ceil(count / 4);
  const chunks = [];
  for (let i = 0; i < count; i += chunkSize) {
    const end = Math.min(i + chunkSize, count);
    chunks.push(
      React.createElement(
        React.Suspense,
        {key: i, fallback: React.createElement('div', null, 'Loading...')},
        React.createElement(ProductListAsyncChunk, {start: i, end: end})
      )
    );
  }
  return React.createElement('div', {className: 'product-list'}, chunks);
}

module.exports = ProductListAsync;
module.exports.default = ProductListAsync;
