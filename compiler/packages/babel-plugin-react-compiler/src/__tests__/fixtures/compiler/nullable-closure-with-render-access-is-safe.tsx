import {Stringify} from 'shared-runtime';

/**
 * Correctness guard: When there is a render-time property access (user.name)
 * in the outer function body, it proves non-nullness at that point. The cache
 * key should remain `user.name` (non-optional). This fixture must NOT change
 * after the nullable-closure fix.
 */
function Component({user}: {user: {name: string}}) {
  const name = user.name;
  const handleClick = () => {
    console.log(user.name);
  };
  return <Stringify onClick={handleClick}>{name}</Stringify>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{user: {name: 'Alice'}}],
  sequentialRenders: [{user: {name: 'Alice'}}, {user: {name: 'Bob'}}],
};
