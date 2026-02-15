import {useState, useEffect, useCallback} from 'react';
import {useWebMCPTool} from 'react-webmcp';
import Header from './Header';
import Toast from './Toast';
import FilterPanel from './FilterPanel';
import FlightList from './FlightList';
import AppliedFilters from './AppliedFilters';
import {flights} from '../data/flights';
import {dispatchAndWait} from '../utils/dispatchAndWait';
import '../App.css';

const defaultFilters = {
  stops: [],
  airlines: [],
  origins: [],
  destinations: [],
  minPrice: 0,
  maxPrice: 1000,
  departureTime: [0, 1439],
  arrivalTime: [0, 1439],
  flightIds: [],
};

export default function FlightResults({searchParams, setSearchParams}) {
  const [filteredFlights, setFilteredFlights] = useState(flights);
  const [toastMessage, setToastMessage] = useState('');
  const [filters, setFilters] = useState({...defaultFilters});
  const [completedRequestId, setCompletedRequestId] = useState(null);

  const handleFilterChange = useCallback(newFilters => {
    setFilters(prevFilters => ({...prevFilters, ...newFilters}));
  }, []);

  // Apply filters whenever they change
  useEffect(() => {
    let updatedFlights = [...flights];

    if (filters.stops.length > 0) {
      updatedFlights = updatedFlights.filter(f =>
        filters.stops.includes(f.stops)
      );
    }
    if (filters.airlines.length > 0) {
      updatedFlights = updatedFlights.filter(f =>
        filters.airlines.includes(f.airlineCode)
      );
    }
    if (filters.origins.length > 0) {
      updatedFlights = updatedFlights.filter(f =>
        filters.origins.includes(f.origin)
      );
    }
    if (filters.destinations.length > 0) {
      updatedFlights = updatedFlights.filter(f =>
        filters.destinations.includes(f.destination)
      );
    }
    if (filters.flightIds.length > 0) {
      updatedFlights = updatedFlights.filter(f =>
        filters.flightIds.includes(f.id)
      );
    }

    updatedFlights = updatedFlights.filter(
      f => f.price >= filters.minPrice && f.price <= filters.maxPrice
    );

    const toMinutes = time => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    updatedFlights = updatedFlights.filter(
      f =>
        toMinutes(f.departureTime) >= filters.departureTime[0] &&
        toMinutes(f.departureTime) <= filters.departureTime[1]
    );
    updatedFlights = updatedFlights.filter(
      f =>
        toMinutes(f.arrivalTime) >= filters.arrivalTime[0] &&
        toMinutes(f.arrivalTime) <= filters.arrivalTime[1]
    );

    setFilteredFlights(updatedFlights);
  }, [searchParams, filters]);

  // Fire completion event after state update
  useEffect(() => {
    if (completedRequestId) {
      window.dispatchEvent(
        new CustomEvent(`tool-completion-${completedRequestId}`)
      );
      setCompletedRequestId(null);
    }
  }, [completedRequestId]);

  // Listen for custom events dispatched by tools
  useEffect(() => {
    const handleSetFilters = event => {
      const {requestId, ...filterData} = event.detail;
      handleFilterChange({...defaultFilters, ...filterData});
      if (requestId) {
        setCompletedRequestId(requestId);
      }
      setToastMessage('The filter settings were updated by an AI agent');
    };

    const handleResetFilters = event => {
      const {requestId} = event.detail || {};
      handleFilterChange({...defaultFilters});
      if (requestId) {
        setCompletedRequestId(requestId);
      }
      setToastMessage('The filter settings were updated by an AI agent');
    };

    const handleSearchFlights = event => {
      setSearchParams(event.detail);
    };

    window.addEventListener('setFilters', handleSetFilters);
    window.addEventListener('resetFilters', handleResetFilters);
    window.addEventListener('searchFlights', handleSearchFlights);

    return () => {
      window.removeEventListener('setFilters', handleSetFilters);
      window.removeEventListener('resetFilters', handleResetFilters);
      window.removeEventListener('searchFlights', handleSearchFlights);
    };
  }, [handleFilterChange, setSearchParams]);

  // ---- WebMCP Tool Registrations via useWebMCPTool ----

  // 1. listFlights (read-only)
  useWebMCPTool({
    name: 'listFlights',
    description: 'Returns all flights available.',
    inputSchema: {},
    outputSchema: {
      type: 'object',
      properties: {
        result: {
          type: 'array',
          description: 'The list of flights.',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'number',
                description: 'The unique identifier for the flight.',
              },
              airline: {
                type: 'string',
                description: 'The airline of the flight.',
              },
              origin: {type: 'string', description: 'The origin airport.'},
              destination: {
                type: 'string',
                description: 'The destination airport.',
              },
              departureTime: {
                type: 'string',
                description: 'The departure time.',
              },
              arrivalTime: {type: 'string', description: 'The arrival time.'},
              duration: {
                type: 'string',
                description: 'The duration of the flight.',
              },
              stops: {type: 'number', description: 'The number of stops.'},
              price: {type: 'number', description: 'The price of the flight.'},
            },
            required: [
              'id',
              'airline',
              'origin',
              'destination',
              'departureTime',
              'arrivalTime',
              'duration',
              'stops',
              'price',
            ],
          },
        },
      },
      required: ['result'],
    },
    annotations: {readOnlyHint: true},
    execute: () => flights,
  });

  // 2. setFilters
  useWebMCPTool({
    name: 'setFilters',
    description: 'Sets the filters for flights.',
    inputSchema: {
      type: 'object',
      properties: {
        stops: {
          type: 'array',
          description: 'The list of stop counts to filter by.',
          items: {type: 'number'},
        },
        airlines: {
          type: 'array',
          description: 'The list of airlines IATA codes to filter by.',
          items: {type: 'string', pattern: '^[A-Z]{2}$'},
        },
        origins: {
          type: 'array',
          description:
            'The list of origin airports to filter by, using the 3 letter IATA code.',
          items: {type: 'string', pattern: '^[A-Z]{3}$'},
        },
        destinations: {
          type: 'array',
          description:
            'The list of destination airports to filter by, using the 3 letter IATA code.',
          items: {type: 'string', pattern: '^[A-Z]{3}$'},
        },
        minPrice: {type: 'number', description: 'The minimum price.'},
        maxPrice: {type: 'number', description: 'The maximum price.'},
        departureTime: {
          type: 'array',
          description:
            'The departure time range in minutes from the start of the day (0-1439).',
          items: {type: 'number'},
        },
        arrivalTime: {
          type: 'array',
          description:
            'The arrival time range in minutes from the start of the day (0-1439).',
          items: {type: 'number'},
        },
        flightIds: {
          type: 'array',
          description: 'The list of flight IDs to filter by.',
          items: {type: 'number'},
        },
      },
    },
    outputSchema: {
      type: 'string',
      description:
        'a message describing if the filter update request was successful or not',
    },
    annotations: {readOnlyHint: false},
    execute: async filterParams => {
      return dispatchAndWait(
        'setFilters',
        filterParams,
        'Filters successfully updated.'
      );
    },
  });

  // 3. resetFilters
  useWebMCPTool({
    name: 'resetFilters',
    description: 'Resets all filters to their default values.',
    inputSchema: {},
    outputSchema: {
      type: 'string',
      description:
        'a message describing if the filter reset request was successful or not',
    },
    annotations: {readOnlyHint: false},
    execute: async () => {
      return dispatchAndWait(
        'resetFilters',
        {},
        'Filters successfully updated.'
      );
    },
  });

  // 4. searchFlights (also available on results page)
  useWebMCPTool({
    name: 'searchFlights',
    description: 'Searches for flights with the given parameters.',
    inputSchema: {
      type: 'object',
      properties: {
        origin: {
          type: 'string',
          description: 'City or airport IATA code for the origin.',
          pattern: '^[A-Z]{3}$',
          minLength: 3,
          maxLength: 3,
        },
        destination: {
          type: 'string',
          description: 'City or airport IATA code for the destination.',
          pattern: '^[A-Z]{3}$',
          minLength: 3,
          maxLength: 3,
        },
        tripType: {
          type: 'string',
          enum: ['one-way', 'round-trip'],
          description: 'The trip type.',
        },
        outboundDate: {
          type: 'string',
          description: 'The outbound date in YYYY-MM-DD format.',
          format: 'date',
        },
        inboundDate: {
          type: 'string',
          description: 'The inbound date in YYYY-MM-DD format.',
          format: 'date',
        },
        passengers: {
          type: 'number',
          description: 'The number of passengers.',
        },
      },
      required: [
        'origin',
        'destination',
        'tripType',
        'outboundDate',
        'inboundDate',
        'passengers',
      ],
    },
    outputSchema: {
      type: 'string',
      description: 'a message describing the result of the flight search',
    },
    annotations: {readOnlyHint: false},
    execute: async params => {
      if (!params.destination.match(/^[A-Z]{3}$/)) {
        return 'ERROR: `destination` must be a 3 letter city or airport IATA code.';
      }
      if (!params.origin.match(/^[A-Z]{3}$/)) {
        return 'ERROR: `origin` must be a 3 letter city or airport IATA code.';
      }
      return dispatchAndWait(
        'searchFlights',
        params,
        'A new flight search was started.'
      );
    },
  });

  const isDemoQuery =
    searchParams.origin === 'LON' &&
    searchParams.destination === 'NYC' &&
    searchParams.tripType === 'round-trip';

  return (
    <div className="app">
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage('')} />
      )}
      <Header searchParams={searchParams} />
      <main className="app-main">
        {isDemoQuery ? (
          <>
            <FilterPanel
              filters={filters}
              onFilterChange={handleFilterChange}
            />
            <div className="results-container">
              <AppliedFilters
                filters={filters}
                onFilterChange={handleFilterChange}
              />
              <FlightList flights={filteredFlights} />
            </div>
          </>
        ) : (
          <div className="no-results">
            <h2>No results found</h2>
            <p>
              The demo currently only supports the following query:
              <br />
              Origin: London, UK
              <br />
              Destination: New York, US
              <br />
              Trip Type: round-trip
              <br />
              Passengers: 2
            </p>
            <p>
              Your query:
              <br />
              Origin: {searchParams.origin}
              <br />
              Destination: {searchParams.destination}
              <br />
              Trip Type: {searchParams.tripType}
              <br />
              Outbound Date: {searchParams.outboundDate}
              <br />
              Inbound Date: {searchParams.inboundDate}
              <br />
              Passengers: {searchParams.passengers}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
