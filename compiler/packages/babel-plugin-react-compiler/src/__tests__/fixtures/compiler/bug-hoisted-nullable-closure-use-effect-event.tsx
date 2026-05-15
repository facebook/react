import {Stringify} from 'shared-runtime';

/**
 * Bug: Closure passed as JSX prop accesses nullable state. The compiler hoists
 * `data.value` into a cache key that crashes because data could be null.
 *
 * Related: https://github.com/facebook/react/issues/34752
 */
function Component({data}: {data: {value: string} | null}) {
  const onData = () => {
    console.log(data.value);
  };
  return <Stringify onData={onData}>{data?.value}</Stringify>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{data: {value: 'hello'}}],
  sequentialRenders: [{data: {value: 'hello'}}, {data: {value: 'world'}}],
};
