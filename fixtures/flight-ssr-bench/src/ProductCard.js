'use client';

export default function ProductCard({name, price, description}) {
  return (
    <div className="product-card">
      <h3>{name}</h3>
      <span className="price">${price}</span>
      <p>{description}</p>
      <button>Add to cart</button>
    </div>
  );
}
