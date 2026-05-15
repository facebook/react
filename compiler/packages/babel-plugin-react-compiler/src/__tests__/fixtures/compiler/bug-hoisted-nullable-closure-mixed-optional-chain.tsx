import {Stringify} from 'shared-runtime';

/**
 * Bug: `user?.company.name` inside a closure — the compiler strips the `?.`
 * when computing cache keys, producing `user.company.name` which crashes
 * when user is null.
 *
 * Related: https://github.com/facebook/react/issues/34752
 */
function Component({user}: {user: {company: {name: string}} | null}) {
  const handleClick = () => {
    console.log(user?.company.name);
  };
  return <Stringify onClick={handleClick}>Click</Stringify>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{user: {company: {name: 'Acme'}}}],
  sequentialRenders: [
    {user: {company: {name: 'Acme'}}},
    {user: {company: {name: 'Corp'}}},
  ],
};
