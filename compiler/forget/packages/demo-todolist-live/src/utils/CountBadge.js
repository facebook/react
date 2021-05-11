import { forwardRef } from "react";

// Capped to 3 digits
const CountBadge = forwardRef(
  ({ count = 0, type = "danger", rounded = false }, ref) => {
    return (
      <span
        ref={ref}
        className={`badge ${rounded && "rounded-pill"} badge-${type}`}
      >
        {count > 999 ? 999 : count}
      </span>
    );
  }
);

export default CountBadge;
