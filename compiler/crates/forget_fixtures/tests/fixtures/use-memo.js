import { useMemo } from "react";

function Component(x) {
  const y = useMemo(() => {
    return x;
  });
  return y;
}
