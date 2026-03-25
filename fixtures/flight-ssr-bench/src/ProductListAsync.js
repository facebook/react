import {Suspense} from 'react';
import ProductCard from './ProductCard';

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

function fetchProducts(start, end) {
  return Promise.resolve(generateProducts(start, end));
}

async function ProductListAsyncChunk({start, end}) {
  const products = await fetchProducts(start, end);
  return (
    <>
      {products.map(p => (
        <ProductCard
          key={p.id}
          name={p.name}
          price={p.price}
          description={p.description}
        />
      ))}
    </>
  );
}

export default function ProductListAsync({count}) {
  const chunkSize = Math.ceil(count / 4);
  const chunks = [];
  for (let i = 0; i < count; i += chunkSize) {
    const end = Math.min(i + chunkSize, count);
    chunks.push(
      <Suspense key={i} fallback={<div>Loading...</div>}>
        <ProductListAsyncChunk start={i} end={end} />
      </Suspense>
    );
  }
  return <div className="product-list">{chunks}</div>;
}
