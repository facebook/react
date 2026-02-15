import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

export default function PriceRangeFilter({minPrice, maxPrice, onPriceChange}) {
  return (
    <div className="filter-group">
      <h3>Price</h3>
      <div className="slider-container">
        <Slider
          range
          min={0}
          max={1000}
          value={[minPrice, maxPrice]}
          onChange={value => onPriceChange(value)}
        />
        <div className="slider-labels">
          <span>${minPrice}</span>
          <span>${maxPrice}</span>
        </div>
      </div>
    </div>
  );
}
