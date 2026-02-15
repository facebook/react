import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useWebMCPTool} from 'react-webmcp';
import {dispatchAndWait} from '../utils/dispatchAndWait';
import '../App.css';

export default function FlightSearch({searchParams, setSearchParams}) {
  const navigate = useNavigate();
  const [completedRequestId, setCompletedRequestId] = useState(null);

  // Dispatch the tool-completion event after state update
  useEffect(() => {
    if (completedRequestId) {
      window.dispatchEvent(
        new CustomEvent(`tool-completion-${completedRequestId}`)
      );
      setCompletedRequestId(null);
    }
  }, [completedRequestId]);

  // Listen for the searchFlights custom event (dispatched by the tool)
  useEffect(() => {
    const handleSearchFlights = event => {
      const {requestId, ...params} = event.detail;
      const newSearchParams = new URLSearchParams();
      newSearchParams.append('origin', params.origin);
      newSearchParams.append('destination', params.destination);
      newSearchParams.append('tripType', params.tripType);
      newSearchParams.append('outboundDate', params.outboundDate);
      newSearchParams.append('inboundDate', params.inboundDate);
      newSearchParams.append('passengers', String(params.passengers));
      navigate(`/results?${newSearchParams.toString()}`);

      if (requestId) {
        setCompletedRequestId(requestId);
      }
    };

    window.addEventListener('searchFlights', handleSearchFlights);
    return () => {
      window.removeEventListener('searchFlights', handleSearchFlights);
    };
  }, [navigate]);

  // Register the searchFlights tool via useWebMCPTool
  useWebMCPTool({
    name: 'searchFlights',
    description: 'Searches for flights with the given parameters.',
    inputSchema: {
      type: 'object',
      properties: {
        origin: {
          type: 'string',
          description:
            "City or airport IATA code for the origin. Prefer city IATA codes when a specific airport is not provided. Example: 'RIO' for 'Rio de Janeiro'",
          pattern: '^[A-Z]{3}$',
          minLength: 3,
          maxLength: 3,
        },
        destination: {
          type: 'string',
          description:
            "City or airport IATA code for the destination airport. Prefer city IATA codes when a specific airport is not provided. Example: 'RIO' for 'Rio de Janeiro'",
          pattern: '^[A-Z]{3}$',
          minLength: 3,
          maxLength: 3,
        },
        tripType: {
          type: 'string',
          enum: ['one-way', 'round-trip'],
          description: 'The trip type. Can be "one-way" or "round-trip".',
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
      description:
        'a message describing the result of the flight search request',
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

  const handleSubmit = event => {
    event.preventDefault();
    const newSearchParams = new URLSearchParams();
    newSearchParams.append('origin', searchParams.origin);
    newSearchParams.append('destination', searchParams.destination);
    newSearchParams.append('tripType', searchParams.tripType);
    newSearchParams.append('outboundDate', searchParams.outboundDate);
    newSearchParams.append('inboundDate', searchParams.inboundDate);
    newSearchParams.append('passengers', String(searchParams.passengers));
    navigate(`/results?${newSearchParams.toString()}`);
  };

  const handleChange = event => {
    const {name, value} = event.target;
    setSearchParams({
      [name]: name === 'passengers' ? parseInt(value, 10) : value,
    });
  };

  return (
    <div className="app">
      <main className="app-main">
        <div className="search-form-container">
          <h1>Flight Search</h1>
          <form onSubmit={handleSubmit} className="flight-search-form">
            <div className="form-group">
              <label htmlFor="origin">Origin</label>
              <input
                type="text"
                id="origin"
                name="origin"
                placeholder="Origin city"
                value={searchParams.origin}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="destination">Destination</label>
              <input
                type="text"
                id="destination"
                name="destination"
                placeholder="Destination city"
                value={searchParams.destination}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="outboundDate">Outbound Date</label>
              <input
                type="date"
                id="outboundDate"
                name="outboundDate"
                value={searchParams.outboundDate}
                onChange={handleChange}
              />
            </div>
            {searchParams.tripType === 'round-trip' && (
              <div className="form-group">
                <label htmlFor="inboundDate">Inbound Date</label>
                <input
                  type="date"
                  id="inboundDate"
                  name="inboundDate"
                  value={searchParams.inboundDate}
                  onChange={handleChange}
                />
              </div>
            )}
            <div className="form-group">
              <label>Trip Type</label>
              <div className="radio-group">
                <div>
                  <input
                    type="radio"
                    id="one-way"
                    name="tripType"
                    value="one-way"
                    checked={searchParams.tripType === 'one-way'}
                    onChange={handleChange}
                  />
                  <label htmlFor="one-way">One-way</label>
                </div>
                <div>
                  <input
                    type="radio"
                    id="round-trip"
                    name="tripType"
                    value="round-trip"
                    checked={searchParams.tripType === 'round-trip'}
                    onChange={handleChange}
                  />
                  <label htmlFor="round-trip">Round-trip</label>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="passengers">Number of Passengers</label>
              <input
                type="number"
                id="passengers"
                name="passengers"
                min="1"
                value={searchParams.passengers}
                onChange={handleChange}
              />
            </div>
            <button type="submit" className="search-flights-button">
              Search Flights
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
