import {Stringify} from 'shared-runtime';

/**
 * Bug: Optional chain `user?.name` in render + unconditional `user.email`
 * in closure. The closure's `user.email` makes the compiler think `user` is
 * non-null, converting the render's `user?.name` to `user.name` in cache keys.
 *
 * Related: https://github.com/facebook/react/issues/34752
 */
function Component({
  user,
}: {
  user: {name: string; email: string} | null;
}) {
  const sendEmail = () => {
    console.log(user.email);
  };
  return <Stringify onClick={sendEmail}>{user?.name}</Stringify>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{user: {name: 'Alice', email: 'alice@example.com'}}],
  sequentialRenders: [
    {user: {name: 'Alice', email: 'alice@example.com'}},
    {user: {name: 'Bob', email: 'bob@example.com'}},
  ],
};
