import {Stringify} from 'shared-runtime';

/**
 * Bug: The compiler hoists `user.name` from the onClick closure into a cache
 * key check that runs during render. When `user` is null, this crashes with
 * TypeError even though the source code guards with an early return.
 *
 * The compiled output should use `user?.name` (optional) in the cache key,
 * not `user.name` (non-optional).
 *
 * Related: https://github.com/facebook/react/issues/35762
 */
function Component({user}: {user: {name: string} | null}) {
  const handleClick = () => {
    console.log(user.name);
  };
  if (!user) return null;
  return <Stringify onClick={handleClick}>{user.name}</Stringify>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{user: {name: 'Alice'}}],
  sequentialRenders: [{user: {name: 'Alice'}}, {user: {name: 'Bob'}}],
};
