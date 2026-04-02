import {Stringify as $} from 'shared-runtime';

// Regression test: when $ is imported as a binding, the compiler should not
// use $ as the name for its synthesized memo cache variable — that would
// shadow the import. The memo cache should be renamed to $0 (or similar).
// See https://github.com/facebook/react/issues/36167

function Component({x}: {x: number}) {
  return <$ value={x} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{x: 1}],
};
