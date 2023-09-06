import logo from './logo.svg';
import './App.css';
import {useState} from 'react';

function FilterableProductTable({ products}) {
  const [filterText, setFilterText] = useState('');
  const [inStockOnly, setInStockOnly] =useState(false);

  return (
    <div>
      <SearchBar 
          filterText={filterText}
          inStockOnly={inStockOnly} 
          onFilterTextChange={setFilterText}
          onInStockOnlyChange={setInStockOnly}/>
      <ProductTable 
      products={products}
      filterText={filterText}
      inStockOnly={inStockOnly} />
    </div>
  );
}

function ProductCategoryRow({ category }) {
  return (
    <tr>
    <th colSpan="2">
      {category}
      </th>
    </tr>
  );
}

function ProductRow({ product }) {
  const name = product.stocked ? product.name :
  <span style={{color: 'green'}}>
  {product.name}
  </span>;

  return (
    <tr>
      <td>{name}</td>
      <td>{product.price}</td>
    </tr>
  );
}

function ProductTable({ products, filterText, inStockOnly }) {
  const rows = [];
  let lastCategory = null;

  products.forEach((product) => {
    if (
      product.name.toLowerCase().indexOf(
        filterText.toLowerCase()
      ) === -1 
    ) {
      return;
    }
    if (product.category !== lastCategory) {
      rows.push(
        <ProductCategoryRow
        category={product.category}
        key={product.category} />
      );
    }
      rows.push(
        <ProductRow
          product={product}
          key={product.name} />
      );
  lastCategory = product.category;
});

  return (
    <table>
      <thead>
        <tr>
        <th>Name</th>
        <th>Price</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
      </table>
    );
  } 

  function SearchBar({
    filterText,
    inStockOnly,
    onFilterTextChange,
    onInStockOnlyChange
}) {
    return (
    <form>
      <input 
      type="text" 
      value={filterText} Placeholder="Search..."/>
      <label>
        <input 
        type="checkbox"
        checked={inStockOnly}
        onChange={(e) => onInStockOnlyChange(e.target.checked)}/>
        {' '}
        only show products in stock
      </label>
    </form>
  );
}

const PRODUCTS = [
  {category: "Fruits", price: "$1", stocked: true, name: "Apple"},
  {category: "Fruits", price: "$1", stocked: true, name: "Dragonfruit"},
  {category: "Fruits", price: "$2", stocked: true, name: "Passionfruit"},
  {category: "Fruits", price: "$1", stocked: true, name: "Spinach"},
  {category: "Fruits", price: "$1", stocked: true, name: "Pumpkin"},
  {category: "Fruits", price: "$1", stocked: true, name: "Peas"},
  ];


export default function App() {
  return <FilterableProductTable products={PRODUCTS} />;
}
