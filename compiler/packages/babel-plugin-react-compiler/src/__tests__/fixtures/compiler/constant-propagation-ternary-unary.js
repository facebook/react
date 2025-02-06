// @enableTernaryConstantPropagation
import {Stringify} from 'shared-runtime';

function foo() {
  let _b;
  const b = true;
  _b = !b ? 'bar' : false ? 'foo' : 'baz';

  return (
    <Stringify
      value={{
        _b,
        b0: !true,
        n0: !0,
        n1: !1,
        n2: !2,
        n3: !-1,
        s0: !'',
        s1: !'a',
        s2: !'ab',
        u: !undefined,
        n: !null,
      }}
    />
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [],
  isComponent: false,
};
