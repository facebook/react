export default function Select({ value, options, onChange }) {
  return (
    <div className="Select">
      {options.map(o => {
        if (value === o.value) {
          return (
            <button key={o.value} className="selected">
              {" "}
              {o.label}{" "}
            </button>
          );
        } else {
          return (
            <button key={o.value} onClick={() => onChange(o.value)}>
              {o.label}
            </button>
          );
        }
      })}
    </div>
  );
}
