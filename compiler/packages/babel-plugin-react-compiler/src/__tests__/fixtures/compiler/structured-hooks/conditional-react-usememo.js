// @enableEmitStructuredHooks @target:"18"

import * as React from 'react';

function Foo(props) {
  'use structured hooks';

  if (!props.showBadge) {
    return <div>hidden</div>;
  }

  const label = React.useMemo(() => props.label.toUpperCase(), [props.label]);
  return <div>{label}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{label: 'ada', showBadge: true}],
};