import {useMemo} from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useSearchParams,
} from 'react-router-dom';
import {WebMCPProvider} from 'react-webmcp';
import FlightSearch from './components/FlightSearch';
import FlightResults from './components/FlightResults';
import './App.css';

function AppContent() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(
    () => ({
      origin: searchParams.get('origin') || '',
      destination: searchParams.get('destination') || '',
      tripType: searchParams.get('tripType') || 'one-way',
      outboundDate:
        searchParams.get('outboundDate') ||
        new Date().toISOString().split('T')[0],
      inboundDate:
        searchParams.get('inboundDate') ||
        new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      passengers: Number(searchParams.get('passengers')) || 1,
    }),
    [searchParams]
  );

  const handleSetSearchParams = newParams => {
    const updated = {...params, ...newParams};
    setSearchParams(
      {
        origin: updated.origin,
        destination: updated.destination,
        tripType: updated.tripType,
        outboundDate: updated.outboundDate,
        inboundDate: updated.inboundDate,
        passengers: String(updated.passengers),
      },
      {replace: true}
    );
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <FlightSearch
            searchParams={params}
            setSearchParams={handleSetSearchParams}
          />
        }
      />
      <Route
        path="/results"
        element={
          <FlightResults
            searchParams={params}
            setSearchParams={handleSetSearchParams}
          />
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <WebMCPProvider>
      <Router>
        <AppContent />
      </Router>
    </WebMCPProvider>
  );
}
