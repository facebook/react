export default function Header({searchParams}) {
  return (
    <div className="header">
      <div className="search-inputs">
        <div className="search-field">
          <span className="icon">📍</span>
          <span>{searchParams.origin}</span>
        </div>
        <div className="search-field">
          <span className="icon">✈️</span>
          <span>{searchParams.destination}</span>
        </div>
        <div className="search-field">
          <span className="icon">📅</span>
          <span>{searchParams.outboundDate}</span>
        </div>
        {searchParams.tripType === 'round-trip' && (
          <div className="search-field">
            <span className="icon">📅</span>
            <span>{searchParams.inboundDate}</span>
          </div>
        )}
        <div className="search-field">
          <span className="icon">👤</span>
          <span>{searchParams.passengers} passengers</span>
        </div>
        <div className="search-field">
          <span>{searchParams.tripType}</span>
        </div>
      </div>
    </div>
  );
}
