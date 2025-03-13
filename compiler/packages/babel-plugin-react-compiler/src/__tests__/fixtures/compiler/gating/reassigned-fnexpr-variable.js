// @gating
import * as React from 'react';

/**
 * Test that the correct `Foo` is printed
 */
let Foo = () => <div>hello world 1!</div>;
const MemoFoo = React.memo(Foo);
Foo = () => <div>hello world 2!</div>;

export const FIXTURE_ENTRYPOINT = {
  fn: () => <MemoFoo />,
  params: [],
};
