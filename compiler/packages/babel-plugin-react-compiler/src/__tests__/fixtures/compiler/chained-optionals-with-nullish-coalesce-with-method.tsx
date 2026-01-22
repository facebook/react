import {Stringify} from 'shared-runtime';

// Test chained optional property access with nullish coalescing and method call
function Component(props: {obj: {a?: {b?: {getC(): string}}} | null}) {
  'use memo';
  const result = props.obj?.a?.b?.getC() ?? 'default';
  return <Stringify value={result} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{obj: {a: {b: {getC: () => 'deep'}}}}],
  sequentialRenders: [
    {obj: {a: {b: {getC: () => 'deep'}}}},
    {obj: null},
    {obj: {a: null}},
    {obj: {a: {b: null}}},
    {obj: {a: {b: {getC: () => 'other'}}}},
  ],
};
