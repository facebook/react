import {Stringify} from 'shared-runtime';

/**
 * Bug: Deep property access on nullable base inside closure. The compiler
 * hoists `post.author.profile.avatar` as a cache key that crashes when
 * post is null, even though the early return guard prevents rendering.
 *
 * Related: https://github.com/facebook/react/issues/35762
 */
function Component({
  post,
}: {
  post: {author: {profile: {avatar: string}}} | null;
}) {
  const handleClick = () => {
    console.log(post.author.profile.avatar);
  };
  if (!post) return null;
  return (
    <Stringify onClick={handleClick}>{post.author.profile.avatar}</Stringify>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{post: {author: {profile: {avatar: 'pic.jpg'}}}}],
  sequentialRenders: [
    {post: {author: {profile: {avatar: 'pic.jpg'}}}},
    {post: {author: {profile: {avatar: 'new.jpg'}}}},
  ],
};
