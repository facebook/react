import {Stringify} from 'shared-runtime';

/**
 * Bug: Multiple closures accessing different nullable props. Both `user.name`
 * and `post.title` are hoisted as cache keys that crash when either is null.
 *
 * Related: https://github.com/facebook/react/issues/35762
 */
function Component({
  user,
  post,
}: {
  user: {name: string} | null;
  post: {title: string} | null;
}) {
  const handleUser = () => {
    console.log(user.name);
  };
  const handlePost = () => {
    console.log(post.title);
  };
  if (!user || !post) return null;
  return (
    <Stringify onUser={handleUser} onPost={handlePost}>
      {user.name}
      {post.title}
    </Stringify>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{user: {name: 'Alice'}, post: {title: 'Hello'}}],
  sequentialRenders: [
    {user: {name: 'Alice'}, post: {title: 'Hello'}},
    {user: {name: 'Bob'}, post: {title: 'World'}},
  ],
};
