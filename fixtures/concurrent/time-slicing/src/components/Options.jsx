import React from "react";

const Options = ({ strategy, label, setStrategy, currentStrategy }) => (
  <label className={strategy === currentStrategy ? "selected" : null}>
    <input
      type="radio"
      id={strategy}
      checked={strategy === currentStrategy}
      onChange={() => setStrategy(strategy)}
    />
    {label}
  </label>
);

export default Options;
