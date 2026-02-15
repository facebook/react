import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

export default function TimeRangeFilter({title, min, max, value, onChange}) {
  const formatTime = minutes => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="filter-group">
      <h3>{title}</h3>
      <div className="slider-container">
        <Slider
          range
          min={min}
          max={max}
          value={value}
          onChange={newValue => onChange(newValue)}
        />
        <div className="slider-labels">
          <span>{formatTime(value[0])}</span>
          <span>{formatTime(value[1])}</span>
        </div>
      </div>
    </div>
  );
}
