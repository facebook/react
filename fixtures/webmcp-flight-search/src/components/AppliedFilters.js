import {useState, useEffect} from 'react';
import {airports} from '../data/airports';

export default function AppliedFilters({filters, onFilterChange}) {
  const handleRemoveFilter = (filterType, value) => {
    const newFilters = {...filters};
    if (filterType === 'minPrice' || filterType === 'maxPrice') {
      newFilters.minPrice = 0;
      newFilters.maxPrice = 1000;
    } else if (filterType === 'departureTime') {
      newFilters.departureTime = [0, 1439];
    } else if (filterType === 'arrivalTime') {
      newFilters.arrivalTime = [0, 1439];
    } else if (Array.isArray(newFilters[filterType])) {
      newFilters[filterType] = newFilters[filterType].filter(
        item => item !== value
      );
    }
    onFilterChange(newFilters);
  };

  const handleClearAll = () => {
    onFilterChange({
      stops: [],
      airlines: [],
      origins: [],
      destinations: [],
      minPrice: 0,
      maxPrice: 1000,
      departureTime: [0, 1439],
      arrivalTime: [0, 1439],
      flightIds: [],
    });
  };

  const isAnyFilterApplied =
    filters.stops.length > 0 ||
    filters.airlines.length > 0 ||
    filters.origins.length > 0 ||
    filters.destinations.length > 0 ||
    filters.minPrice !== 0 ||
    filters.maxPrice !== 1000 ||
    filters.departureTime[0] !== 0 ||
    filters.departureTime[1] !== 1439 ||
    filters.arrivalTime[0] !== 0 ||
    filters.arrivalTime[1] !== 1439 ||
    filters.flightIds.length > 0;

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isAnyFilterApplied) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isAnyFilterApplied]);

  return (
    <div
      className={`applied-filters ${isVisible ? 'fade-in' : 'fade-out'}`}
      style={{display: isAnyFilterApplied || isVisible ? 'block' : 'none'}}>
      <div className="filters-list">
        {filters.stops.map(stop => (
          <div key={`stop-${stop}`} className="filter-pill">
            {stop === 0 ? 'Nonstop' : `${stop} stop${stop > 1 ? 's' : ''}`}
            <button onClick={() => handleRemoveFilter('stops', stop)}>x</button>
          </div>
        ))}
        {filters.airlines.map(airline => (
          <div key={`airline-${airline}`} className="filter-pill">
            {airline}
            <button onClick={() => handleRemoveFilter('airlines', airline)}>
              x
            </button>
          </div>
        ))}
        {filters.origins.map(origin => (
          <div key={`origin-${origin}`} className="filter-pill">
            {airports[origin]}
            <button onClick={() => handleRemoveFilter('origins', origin)}>
              x
            </button>
          </div>
        ))}
        {filters.destinations.map(destination => (
          <div key={`destination-${destination}`} className="filter-pill">
            {airports[destination]}
            <button
              onClick={() => handleRemoveFilter('destinations', destination)}>
              x
            </button>
          </div>
        ))}
        {(filters.minPrice !== 0 || filters.maxPrice !== 1000) && (
          <div className="filter-pill">
            Price
            <button onClick={() => handleRemoveFilter('minPrice')}>x</button>
          </div>
        )}
        {(filters.departureTime[0] !== 0 ||
          filters.departureTime[1] !== 1439) && (
          <div className="filter-pill">
            Departure time
            <button onClick={() => handleRemoveFilter('departureTime')}>
              x
            </button>
          </div>
        )}
        {(filters.arrivalTime[0] !== 0 || filters.arrivalTime[1] !== 1439) && (
          <div className="filter-pill">
            Arrival time
            <button onClick={() => handleRemoveFilter('arrivalTime')}>x</button>
          </div>
        )}
        {filters.flightIds.length > 0 && (
          <div className="filter-pill">
            {`${filters.flightIds.length} flight ID${
              filters.flightIds.length > 1 ? 's' : ''
            }`}
            <button
              onClick={() =>
                onFilterChange({
                  ...filters,
                  flightIds: [],
                })
              }>
              x
            </button>
          </div>
        )}
        <button onClick={handleClearAll} className="clear-all-btn">
          Clear All
        </button>
      </div>
    </div>
  );
}
