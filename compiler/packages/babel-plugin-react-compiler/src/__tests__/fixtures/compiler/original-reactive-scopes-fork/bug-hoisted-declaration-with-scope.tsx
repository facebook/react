// @enableReactiveScopesInHIR:false
import {StaticText1, Stringify, identity, useHook} from 'shared-runtime';
/**
 * `button` and `dispatcher` must end up in the same memo block. It would be
 * invalid for `button` to take a dependency on `dispatcher` as dispatcher
 * is created later.
 *
 * Sprout error:
 * Found differences in evaluator results
 * Non-forget (expected):
 * (kind: ok) "[[ function params=1 ]]"
 * Forget:
 * (kind: exception) Cannot access 'dispatcher' before initialization
 */
function useFoo({onClose}) {
  const button = StaticText1 ?? (
    <Stringify
      primary={{
        label: identity('label'),
        onPress: onClose,
      }}
      secondary={{
        onPress: () => {
          dispatcher.go('route2');
        },
      }}
    />
  );

  const dispatcher = useHook();

  return button;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{onClose: identity()}],
};
