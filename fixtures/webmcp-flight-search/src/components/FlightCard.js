export default function FlightCard({flight}) {
  return (
    <div className="flight-card">
      <div className="flight-details">
        <div className="flight-segment">
          <div className="airline-info">
            <span className="airline">{flight.airline}</span>
          </div>
          <div className="time-info">
            <div className="departure">
              <span className="time">{flight.departureTime}</span>
              <span className="airport">{flight.origin}</span>
            </div>
            <div className="duration-container">
              <div className="duration-line"></div>
              <span className="duration">{flight.duration}</span>
              <span className="stops">
                {flight.stops} stop{flight.stops !== 1 && 's'}
              </span>
            </div>
            <div className="arrival">
              <span className="time">{flight.arrivalTime}</span>
              <span className="airport">{flight.destination}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="price-section">
        <span className="price">${flight.price}</span>
        <span className="price-info">per person, round trip</span>
        <button className="select-flight-button">Select Flight</button>
      </div>
    </div>
  );
}
