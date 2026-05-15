import {Stringify} from 'shared-runtime';

/**
 * Bug: TypeScript non-null assertion (!) is transparent to the compiler.
 * `data!.id` inside the closure is lowered as `data.id`, causing the compiler
 * to hoist `data.id` as a cache key that crashes when data is undefined.
 *
 * Related: https://github.com/facebook/react/issues/34194
 */
function Component({data}: {data: {id: string} | undefined}) {
  const handleClick = () => {
    console.log(data!.id);
  };
  if (!data) return null;
  return <Stringify onClick={handleClick}>{data.id}</Stringify>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{data: {id: 'abc'}}],
  sequentialRenders: [{data: {id: 'abc'}}, {data: {id: 'def'}}],
};
