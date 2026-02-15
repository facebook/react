import FlightCard from './FlightCard';

export default function FlightList({flights}) {
  return (
    <div className="flight-list">
      <h2>Flight Results</h2>
      {flights.map(flight => (
        <FlightCard key={flight.id} flight={flight} />
      ))}
    </div>
  );
}
