import {Stringify} from 'shared-runtime';

// Test deeply nested: optional in ternary condition with logical fallback using method calls
function Component(props: {
  value: {getFlag(): boolean; getData(): string} | null;
  fallback: string;
}) {
  'use memo';
  const value = props.value;
  const result = (value?.getFlag() ? value?.getData() : null) ?? props.fallback;
  return <Stringify value={result} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      value: {getFlag: () => true, getData: () => 'success'},
      fallback: 'default',
    },
  ],
  sequentialRenders: [
    {
      value: {getFlag: () => true, getData: () => 'success'},
      fallback: 'default',
    },
    {
      value: {getFlag: () => false, getData: () => 'success'},
      fallback: 'default',
    },
    {value: null, fallback: 'default'},
    {value: {getFlag: () => true, getData: () => 'other'}, fallback: 'default'},
  ],
};
