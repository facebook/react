import ProductCard from './ProductCard';

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

export default function ProductList({count}) {
  const products = generateProducts(count);
  return (
    <div className="product-list">
      {products.map(p => (
        <ProductCard
          key={p.id}
          name={p.name}
          price={p.price}
          description={p.description}
        />
      ))}
    </div>
  );
}
