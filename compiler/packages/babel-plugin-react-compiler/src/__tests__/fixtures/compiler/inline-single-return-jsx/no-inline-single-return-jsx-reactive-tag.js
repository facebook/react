// @enableInlineSingleReturnJSX @compilationMode(infer)
import {useEffect, useState} from 'react';

function Component({a, b}) {
  let Tag = a === 0 ? Child1 : Child2;
  return (
    <Tag value={a}>
      <div>{b}</div>
    </Tag>
  );
}

function Child1(props) {
  'use no forget';
  return <Child {...props} />;
}

function Child2(props) {
  'use no forget';
  return <Child {...props} />;
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
