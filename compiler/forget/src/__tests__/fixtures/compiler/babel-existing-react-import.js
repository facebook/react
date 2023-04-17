import * as React from "react";
import { useMemo } from "react";

function Component(props) {
  const [x] = React.useState(0);
  const expensiveNumber = useMemo(() => calculateExpensiveNumber(x), [x]);

  return <div>{expensiveNumber}</div>;
}

function Component2(props) {
  const [x] = React.useState(0);
  const expensiveNumber = useMemo(() => calculateExpensiveNumber(x), [x]);

  return <div>{expensiveNumber}</div>;
}
