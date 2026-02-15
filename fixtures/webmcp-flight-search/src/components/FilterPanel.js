import PriceRangeFilter from './PriceRangeFilter';
import TimeRangeFilter from './TimeRangeFilter';
import {flights} from '../data/flights';
import {airports} from '../data/airports';

export default function FilterPanel({filters, onFilterChange}) {
  const originAirports = [...new Set(flights.map(f => f.origin))];
  const destinationAirports = [...new Set(flights.map(f => f.destination))];

  const handleStopChange = e => {
    const {value, checked} = e.target;
    const numValue = parseInt(value, 10);
    const newStops = checked
      ? [...filters.stops, numValue]
      : filters.stops.filter(s => s !== numValue);
    onFilterChange({stops: newStops});
  };

  const handleAirlineChange = e => {
    const {value, checked} = e.target;
    const newAirlines = checked
      ? [...filters.airlines, value]
      : filters.airlines.filter(a => a !== value);
    onFilterChange({airlines: newAirlines});
  };

  const handleOriginChange = e => {
    const {value, checked} = e.target;
    const newOrigins = checked
      ? [...filters.origins, value]
      : filters.origins.filter(o => o !== value);
    onFilterChange({origins: newOrigins});
  };

  const handleDestinationChange = e => {
    const {value, checked} = e.target;
    const newDestinations = checked
      ? [...filters.destinations, value]
      : filters.destinations.filter(d => d !== value);
    onFilterChange({destinations: newDestinations});
  };

  const handlePriceChange = value => {
    onFilterChange({minPrice: value[0], maxPrice: value[1]});
  };

  const handleDepartureTimeChange = value => {
    onFilterChange({departureTime: value});
  };

  const handleArrivalTimeChange = value => {
    onFilterChange({arrivalTime: value});
  };

  return (
    <div className="filter-panel">
      <h2>Filters</h2>
      <PriceRangeFilter
        minPrice={filters.minPrice}
        maxPrice={filters.maxPrice}
        onPriceChange={handlePriceChange}
      />
      <TimeRangeFilter
        title="Departure Time"
        min={0}
        max={1439}
        value={filters.departureTime}
        onChange={handleDepartureTimeChange}
      />
      <TimeRangeFilter
        title="Arrival Time"
        min={0}
        max={1439}
        value={filters.arrivalTime}
        onChange={handleArrivalTimeChange}
      />
      <div className="filter-group">
        <h3>Stops</h3>
        <label>
          <input
            type="checkbox"
            name="stops"
            value="0"
            onChange={handleStopChange}
            checked={filters.stops.includes(0)}
          />{' '}
          Nonstop
        </label>
        <label>
          <input
            type="checkbox"
            name="stops"
            value="1"
            onChange={handleStopChange}
            checked={filters.stops.includes(1)}
          />{' '}
          1 stop
        </label>
        <label>
          <input
            type="checkbox"
            name="stops"
            value="2"
            onChange={handleStopChange}
            checked={filters.stops.includes(2)}
          />{' '}
          2 stops
        </label>
      </div>
      <div className="filter-group">
        <h3>Airlines</h3>
        {[
          {name: 'United Airlines', code: 'UA'},
          {name: 'Delta Air Lines', code: 'DL'},
          {name: 'American Airlines', code: 'AA'},
          {name: 'Southwest Airlines', code: 'WN'},
          {name: 'JetBlue Airways', code: 'B6'},
          {name: 'Spirit Airlines', code: 'NK'},
          {name: 'Alaska Airlines', code: 'AS'},
          {name: 'Frontier Airlines', code: 'F9'},
        ].map(airline => (
          <label key={airline.code}>
            <input
              type="checkbox"
              name="airline"
              value={airline.code}
              onChange={handleAirlineChange}
              checked={filters.airlines.includes(airline.code)}
            />{' '}
            {airline.name}
          </label>
        ))}
      </div>
      <div className="filter-group">
        <h3>Origin Airport</h3>
        {originAirports.map(airport => (
          <label key={airport}>
            <input
              type="checkbox"
              name="origin"
              value={airport}
              onChange={handleOriginChange}
              checked={filters.origins.includes(airport)}
            />{' '}
            {airports[airport]}
          </label>
        ))}
      </div>
      <div className="filter-group">
        <h3>Destination Airport</h3>
        {destinationAirports.map(airport => (
          <label key={airport}>
            <input
              type="checkbox"
              name="destination"
              value={airport}
              onChange={handleDestinationChange}
              checked={filters.destinations.includes(airport)}
            />{' '}
            {airports[airport]}
          </label>
        ))}
      </div>
    </div>
  );
}
