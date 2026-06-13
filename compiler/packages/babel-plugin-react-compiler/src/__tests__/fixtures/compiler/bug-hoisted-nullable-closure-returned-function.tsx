import {createHookWrapper} from 'shared-runtime';

/**
 * Bug: Returned function accessing nullable prop. The compiler classifies
 * returned functions as "assumed invoked" and hoists `item.id` as a cache
 * key that crashes when item is null.
 *
 * Related: https://github.com/facebook/react/issues/35762
 */
function useHandler({item}: {item: {id: string} | null}) {
  const handler = () => {
    console.log(item.id);
  };
  return handler;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHandler),
  params: [{item: {id: 'abc'}}],
  sequentialRenders: [{item: {id: 'abc'}}, {item: {id: 'def'}}],
};
