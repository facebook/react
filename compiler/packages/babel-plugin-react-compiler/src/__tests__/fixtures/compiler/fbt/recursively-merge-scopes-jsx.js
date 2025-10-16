// @flow
import {fbt} from 'fbt';

function Example({x}) {
  // "Inner Text" needs to be visible to fbt: the <Bar> element cannot
  // be memoized separately
  return (
    <fbt desc="Description">
      Outer Text
      <Foo x={x}>
        <Bar>Inner Text</Bar>
      </Foo>
    </fbt>
  );
}
