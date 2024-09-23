import {identity} from 'shared-runtime';

function useFoo(maybeNullObject: {value: {inner: number}} | null) {
  const y = [];
  try {
    y.push(identity(maybeNullObject.value.inner));
  } catch {
    y.push('null');
  }

  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [null],
  sequentialRenders: [null, {value: 2}, {value: 3}, null],
};
