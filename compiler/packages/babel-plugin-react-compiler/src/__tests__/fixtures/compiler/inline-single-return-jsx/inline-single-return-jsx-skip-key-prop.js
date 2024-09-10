// @enableInlineSingleReturnJSX @compilationMode(infer)

import {Stringify} from 'shared-runtime';

function Child(props) {
  'use no forget';
  return <Stringify props={props} />;
}

function Component({a, b}) {
  return <Child value={a} key={1} />;
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
