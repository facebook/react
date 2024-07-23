import fbt from 'fbt';

/**
 * Currently fails with the following:
 * Found differences in evaluator results
 *   Non-forget (expected):
 *   (kind: ok) <div><span>Jason !</span></div>
 *   Forget:
 *   (kind: ok) <div><span>Jason!</span></div>

 */

function Foo(props) {
  return (
    // prettier-ignore
    <div>
      <fbt desc={"Dialog to show to user"}>
        <span>
          <fbt:param name="user name">
            {props.name}
          </fbt:param>
        !
        </span>
      </fbt>
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{name: 'Jason'}],
};
