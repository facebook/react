import {Stringify, useIdentity} from 'shared-runtime';

/**
 * Bug: Function passed as argument to a custom hook. The compiler assumes
 * hook arguments are invoked and hoists `item.id` from the closure into
 * a cache key that crashes when item is null.
 *
 * Related: https://github.com/facebook/react/issues/34194
 */
function Component({item}: {item: {id: string} | null}) {
  const processItem = () => {
    return item.id;
  };
  useIdentity(processItem);
  if (!item) return null;
  return <Stringify>{item.id}</Stringify>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{item: {id: 'abc'}}],
  sequentialRenders: [{item: {id: 'abc'}}, {item: {id: 'def'}}],
};
