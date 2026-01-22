// Test optional chaining inside logical OR (||)
function Component(props: {value: {x: string} | null; fallback: string}) {
  'use memo';
  const value = props.value;
  return value?.x || props.fallback;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: null, fallback: 'default'}],
  sequentialRenders: [
    {value: null, fallback: 'default'},
    {value: {x: 'hello'}, fallback: 'default'},
    {value: {x: ''}, fallback: 'default'},
    {value: null, fallback: 'other'},
  ],
};
