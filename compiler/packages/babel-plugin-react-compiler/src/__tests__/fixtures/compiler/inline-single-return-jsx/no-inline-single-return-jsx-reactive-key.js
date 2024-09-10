// @enableInlineSingleReturnJSX @compilationMode(infer)
import {useEffect, useState} from 'react';

function Component({a, b}) {
  return <Child key={b} value={a} />;
}

function Child({value, children}) {
  const [state, setState] = useState(value);
  useEffect(() => {
    if (state === 0 && value === 0) {
      setState(1);
    }
  }, [state]);
  return (
    <div>
      {state}
      <span>{value}</span>
      {children}
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: 0, b: 0}],
  sequentialRenders: [
    {a: 0, b: 0},
    {a: 1, b: 0},
    {a: 1, b: 1},
    {a: 0, b: 1},
    {a: 0, b: 0},
    {a: 1, b: 1},
  ],
};
